import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, isPlanejamento } from "@/lib/auth-server";
import { liberacaoItemStatusSchema } from "@/lib/validations/liberacao";
import { sendStatusAtualizadoEmail } from "@/lib/email/send";

type Params = { params: Promise<{ itemId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { itemId } = await params;

  const item = await prisma.liberacao.findUnique({
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
  const parsed = liberacaoItemStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const item = await prisma.liberacao.findUnique({
    where: { id: itemId },
    include: {
      solicitacao: { include: { user: true } },
    },
  });
  if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const updated = await prisma.liberacao.update({
    where: { id: itemId },
    data: { status: parsed.data.status },
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
    tipo: `Liberação (item ${item.codigo})`,
    novoStatus: parsed.data.status,
    id: item.solicitacaoId,
  });

  return NextResponse.json({ data: updated });
}
