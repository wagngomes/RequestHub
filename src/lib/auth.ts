import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    updateAge: 60 * 60 * 24,      // Atualiza sessão a cada 24h
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,             // Cache de 5 min
    },
  },
  user: {
    additionalFields: {
      nome: {
        type: "string",
        required: true,
        defaultValue: "",
      },
      setor: {
        type: "string",
        required: true,
        defaultValue: "OUTRO",
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
      },
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
