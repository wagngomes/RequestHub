import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-server";

// GET /api/slas — lista todos os SLAs (qualquer usuário autenticado)
export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const slas = await prisma.sla.findMany({ orderBy: [{ origem: "asc" }, { destino: "asc" }] });
  return NextResponse.json({ data: slas });
}
