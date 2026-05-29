import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, isAdmin } from "@/lib/auth-server";
import { adminSlaSchema } from "@/lib/validations/admin";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const parsed = adminSlaSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.sla.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "SLA não encontrado" }, { status: 404 });

  const updated = await prisma.sla.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;
  const existing = await prisma.sla.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "SLA não encontrado" }, { status: 404 });

  await prisma.sla.delete({ where: { id } });
  return NextResponse.json({ message: "SLA excluído com sucesso" });
}
