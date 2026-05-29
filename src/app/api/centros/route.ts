import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-server";

// GET /api/centros — lista todos os centros de distribuição (qualquer usuário autenticado)
export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const centros = await prisma.centroDistribuicao.findMany({
    orderBy: { codigo: "asc" },
  });

  return NextResponse.json({ data: centros });
}
