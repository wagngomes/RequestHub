import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, isAdmin } from "@/lib/auth-server";

/**
 * DELETE /api/admin/products/clear
 * Remove todos os produtos que NÃO estão referenciados por transferências ou liberações.
 * Produtos em uso são ignorados e reportados no retorno.
 */
export async function DELETE() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  // Busca códigos que ainda possuem referências
  const [emTransferencias, emLiberacoes] = await Promise.all([
    prisma.transferencia.findMany({ select: { codigo: true }, distinct: ["codigo"] }),
    prisma.liberacao.findMany({ select: { codigo: true }, distinct: ["codigo"] }),
  ]);

  const emUso = new Set([
    ...emTransferencias.map((t) => t.codigo),
    ...emLiberacoes.map((l) => l.codigo),
  ]);

  // Remove apenas os que não estão em uso
  const { count } = await prisma.product.deleteMany({
    where: { codigo: { notIn: Array.from(emUso) } },
  });

  return NextResponse.json({
    deleted: count,
    skipped: emUso.size,
    message:
      emUso.size > 0
        ? `${count} produto(s) removido(s). ${emUso.size} produto(s) em uso foram mantidos.`
        : `${count} produto(s) removido(s).`,
  });
}
