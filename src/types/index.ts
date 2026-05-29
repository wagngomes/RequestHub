import type {
  User,
  Transferencia,
  Liberacao,
  Product,
  SolicitacaoTransferencia,
  SolicitacaoLiberacao,
  Sla,
} from "@prisma/client";

export type { User, Transferencia, Liberacao, Product, SolicitacaoTransferencia, SolicitacaoLiberacao, Sla };

// ── Tipos de valor (ex-enums) ──
export type Role = "ADMIN" | "USER";
export type Sn = "S" | "N";
export type Status = "PENDENTE" | "PROCESSADA";
export type Sistema = "MONEY" | "SALESFORCE" | "MONEY_SALESFORCE";
export type Acao = "HABILITAR" | "DESABILITAR";
export type Retorno = "APROVADA" | "REPROVADA";
export type Setor = "PLANEJAMENTO" | "COMERCIAL" | "OPERACOES" | "OUTRO";

// ── Item de transferência com contexto da solicitação ──
// (task-04: tabela mostra uma linha por item)
export type TransferenciaItemWithSolicitacao = Transferencia & {
  solicitacao: SolicitacaoTransferencia & {
    user: Pick<User, "id" | "nome" | "email" | "setor">;
  };
  produto: Pick<Product, "supridor" | "tributacao" | "multiplo">;
};

// ── Item de liberação com contexto da solicitação ──
export type LiberacaoItemWithSolicitacao = Liberacao & {
  solicitacao: SolicitacaoLiberacao & {
    user: Pick<User, "id" | "nome" | "email" | "setor">;
  };
};

// ── Tipos legados (usados nos modais de VIEW) ──
export type TransferenciaItem = Transferencia;
export type LiberacaoItem = Liberacao;

// ── Solicitação de Transferência com itens e usuário (para modal VIEW) ──
export type SolicitacaoTransferenciaWithDetails = SolicitacaoTransferencia & {
  user: Pick<User, "id" | "nome" | "email" | "setor">;
  itens: TransferenciaItem[];
  _count: { itens: number };
};

// ── Solicitação de Liberação com itens e usuário (para modal VIEW) ──
export type SolicitacaoLiberacaoWithDetails = SolicitacaoLiberacao & {
  user: Pick<User, "id" | "nome" | "email" | "setor">;
  itens: LiberacaoItem[];
  _count: { itens: number };
};

// ── Tipos de resposta de API ──
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Parâmetros de query ──
export interface TableFilters {
  search?: string;
  status?: Status;
  page?: number;
  limit?: number;
}

// ── Tipo de sessão do BetterAuth ──
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  nome: string;
  setor: Setor;
  role: Role;
}
