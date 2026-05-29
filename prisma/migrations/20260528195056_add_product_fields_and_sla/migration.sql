-- CreateTable
CREATE TABLE "Sla" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "origem" TEXT NOT NULL,
    "siglaOrigem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "siglaDestino" TEXT NOT NULL,
    "sla" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "codigo" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "refrigerado" TEXT NOT NULL DEFAULT 'N',
    "controlado" TEXT NOT NULL DEFAULT 'N',
    "cmv" REAL NOT NULL DEFAULT 0,
    "tributacao" TEXT NOT NULL DEFAULT '-',
    "supridor" TEXT NOT NULL DEFAULT '-',
    "multiplo" INTEGER NOT NULL DEFAULT 1
);
INSERT INTO "new_Product" ("cmv", "codigo", "controlado", "descricao", "marca", "refrigerado") SELECT "cmv", "codigo", "controlado", "descricao", "marca", "refrigerado" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_codigo_key" ON "Product"("codigo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Sla_origem_destino_key" ON "Sla"("origem", "destino");
