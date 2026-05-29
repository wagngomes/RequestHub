import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, isPlanejamento } from "@/lib/auth-server";
import { transferenciaItemStatusSchema } from "@/lib/validations/transferencia";
import { sendStatusAtualizadoEmail } from "@/lib/email/send";

type Params = { params: Promise<{ itemId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { itemId } = await params;

  const item = await prisma.transferencia.findUnique({
    where: { id: itemId },
    include: {
      solicitacao: {
        include: {
          user: { select: { id: true, nome: true, email: true, setor: true } },
        },
      },
    },
  });

  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  if (!isPlanejamento(session) && item.solicitacao.userId !== session.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  return NextResponse.json({ data: item });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (!isPlanejamento(session)) {
    return NextResponse.json(
      { error: "Acesso negado. Somente o Planejamento pode atualizar o status." },
      { status: 403 }
    );
  }

  const { itemId } = await params;

  const body = await request.json();
  const parsed = transferenciaItemStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const item = await prisma.transferencia.findUnique({
    where: { id: itemId },
    include: {
      solicitacao: { include: { user: true } },
    },
  });
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const updateData: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "PROCESSADA" && parsed.data.notaFiscal) {
    updateData.notaFiscal = parsed.data.notaFiscal.trim();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await (prisma.transferencia.update as any)({
    where: { id: itemId },
    data: updateData,
    include: {
      solicitacao: {
        include: {
          user: { select: { id: true, nome: true, email: true, setor: true } },
        },
      },
    },
  });

  await sendStatusAtualizadoEmail({
    destinatario: item.solicitacao.user.email,
    nome: item.solicitacao.user.nome,
    tipo: `Transferência (item ${item.codigo})`,
    novoStatus: parsed.data.status,
    notaFiscal: parsed.data.notaFiscal,
    id: item.solicitacaoId,
  });

  return NextResponse.json({ data: updated });
}
