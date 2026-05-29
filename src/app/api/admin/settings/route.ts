import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, isAdmin } from "@/lib/auth-server";
import { z } from "zod";

const KNOWN_KEYS = [
  "notificationEmails",
  "notificationEmailsTransferencia",
  "notificationEmailsLiberacao",
] as const;

type KnownKey = (typeof KNOWN_KEYS)[number];

const settingsSchema = z.object({
  notificationEmails:               z.string().optional(),
  notificationEmailsTransferencia:  z.string().optional(),
  notificationEmailsLiberacao:      z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") as KnownKey | null;

  if (key && KNOWN_KEYS.includes(key)) {
    const config = await prisma.appConfig.findUnique({ where: { key } });
    return NextResponse.json({ data: { [key]: config?.value ?? "" } });
  }

  // Retorna todas as chaves conhecidas
  const configs = await prisma.appConfig.findMany({
    where: { key: { in: [...KNOWN_KEYS] } },
  });

  const data = Object.fromEntries(
    KNOWN_KEYS.map((k) => [k, configs.find((c) => c.key === k)?.value ?? ""])
  );

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const updates: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) {
      const emails = v.split(";").map((e) => e.trim()).filter((e) => e.length > 0);
      updates[k] = emails.join(";");
    }
  }

  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.appConfig.upsert({
        where:  { key },
        update: { value },
        create: { key, value },
      })
    )
  );

  return NextResponse.json({ data: updates });
}
