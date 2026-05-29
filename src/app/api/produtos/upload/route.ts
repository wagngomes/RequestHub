import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession, isPlanejamento } from "@/lib/auth-server";
import Papa from "papaparse";

interface ProductCSVRow {
  codigo?: string;
  descricao?: string;
  marca?: string;
  refrigerado?: string;
  controlado?: string;
  cmv?: string;
  supridor?: string;
  tributacao?: string;
  multiplo?: number;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  if (!isPlanejamento(session)) {
    return NextResponse.json(
      { error: "Somente o setor de Planejamento pode importar produtos." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  if (!file.name.endsWith(".csv")) {
    return NextResponse.json({ error: "Formato inválido. Envie um arquivo .csv" }, { status: 400 });
  }

  const text = await file.text();

  const { data, errors } = Papa.parse<ProductCSVRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Erro ao parsear CSV", details: errors.slice(0, 5) },
      { status: 422 }
    );
  }

  // Validar e limpar dados
  const rows = data.filter((row) => row.codigo && row.descricao);

  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV sem dados válidos. Verifique as colunas: codigo, descricao, marca, refrigerado, controlado, cmv, supridor, tributacao, multiplo" }, { status: 422 });
  }

  // Substituir tudo: deletar e reinserir

  /*
  await prisma.$transaction(async (tx) => {
  */
    // Desassociar transferencias e liberacoes dos produtos antes de deletar
    await prisma.product.deleteMany({});

    await prisma.product.createMany({
      data: rows.map((row) => ({
        codigo: String(row.codigo!).trim().toUpperCase(),
        descricao: String(row.descricao!).trim(),
        marca: String(row.marca ?? "").trim() || "SEM MARCA",
        refrigerado: row.refrigerado?.toUpperCase() === "S" ? "S" : "N",
        controlado: row.controlado?.toUpperCase() === "S" ? "S" : "N",
        cmv: parseFloat(String(row.cmv ?? "0").replace(",", ".")) || 0,
        supridor: String(row.supridor ?? "").trim() || "SEM SUPRIMIDOR",
        tributacao: String(row.tributacao ?? "").trim() || "SEM TRIBUTACAO",
        multiplo: Number(row.multiplo) || 1,
      })),
    });

/*
  });

  */

  return NextResponse.json({
    message: "Importação concluída com sucesso",
    count: rows.length,
  });
}
