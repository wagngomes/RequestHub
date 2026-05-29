import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.user.updateMany({
    where: {
      OR: [
        { email: { contains: "wagner" } },
        { nome:  { contains: "Wagner" } },
        { name:  { contains: "Wagner" } },
      ],
    },
    data: { role: "ADMIN" },
  });

  console.log(`✅ ${updated.count} usuário(s) atualizado(s) para ADMIN`);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { contains: "wagner" } },
        { nome:  { contains: "Wagner" } },
      ],
    },
    select: { id: true, nome: true, email: true, role: true },
  });

  console.log("Usuário:", user);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
