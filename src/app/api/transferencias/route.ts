import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, isPlanejamento } from "@/lib/auth-server";
import { solicitacaoTransferenciaSchema } from "@/lib/validations/transferencia";
import { generateSolicitacaoId } from "@/lib/id";
import { sendNovaSolicitacaoEmail, sendConfirmacaoSolicitacaoEmail, type ItemComPrevisao } from "@/lib/email/send";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page     = Math.max(1, Number(searchParams.get("page")  ?? "1"));
  const limit    = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "10")));
  const search   = searchParams.get("search")   ?? "";
  const supridor = searchParams.get("supridor") ?? "";
  const status   = searchParams.get("status") as "PENDENTE" | "PROCESSADA" | null;
  const skip     = (page - 1) * limit;

  // Filtro por item (task-04: uma linha por item, status por item)
  const where = {
    ...(isPlanejamento(session) ? {} : { solicitacao: { userId: session.id } }),
    ...(status ? { status } : {}),
    ...(supridor ? { produto: { supridor: { contains: supridor } } } : {}),
    ...(search
      ? {
          OR: [
            { solicitacaoId: { contains: search } },
            { codigo:        { contains: search } },
            { descricao:     { contains: search } },
            { origem:        { contains: search } },
            { destino:       { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.transferencia.findMany({
      where,
      include: {
        solicitacao: {
          include: {
            user: { select: { id: true, nome: true, email: true, setor: true } },
          },
        },
        produto: { select: { supridor: true, tributacao: true, multiplo: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.transferencia.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const parsed = solicitacaoTransferenciaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  // Verificar se todos os produtos existem
  const codigos = [...new Set(parsed.data.itens.map((i) => i.codigo))];
  const produtos = await prisma.product.findMany({ where: { codigo: { in: codigos } } });
  const codigosEncontrados = new Set(produtos.map((p) => p.codigo));
  const faltando = codigos.filter((c) => !codigosEncontrados.has(c));

  if (faltando.length > 0) {
    return NextResponse.json(
      { error: `Produto(s) não encontrado(s): ${faltando.join(", ")}` },
      { status: 404 }
    );
  }

  // Gerar ID único (retry em caso raro de colisão)
  let id = generateSolicitacaoId();
  let tentativas = 0;
  while (tentativas < 5) {
    const existe = await prisma.solicitacaoTransferencia.findUnique({ where: { id } });
    if (!existe) break;
    id = generateSolicitacaoId();
    tentativas++;
  }

  const solicitacao = await prisma.solicitacaoTransferencia.create({
    data: {
      id,
      obs: parsed.data.obs,
      userId: session.id,
      itens: {
        create: parsed.data.itens.map((item) => ({
          codigo:     item.codigo,
          descricao:  item.descricao,
          controlado: item.controlado,
          refrigerado: item.refrigerado,
          origem:     item.origem,
          destino:    item.destino,
          quantidade: item.quantidade,
        })),
      },
    },
    include: {
      user: { select: { id: true, nome: true, email: true, setor: true } },
      itens: true,
      _count: { select: { itens: true } },
    },
  });

  // Buscar SLAs para calcular previsão de chegada (dias úteis)
  const pares = parsed.data.itens.map((i) => ({ origem: i.origem, destino: i.destino }));
  const slas  = await prisma.sla.findMany({
    where: { OR: pares },
  });
  const slaMap = new Map(slas.map((s) => [`${s.origem}|${s.destino}`, s.sla]));

  function addBusinessDays(date: Date, days: number): Date {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      const dow = result.getDay();
      if (dow !== 0 && dow !== 6) added++;
    }
    return result;
  }

  const hoje = new Date();
  const produtosMap = new Map(produtos.map((p) => [p.codigo, p]));

  const itensComPrevisao: ItemComPrevisao[] = solicitacao.itens.map((item) => {
    const sla = slaMap.get(`${item.origem}|${item.destino}`);
    const produto = produtosMap.get(item.codigo);
    const previsaoDate = sla ? addBusinessDays(hoje, sla) : null;
    const previsaoStr = previsaoDate
      ? previsaoDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
      : undefined;
    return {
      codigo:          item.codigo,
      descricao:       produto?.descricao ?? item.descricao,
      origem:          item.origem,
      destino:         item.destino,
      quantidade:      item.quantidade,
      previsaoChegada: previsaoStr,
    };
  });

  // Persistir dataPrevisaoChegada em cada item (campo adicionado na task-14)
  await Promise.all(
    solicitacao.itens.map((item, idx) => {
      const previsao = itensComPrevisao[idx]?.previsaoChegada;
      if (!previsao) return Promise.resolve();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (prisma.transferencia.update as any)({
        where: { id: item.id },
        data:  { dataPrevisaoChegada: previsao },
      });
    })
  );

  const resumo = parsed.data.itens
    .map((i) => `${i.codigo} — ${i.origem} → ${i.destino} (${i.quantidade}un)`)
    .join("; ");

  await Promise.all([
    sendNovaSolicitacaoEmail({
      tipo: "transferencia",
      solicitante: session.nome,
      detalhes: resumo,
      id: solicitacao.id,
      itensComPrevisao,
    }),
    sendConfirmacaoSolicitacaoEmail({
      destinatario: session.email,
      nome: session.nome,
      tipo: "transferencia",
      id: solicitacao.id,
      detalhes: resumo,
      itensComPrevisao,
    }),
  ]);

  return NextResponse.json({ data: solicitacao }, { status: 201 });
}
