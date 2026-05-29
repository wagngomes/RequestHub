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
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Liberacao_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "SolicitacaoLiberacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Liberacao_codigo_fkey" FOREIGN KEY ("codigo") REFERENCES "Product" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Liberacao" ("centro", "clienteUF", "cnpjCod", "codigo", "contribuinte", "createdAt", "descricao", "grupo2", "id", "linkPedidoCompl", "quantidade", "solicitacaoId", "updatedAt", "valor") SELECT "centro", "clienteUF", "cnpjCod", "codigo", "contribuinte", "createdAt", "descricao", "grupo2", "id", "linkPedidoCompl", "quantidade", "solicitacaoId", "updatedAt", "valor" FROM "Liberacao";
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
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transferencia_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "SolicitacaoTransferencia" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transferencia_codigo_fkey" FOREIGN KEY ("codigo") REFERENCES "Product" ("codigo") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Transferencia" ("codigo", "controlado", "createdAt", "descricao", "destino", "id", "origem", "quantidade", "refrigerado", "solicitacaoId", "updatedAt") SELECT "codigo", "controlado", "createdAt", "descricao", "destino", "id", "origem", "quantidade", "refrigerado", "solicitacaoId", "updatedAt" FROM "Transferencia";
DROP TABLE "Transferencia";
ALTER TABLE "new_Transferencia" RENAME TO "Transferencia";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
