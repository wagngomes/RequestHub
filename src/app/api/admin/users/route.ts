import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, isAdmin } from "@/lib/auth-server";
import { auth } from "@/lib/auth";
import { adminUserCreateSchema } from "@/lib/validations/admin";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: { id: true, nome: true, name: true, email: true, setor: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: users });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await request.json();
  const parsed = adminUserCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const { nome, email, password, setor, role } = parsed.data;

  // Verificar se o e-mail já está em uso
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
  }

  // Criar usuário via BetterAuth (garante hashing correto da senha)
  const signUpResponse = await auth.api.signUpEmail({
    body: { email, password, name: nome, nome, setor, role },
    headers: new Headers({ "content-type": "application/json" }),
    asResponse: true,
  });

  if (!signUpResponse.ok) {
    const err = await signUpResponse.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as { message?: string }).message ?? "Erro ao criar usuário" },
      { status: 400 }
    );
  }

  // Ajustar role e setor diretamente (campos extras podem não ser persistidos pelo BetterAuth)
  const created = await prisma.user.findUnique({ where: { email } });
  if (created) {
    await prisma.user.update({
      where: { id: created.id },
      data: { role, setor, nome },
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, nome: true, email: true, setor: true, role: true, createdAt: true },
  });

  return NextResponse.json({ data: user }, { status: 201 });
}
