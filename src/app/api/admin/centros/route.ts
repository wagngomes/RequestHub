import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, isAdmin } from "@/lib/auth-server";
import { adminCentroSchema } from "@/lib/validations/admin";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const centros = await prisma.centroDistribuicao.findMany({
    orderBy: { codigo: "asc" },
  });

  return NextResponse.json({ data: centros });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await request.json();
  const parsed = adminCentroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const { codigo, label } = parsed.data;

  const existing = await prisma.centroDistribuicao.findUnique({ where: { codigo } });
  if (existing) return NextResponse.json({ error: "Centro com este código já existe" }, { status: 409 });

  const centro = await prisma.centroDistribuicao.create({ data: { codigo, label } });
  return NextResponse.json({ data: centro }, { status: 201 });
}
