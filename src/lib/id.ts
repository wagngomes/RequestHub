import { customAlphabet } from "nanoid";

/**
 * Gera um ID humano-legível de 8 caracteres.
 * Alfabeto sem caracteres ambíguos (0/O, 1/I).
 * Exemplo: "H7K3M9NP"
 */
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export function generateSolicitacaoId(): string {
  return nanoid();
}
