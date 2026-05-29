import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import type { SessionUser, Setor, Role } from "@/types";

/**
 * Obtém a sessão em Server Components e Route Handlers
 */
export async function getServerSession(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    nome: user.nome ?? user.name ?? "",
    setor: (user.setor ?? "OUTRO") as Setor,
    role: (user.role ?? "USER") as Role,
  };
}

/**
 * Obtém a sessão a partir de um NextRequest (middleware)
 */
export async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionUser | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    nome: user.nome ?? user.name ?? "",
    setor: (user.setor ?? "OUTRO") as Setor,
    role: (user.role ?? "USER") as Role,
  };
}

/**
 * Verifica se o usuário é do setor de planejamento
 */
export function isPlanejamento(user: SessionUser): boolean {
  return user.setor === "PLANEJAMENTO";
}

/**
 * Verifica se o usuário tem papel de ADMIN
 */
export function isAdmin(user: SessionUser): boolean {
  return user.role === "ADMIN";
}
