import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM    = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Retorna a lista de e-mails configurados para o tipo de solicitação.
 *  Tenta a chave específica primeiro; se vazia, cai para a chave legada. */
async function getNotificationEmails(tipo: "transferencia" | "liberacao"): Promise<string[]> {
  const specificKey = tipo === "transferencia"
    ? "notificationEmailsTransferencia"
    : "notificationEmailsLiberacao";

  const [specific, legacy] = await Promise.all([
    prisma.appConfig.findUnique({ where: { key: specificKey } }),
    prisma.appConfig.findUnique({ where: { key: "notificationEmails" } }),
  ]);

  const value = specific?.value || legacy?.value || "";
  return value.split(";").map((e) => e.trim()).filter((e) => e.length > 0);
}

export interface ItemComPrevisao {
  codigo: string;
  descricao: string;
  origem: string;
  destino: string;
  quantidade: number;
  previsaoChegada?: string; // Data formatada pt-BR
}

interface NovaSolicitacaoParams {
  tipo: "transferencia" | "liberacao";
  solicitante: string;
  detalhes: string;
  id: string;
  itensComPrevisao?: ItemComPrevisao[];
}

/**
 * Envia e-mail para os endereços configurados para o tipo de solicitação.
 */
export async function sendNovaSolicitacaoEmail(params: NovaSolicitacaoParams) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_placeholder") {
    console.warn("[Email] RESEND_API_KEY não configurada. E-mail não enviado.");
    return;
  }

  try {
    const destinatarios = await getNotificationEmails(params.tipo);

    if (destinatarios.length === 0) {
      console.warn(`[Email] Nenhum e-mail configurado para ${params.tipo}. Acesse Admin → Notificações.`);
      return;
    }

    const tipoLabel = params.tipo === "transferencia" ? "Transferência" : "Liberação Pitágoras";
    const link      = `${APP_URL}/${params.tipo === "transferencia" ? "transferencias" : "liberacoes"}`;

    // Tabela de itens com previsão (somente para transferências)
    const tabelaItens = params.itensComPrevisao && params.itensComPrevisao.length > 0
      ? `
        <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:13px;">
          <thead>
            <tr style="background:#EBF5F9;">
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Código</th>
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Descrição</th>
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Origem → Destino</th>
              <th style="text-align:center;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Qtd</th>
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Previsão de Chegada</th>
            </tr>
          </thead>
          <tbody>
            ${params.itensComPrevisao.map((item, i) => `
              <tr style="background:${i % 2 === 0 ? "#ffffff" : "#F9FAFB"};">
                <td style="padding:8px 10px;font-family:monospace;color:#16455C;font-weight:600;">${item.codigo}</td>
                <td style="padding:8px 10px;color:#374151;">${item.descricao}</td>
                <td style="padding:8px 10px;color:#374151;">${item.origem} → ${item.destino}</td>
                <td style="padding:8px 10px;text-align:center;color:#374151;">${item.quantidade}</td>
                <td style="padding:8px 10px;color:${item.previsaoChegada ? "#2E9B7C" : "#9CA3AF"};font-weight:${item.previsaoChegada ? "600" : "400"};">
                  ${item.previsaoChegada ?? "SLA não configurado"}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `
      : `<p style="color:#374151;margin:0 0 16px;"><strong>Detalhes:</strong> ${params.detalhes}</p>`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
        <div style="background:#16455C;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">🔔 Nova ${tipoLabel}</h1>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;">Hub Request Plan</p>
        </div>
        <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:0;">
          <p style="color:#374151;margin:0 0 8px;"><strong>Solicitante:</strong> ${params.solicitante}</p>
          <p style="color:#374151;margin:0 0 16px;"><strong>ID da Solicitação:</strong>
            <span style="font-family:monospace;font-size:15px;color:#16455C;font-weight:700;">${params.id}</span>
          </p>
          ${tabelaItens}
          <div style="margin-top:20px;">
            <a href="${link}" style="display:inline-block;background:#16455C;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Ver Solicitação no Portal
            </a>
          </div>
        </div>
        <div style="background:#F5F5F5;padding:16px;border-radius:0 0 8px 8px;text-align:center;">
          <p style="color:#9CA3AF;font-size:12px;margin:0;">Hub Request Plan — Portal de Solicitações</p>
        </div>
      </div>
    `;

    // Envia individualmente para evitar problemas de privacidade e limites do plano free
    await Promise.all(
      destinatarios.map((to) =>
        resend.emails.send({
          from: FROM,
          to,
          subject: `[Hub Request Plan] Nova ${tipoLabel} — ${params.solicitante}`,
          html,
        })
      )
    );

    console.log(`[Email] Nova ${tipoLabel} enviada para ${destinatarios.length} destinatário(s).`);
  } catch (err) {
    console.error("[Email] Falha ao enviar nova solicitação:", err);
  }
}

interface ConfirmacaoSolicitacaoParams {
  destinatario: string;
  nome: string;
  tipo: "transferencia" | "liberacao";
  id: string;
  detalhes: string;
  itensComPrevisao?: ItemComPrevisao[];
}

/**
 * Notifica o próprio solicitante quando sua solicitação é criada com sucesso.
 */
export async function sendConfirmacaoSolicitacaoEmail(params: ConfirmacaoSolicitacaoParams) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_placeholder") {
    console.warn("[Email] RESEND_API_KEY não configurada. E-mail não enviado.");
    return;
  }

  try {
    const tipoLabel = params.tipo === "transferencia" ? "Transferência" : "Liberação Pitágoras";
    const link      = `${APP_URL}/${params.tipo === "transferencia" ? "transferencias" : "liberacoes"}`;

    const tabelaItens = params.itensComPrevisao && params.itensComPrevisao.length > 0
      ? `
        <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:13px;">
          <thead>
            <tr style="background:#EBF5F9;">
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Código</th>
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Descrição</th>
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Origem → Destino</th>
              <th style="text-align:center;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Qtd</th>
              <th style="text-align:left;padding:8px 10px;color:#16455C;border-bottom:2px solid #b8d9e8;">Previsão de Chegada</th>
            </tr>
          </thead>
          <tbody>
            ${params.itensComPrevisao.map((item, i) => `
              <tr style="background:${i % 2 === 0 ? "#ffffff" : "#F9FAFB"};">
                <td style="padding:8px 10px;font-family:monospace;color:#16455C;font-weight:600;">${item.codigo}</td>
                <td style="padding:8px 10px;color:#374151;">${item.descricao}</td>
                <td style="padding:8px 10px;color:#374151;">${item.origem} → ${item.destino}</td>
                <td style="padding:8px 10px;text-align:center;color:#374151;">${item.quantidade}</td>
                <td style="padding:8px 10px;color:${item.previsaoChegada ? "#2E9B7C" : "#9CA3AF"};font-weight:${item.previsaoChegada ? "600" : "400"};">
                  ${item.previsaoChegada ?? "SLA não configurado"}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `
      : `<p style="color:#374151;margin:0 0 16px;"><strong>Detalhes:</strong> ${params.detalhes}</p>`;

    await resend.emails.send({
      from: FROM,
      to:   params.destinatario,
      subject: `[Hub Request Plan] Solicitação recebida — ${tipoLabel} #${params.id}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
          <div style="background:#2E9B7C;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">✅ Solicitação Recebida</h1>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;">Hub Request Plan</p>
          </div>
          <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#374151;margin:0 0 8px;">Olá, <strong>${params.nome}</strong>!</p>
            <p style="color:#374151;margin:0 0 16px;">Sua solicitação de <strong>${tipoLabel}</strong> foi recebida com sucesso e está em análise pelo time de planejamento.</p>
            <p style="color:#374151;margin:0 0 16px;"><strong>ID da Solicitação:</strong>
              <span style="font-family:monospace;font-size:15px;color:#16455C;font-weight:700;">${params.id}</span>
            </p>
            ${tabelaItens}
            <div style="margin-top:20px;">
              <a href="${link}" style="display:inline-block;background:#16455C;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
                Acompanhar Solicitação
              </a>
            </div>
          </div>
          <div style="background:#F5F5F5;padding:16px;border-radius:0 0 8px 8px;text-align:center;">
            <p style="color:#9CA3AF;font-size:12px;margin:0;">Hub Request Plan — Portal de Solicitações</p>
          </div>
        </div>
      `,
    });

    console.log(`[Email] Confirmação de ${tipoLabel} enviada para ${params.destinatario}.`);
  } catch (err) {
    console.error("[Email] Falha ao enviar confirmação de solicitação:", err);
  }
}

interface StatusAtualizadoParams {
  destinatario: string;
  nome: string;
  tipo: string;
  novoStatus: string;
  retorno?: string;
  id: string;
}

/**
 * Notifica o solicitante quando o status/retorno é atualizado.
 */
export async function sendStatusAtualizadoEmail(params: StatusAtualizadoParams) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_placeholder") {
    console.warn("[Email] RESEND_API_KEY não configurada. E-mail não enviado.");
    return;
  }

  try {
    const isAprovada = params.retorno === "APROVADA" || params.novoStatus === "PROCESSADA";
    const cor   = isAprovada ? "#2E9B7C" : "#ef4444";
    const icone = isAprovada ? "✅" : "❌";

    await resend.emails.send({
      from: FROM,
      to:   params.destinatario,
      subject: `[Hub Request Plan] Atualização — ${params.tipo} ${icone}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:${cor};padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">${icone} Solicitação Atualizada</h1>
            <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;">Hub Request Plan</p>
          </div>
          <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:0;">
            <p style="color:#374151;">Olá, <strong>${params.nome}</strong>!</p>
            <p style="color:#374151;margin:0 0 16px;">Sua solicitação de <strong>${params.tipo}</strong> foi atualizada:</p>
            <div style="background:#F5F5F5;border-left:4px solid ${cor};padding:12px 16px;border-radius:4px;margin-bottom:16px;">
              <p style="margin:0;color:#374151;"><strong>Novo Status:</strong> ${params.novoStatus}</p>
              ${params.retorno ? `<p style="margin:4px 0 0;color:#374151;"><strong>Retorno do Planejamento:</strong> ${params.retorno}</p>` : ""}
            </div>
            <a href="${APP_URL}" style="display:inline-block;background:#16455C;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Ver no Portal
            </a>
          </div>
          <div style="background:#F5F5F5;padding:16px;border-radius:0 0 8px 8px;text-align:center;">
            <p style="color:#9CA3AF;font-size:12px;margin:0;">Hub Request Plan — Portal de Solicitações</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Email] Falha ao enviar status atualizado:", err);
  }
}
