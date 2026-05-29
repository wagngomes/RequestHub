import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { codigo } = await params;

  const produto = await prisma.product.findUnique({
    where: { codigo: codigo.toUpperCase() },
    select: {
      codigo: true,
      descricao: true,
      marca: true,
      refrigerado: true,
      controlado: true,
      cmv: true,
      multiplo: true,
      tributacao: true,
    },
  });

  if (!produto) {
    return NextResponse.json(
      { error: "Produto não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: produto });
}
