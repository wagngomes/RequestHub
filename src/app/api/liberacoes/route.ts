import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, isPlanejamento } from "@/lib/auth-server";
import { solicitacaoLiberacaoSchema } from "@/lib/validations/liberacao";
import { generateSolicitacaoId } from "@/lib/id";
import { sendNovaSolicitacaoEmail, sendConfirmacaoSolicitacaoEmail } from "@/lib/email/send";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page  = Math.max(1, Number(searchParams.get("page")  ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "10")));
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") as "PENDENTE" | "PROCESSADA" | null;
  const skip = (page - 1) * limit;

  // Filtro por item (task-04: uma linha por item, status por item)
  const where = {
    ...(isPlanejamento(session) ? {} : { solicitacao: { userId: session.id } }),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { solicitacaoId: { contains: search } },
            { codigo:        { contains: search } },
            { descricao:     { contains: search } },
            { solicitacao: { OR: [
              { contrato:    { contains: search } },
              { grupo:       { contains: search } },
              { solicitante: { contains: search } },
            ]}},
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.liberacao.findMany({
      where,
      include: {
        solicitacao: {
          include: {
            user: { select: { id: true, nome: true, email: true, setor: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.liberacao.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const parsed = solicitacaoLiberacaoSchema.safeParse(body);

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

  let id = generateSolicitacaoId();
  let tentativas = 0;
  while (tentativas < 5) {
    const existe = await prisma.solicitacaoLiberacao.findUnique({ where: { id } });
    if (!existe) break;
    id = generateSolicitacaoId();
    tentativas++;
  }

  const { itens, obs, ...cabecalho } = parsed.data;

  const solicitacao = await prisma.solicitacaoLiberacao.create({
    data: {
      id,
      ...cabecalho,
      obs,
      solicitante: session.nome,
      email: session.email,
      userId: session.id,
      itens: {
        create: itens.map((item) => ({
          codigo:         item.codigo,
          descricao:      item.descricao,
          contribuinte:   item.contribuinte,
          clienteUF:      item.clienteUF,
          centro:         item.centro,
          cnpjCod:        item.cnpjCod,
          grupo2:         item.grupo2,
          quantidade:     item.quantidade,
          valor:          item.valor,
          linkPedidoCompl: item.linkPedidoCompl,
        })),
      },
    },
    include: {
      user: { select: { id: true, nome: true, email: true, setor: true } },
      itens: true,
      _count: { select: { itens: true } },
    },
  });

  const detalhesLiberacao = `Contrato: ${cabecalho.contrato} | Ação: ${cabecalho.acao} | ${itens.length} item(ns)`;

  await Promise.all([
    sendNovaSolicitacaoEmail({
      tipo: "liberacao",
      solicitante: session.nome,
      detalhes: detalhesLiberacao,
      id: solicitacao.id,
    }),
    sendConfirmacaoSolicitacaoEmail({
      destinatario: session.email,
      nome: session.nome,
      tipo: "liberacao",
      id: solicitacao.id,
      detalhes: detalhesLiberacao,
    }),
  ]);

  return NextResponse.json({ data: solicitacao }, { status: 201 });
}
