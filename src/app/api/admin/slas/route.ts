import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, isAdmin } from "@/lib/auth-server";
import { adminSlaSchema } from "@/lib/validations/admin";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const slas = await prisma.sla.findMany({ orderBy: [{ origem: "asc" }, { destino: "asc" }] });
  return NextResponse.json({ data: slas });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await request.json();
  const parsed = adminSlaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.sla.findUnique({
    where: { origem_destino: { origem: parsed.data.origem, destino: parsed.data.destino } },
  });
  if (existing) {
    return NextResponse.json({ error: "Já existe um SLA para este par origem/destino" }, { status: 409 });
  }

  const sla = await prisma.sla.create({ data: parsed.data });
  return NextResponse.json({ data: sla }, { status: 201 });
}
