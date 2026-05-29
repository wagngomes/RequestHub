import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // Produtos de exemplo
  const produtos = [
    { codigo: "PROD001", descricao: "Antibiótico Amoxicilina 500mg", marca: "EMS", refrigerado: "N" as const, controlado: "S" as const, cmv: 12.5 },
    { codigo: "PROD002", descricao: "Dipirona Sódica 500mg", marca: "Medley", refrigerado: "N" as const, controlado: "N" as const, cmv: 3.2 },
    { codigo: "PROD003", descricao: "Insulina NPH 100UI/ml", marca: "Novo Nordisk", refrigerado: "S" as const, controlado: "S" as const, cmv: 45.0 },
    { codigo: "PROD004", descricao: "Paracetamol 750mg", marca: "Medley", refrigerado: "N" as const, controlado: "N" as const, cmv: 2.8 },
    { codigo: "PROD005", descricao: "Omeprazol 20mg", marca: "EMS", refrigerado: "N" as const, controlado: "N" as const, cmv: 8.9 },
    { codigo: "PROD006", descricao: "Atenolol 50mg", marca: "Biosintetica", refrigerado: "N" as const, controlado: "N" as const, cmv: 6.4 },
    { codigo: "PROD007", descricao: "Metformina 850mg", marca: "Merck", refrigerado: "N" as const, controlado: "N" as const, cmv: 9.1 },
    { codigo: "PROD008", descricao: "Loratadina 10mg", marca: "Schering", refrigerado: "N" as const, controlado: "N" as const, cmv: 4.5 },
  ];

  for (const produto of produtos) {
    await prisma.product.upsert({
      where: { codigo: produto.codigo },
      update: { descricao: produto.descricao, marca: produto.marca, cmv: produto.cmv },
      create: produto,
    });
  }
  console.log(`✅ ${produtos.length} produtos verificados`);

  // Centros de distribuição
  const centros = [
    { codigo: "CD-SP-01", label: "CD São Paulo 01 - Guarulhos" },
    { codigo: "CD-SP-02", label: "CD São Paulo 02 - Osasco" },
    { codigo: "CD-RJ-01", label: "CD Rio de Janeiro 01 - Duque de Caxias" },
    { codigo: "CD-MG-01", label: "CD Minas Gerais 01 - Contagem" },
    { codigo: "CD-RS-01", label: "CD Rio Grande do Sul 01 - Canoas" },
    { codigo: "CD-PR-01", label: "CD Paraná 01 - São José dos Pinhais" },
    { codigo: "CD-SC-01", label: "CD Santa Catarina 01 - Joinville" },
    { codigo: "CD-BA-01", label: "CD Bahia 01 - Camaçari" },
    { codigo: "CD-PE-01", label: "CD Pernambuco 01 - Recife" },
    { codigo: "CD-CE-01", label: "CD Ceará 01 - Fortaleza" },
    { codigo: "CD-GO-01", label: "CD Goiás 01 - Anápolis" },
    { codigo: "CD-DF-01", label: "CD Distrito Federal 01 - Brasília" },
  ];

  for (const centro of centros) {
    await prisma.centroDistribuicao.upsert({
      where: { codigo: centro.codigo },
      update: { label: centro.label },
      create: centro,
    });
  }
  console.log(`✅ ${centros.length} centros de distribuição verificados`);

  console.log("");
  console.log("📝 Para criar usuários, acesse a tela de cadastro em /login");
  console.log("   Para tornar um usuário ADMIN, edite o campo role diretamente no banco");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
