import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, isAdmin } from "@/lib/auth-server";
import { adminProductSchema } from "@/lib/validations/admin";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page  = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
  const skip  = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { codigo:    { contains: search } },
          { descricao: { contains: search } },
          { marca:     { contains: search } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { codigo: "asc" }, skip, take: limit }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await request.json();
  const parsed = adminProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const codigo = parsed.data.codigo.trim().toUpperCase();
  const existing = await prisma.product.findUnique({ where: { codigo } });
  if (existing) return NextResponse.json({ error: "Produto com este código já existe" }, { status: 409 });

  const product = await prisma.product.create({ data: { ...parsed.data, codigo } });
  return NextResponse.json({ data: product }, { status: 201 });
}
