import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, isPlanejamento } from "@/lib/auth-server";
import { transferenciaStatusSchema } from "@/lib/validations/transferencia";
import { sendStatusAtualizadoEmail } from "@/lib/email/send";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const item = await prisma.solicitacaoTransferencia.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, nome: true, email: true, setor: true } },
      itens: true,
      _count: { select: { itens: true } },
    },
  });

  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  if (!isPlanejamento(session) && item.userId !== session.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  return NextResponse.json({ data: item });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (!isPlanejamento(session)) {
    return NextResponse.json(
      { error: "Acesso negado. Somente o Planejamento pode atualizar o status." },
      { status: 403 }
    );
  }

  const { id } = await params;

  const body = await request.json();
  const parsed = transferenciaStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const solicitacao = await prisma.solicitacaoTransferencia.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!solicitacao) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const updated = await prisma.solicitacaoTransferencia.update({
    where: { id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.obs !== undefined ? { obs: parsed.data.obs } : {}),
    },
    include: {
      user: { select: { id: true, nome: true, email: true, setor: true } },
      itens: true,
      _count: { select: { itens: true } },
    },
  });

  await sendStatusAtualizadoEmail({
    destinatario: solicitacao.user.email,
    nome: solicitacao.user.nome,
    tipo: "Transferência",
    novoStatus: parsed.data.status,
    id: solicitacao.id,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  const item = await prisma.solicitacaoTransferencia.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  if (!isPlanejamento(session) && item.userId !== session.id) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  // Cascade deleta os itens automaticamente (onDelete: Cascade no schema)
  await prisma.solicitacaoTransferencia.delete({ where: { id } });
  return NextResponse.json({ message: "Excluído com sucesso" });
}
