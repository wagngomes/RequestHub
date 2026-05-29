import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, isAdmin } from "@/lib/auth-server";
import { adminConstantesSchema } from "@/lib/validations/admin";

const SINGLETON_ID = "singleton";

// GET /api/admin/constantes — retorna o registro singleton de constantes
export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const constantes = await (prisma as any).constantes.upsert({
    where:  { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID, minimoTransferencia: 0, minimoPitagoras: 0 },
  });

  return NextResponse.json({ data: constantes });
}

// PATCH /api/admin/constantes — atualiza os valores das constantes
export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await request.json();
  const parsed = adminConstantesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const constantes = await (prisma as any).constantes.upsert({
    where:  { id: SINGLETON_ID },
    update: { minimoTransferencia: parsed.data.minimoTransferencia, minimoPitagoras: parsed.data.minimoPitagoras },
    create: { id: SINGLETON_ID, minimoTransferencia: parsed.data.minimoTransferencia, minimoPitagoras: parsed.data.minimoPitagoras },
  });

  return NextResponse.json({ data: constantes });
}
