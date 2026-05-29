/*
  Warnings:

  - You are about to drop the column `acao` on the `Liberacao` table. All the data in the column will be lost.
  - You are about to drop the column `contrato` on the `Liberacao` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `Liberacao` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Liberacao` table. All the data in the column will be lost.
  - You are about to drop the column `grupo` on the `Liberacao` table. All the data in the column will be lost.
  - You are about to drop the column `moneyOuSalesforce` on the `Liberacao` table. All the data in the column will be lost.
  - You are about to drop the column `obs` on the `Liberacao` table. All the data in the column will be lost.
  - You are about to drop the column `representante` on the `Liberacao` table. All the data in the column will be lost.
  - You are about to drop the column `retornoPlanejamento` on the `Liberacao` table. All the data in the column will be lost.
  - You are about to drop the column `solicitante` on the `Liberacao` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Liberacao` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Liberacao` table. All the data in the column will be lost.
  - You are about to drop the column `obs` on the `Transferencia` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Transferencia` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Transferencia` table. All the data in the column will be lost.
  - Added the required column `solicitacaoId` to the `Liberacao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `solicitacaoId` to the `Transferencia` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "SolicitacaoTransferencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "obs" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SolicitacaoTransferencia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SolicitacaoLiberacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "obs" TEXT,
    "solicitante" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "contrato" TEXT NOT NULL,
    "representante" TEXT NOT NULL,
    "moneyOuSalesforce" TEXT NOT NULL DEFAULT 'MONEY',
    "acao" TEXT NOT NULL DEFAULT 'HABILITAR',
    "retornoPlanejamento" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SolicitacaoLiberacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Liberacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitacaoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "contribuinte" TEXT NOT NULL DEFAULT 'N',
    "clienteUF" TEXT NOT NULL,
    "centro" TEXT NOT NULL,
    "cnpjCod" TEXT NOT NULL,
    "grupo2" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valor" REAL NOT NULL,
    "linkPedidoCompl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Liberacao_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "SolicitacaoLiberacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Liberacao_codigo_fkey" FOREIGN KEY ("codigo") REFERENCES "Product" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Liberacao" ("centro", "clienteUF", "cnpjCod", "codigo", "contribuinte", "createdAt", "descricao", "grupo2", "id", "linkPedidoCompl", "quantidade", "updatedAt", "valor") SELECT "centro", "clienteUF", "cnpjCod", "codigo", "contribuinte", "createdAt", "descricao", "grupo2", "id", "linkPedidoCompl", "quantidade", "updatedAt", "valor" FROM "Liberacao";
DROP TABLE "Liberacao";
ALTER TABLE "new_Liberacao" RENAME TO "Liberacao";
CREATE TABLE "new_Transferencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "solicitacaoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "controlado" TEXT NOT NULL DEFAULT 'N',
    "refrigerado" TEXT NOT NULL DEFAULT 'N',
    "origem" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transferencia_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "SolicitacaoTransferencia" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transferencia_codigo_fkey" FOREIGN KEY ("codigo") REFERENCES "Product" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Transferencia" ("codigo", "controlado", "createdAt", "descricao", "destino", "id", "origem", "quantidade", "refrigerado", "updatedAt") SELECT "codigo", "controlado", "createdAt", "descricao", "destino", "id", "origem", "quantidade", "refrigerado", "updatedAt" FROM "Transferencia";
DROP TABLE "Transferencia";
ALTER TABLE "new_Transferencia" RENAME TO "Transferencia";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
