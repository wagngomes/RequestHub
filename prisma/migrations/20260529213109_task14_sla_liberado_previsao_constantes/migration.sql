-- AlterTable
ALTER TABLE "Transferencia" ADD COLUMN "dataPrevisaoChegada" TEXT;

-- CreateTable
CREATE TABLE "Constantes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "minimoTransferencia" REAL NOT NULL DEFAULT 0,
    "minimoPitagoras" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sla" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "origem" TEXT NOT NULL,
    "siglaOrigem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "siglaDestino" TEXT NOT NULL,
    "sla" INTEGER NOT NULL,
    "liberado" TEXT NOT NULL DEFAULT 'S',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Sla" ("createdAt", "destino", "id", "origem", "siglaDestino", "siglaOrigem", "sla", "updatedAt") SELECT "createdAt", "destino", "id", "origem", "siglaDestino", "siglaOrigem", "sla", "updatedAt" FROM "Sla";
DROP TABLE "Sla";
ALTER TABLE "new_Sla" RENAME TO "Sla";
CREATE UNIQUE INDEX "Sla_origem_destino_key" ON "Sla"("origem", "destino");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
