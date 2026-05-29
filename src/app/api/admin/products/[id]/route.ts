import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, isAdmin } from "@/lib/auth-server";
import { adminProductSchema } from "@/lib/validations/admin";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params; // id = codigo
  const body = await request.json();
  const parsed = adminProductSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.product.findUnique({ where: { codigo: id } });
  if (!existing) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const updated = await prisma.product.update({
    where: { codigo: id },
    data: {
      ...(parsed.data.descricao !== undefined ? { descricao: parsed.data.descricao } : {}),
      ...(parsed.data.marca !== undefined ? { marca: parsed.data.marca } : {}),
      ...(parsed.data.refrigerado !== undefined ? { refrigerado: parsed.data.refrigerado } : {}),
      ...(parsed.data.controlado !== undefined ? { controlado: parsed.data.controlado } : {}),
      ...(parsed.data.cmv !== undefined ? { cmv: parsed.data.cmv } : {}),
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.product.findUnique({ where: { codigo: id } });
  if (!existing) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  await prisma.product.delete({ where: { codigo: id } });

  return NextResponse.json({ message: "Produto excluído com sucesso" });
}
