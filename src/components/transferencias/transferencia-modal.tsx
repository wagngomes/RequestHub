"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2, CheckCircle2, AlertCircle, Plus, Trash2,
  Package, PartyPopper, Check,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { useCentros } from "@/hooks/use-centros";
import { transferenciaItemSchema, transferenciaItemStatusSchema } from "@/lib/validations/transferencia";
import type { TransferenciaItemInput, TransferenciaItemStatusInput } from "@/lib/validations/transferencia";
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import type { SolicitacaoTransferenciaWithDetails, TransferenciaItem, TransferenciaItemWithSolicitacao } from "@/types";

/* ── Props ────────────────────────────────────────────────────────────── */
interface TransferenciaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "view" | "create" | "status";
  id: string | null;
  onSuccess: () => void;
}

const ITEM_DEFAULTS: TransferenciaItemInput = {
  codigo: "", descricao: "", controlado: "N", refrigerado: "N",
  origem: "", destino: "", quantidade: 1,
};

/* ── Helper: seção com cabeçalho colorido ────────────────────────────── */
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-lg border border-gray-200 overflow-hidden">
    <div className="px-4 py-2.5 border-b border-gray-100" style={{ backgroundColor: "#EBF5F9" }}>
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>{title}</span>
    </div>
    <div className="p-4 space-y-3 bg-white">
      {children}
    </div>
  </div>
);

/* ── Componente principal ────────────────────────────────────────────── */
export function TransferenciaModal({ open, onOpenChange, mode, id, onSuccess }: TransferenciaModalProps) {
  const { centros } = useCentros();
  const [isLoading, setIsLoading]     = useState(false);
  const [isFetching, setIsFetching]   = useState(false);
  const [solicitacao, setSolicitacao] = useState<SolicitacaoTransferenciaWithDetails | null>(null);
  const [selectedItem, setSelectedItem] = useState<TransferenciaItemWithSolicitacao | null>(null);

  // CREATE state
  const [itens, setItens]         = useState<TransferenciaItemInput[]>([]);
  const [obs, setObs]             = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Product lookup
  const [produtoStatus, setProdutoStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");
  const [produtoMultiplo, setProdutoMultiplo]     = useState<number>(1);
  const [produtoTributacao, setProdutoTributacao] = useState<string>("-");

  const form = useForm<TransferenciaItemInput>({
    resolver: zodResolver(transferenciaItemSchema),
    defaultValues: ITEM_DEFAULTS,
  });

  const statusForm = useForm<TransferenciaItemStatusInput>({
    resolver: zodResolver(transferenciaItemStatusSchema),
    defaultValues: { status: "PENDENTE" },
  });

  // Reset ao fechar / buscar dados ao abrir
  useEffect(() => {
    if (!open) {
      setSolicitacao(null);
      setSelectedItem(null);
      setItens([]);
      setObs("");
      setCreatedId(null);
      setProdutoStatus("idle");
      setProdutoMultiplo(1);
      setProdutoTributacao("-");
      form.reset(ITEM_DEFAULTS);
      statusForm.reset();
      return;
    }
    if (!id) return;

    setIsFetching(true);
    // VIEW mode: busca a solicitação completa
    // STATUS mode: busca o item individual
    const url = mode === "status"
      ? `/api/transferencias/item/${id}`
      : `/api/transferencias/${id}`;

    fetch(url)
      .then((r) => r.json())
      .then(({ data }) => {
        if (mode === "view") {
          setSolicitacao(data);
        } else if (mode === "status") {
          setSelectedItem(data);
          statusForm.reset({ status: data.status });
        }
      })
      .catch(() => toast({ variant: "destructive", title: "Erro ao carregar" }))
      .finally(() => setIsFetching(false));
  }, [open, id, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lookup de produto ao sair do campo código
  const handleCodigoBlur = useCallback(async () => {
    const codigo = form.getValues("codigo").trim().toUpperCase();
    if (!codigo) return;
    setProdutoStatus("loading");
    try {
      const res = await fetch(`/api/produtos/${encodeURIComponent(codigo)}`);
      if (!res.ok) {
        setProdutoStatus("not_found");
        form.setValue("descricao", "");
        return;
      }
      const { data } = await res.json();
      setProdutoStatus("found");
      form.setValue("codigo",      data.codigo,      { shouldValidate: true });
      form.setValue("descricao",   data.descricao,   { shouldValidate: true });
      form.setValue("refrigerado", data.refrigerado, { shouldValidate: true });
      form.setValue("controlado",  data.controlado,  { shouldValidate: true });
      setProdutoMultiplo(data.multiplo ?? 1);
      setProdutoTributacao(data.tributacao ?? "-");
    } catch {
      setProdutoStatus("not_found");
    }
  }, [form]);

  function handleAddItem(data: TransferenciaItemInput) {
    if (itens.length >= 20) {
      toast({ variant: "destructive", title: "Limite de 20 itens atingido" });
      return;
    }
    // Validação de múltiplo
    if (produtoMultiplo > 1 && data.quantidade % produtoMultiplo !== 0) {
      toast({
        variant: "destructive",
        title: "Quantidade inválida",
        description: `A quantidade deve ser múltiplo de ${produtoMultiplo}. Ex: ${produtoMultiplo}, ${produtoMultiplo * 2}, ${produtoMultiplo * 3}...`,
      });
      return;
    }
    setItens((prev) => [...prev, data]);
    form.reset(ITEM_DEFAULTS);
    setProdutoStatus("idle");
    setProdutoMultiplo(1);
    setProdutoTributacao("-");
  }

  function handleRemoveItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleFinalizar() {
    if (itens.length === 0) {
      toast({ variant: "destructive", title: "Adicione ao menos um item" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/transferencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ obs: obs || undefined, itens }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao criar");
      setCreatedId(json.data.id);
      onSuccess();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "Tente novamente" });
    } finally {
      setIsLoading(false);
    }
  }

  async function onStatusSubmit(data: TransferenciaItemStatusInput) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/transferencias/item/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: data.status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao atualizar");
      toast({ title: "Status do item atualizado com sucesso!" });
      onSuccess();
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: err instanceof Error ? err.message : "Tente novamente" });
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetching) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center h-40">
            <Loader2 size={32} className="animate-spin" style={{ color: "#16455C" }} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">

        {/* ── Cabeçalho do modal ── */}
        <DialogHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: "#16455C", color: "white" }} />
            <DialogTitle className="text-base font-semibold" style={{ color: "#16455C" }}>
              {mode === "view"    ? "Detalhes da Transferência"
                : mode === "status" ? "Atualizar Status"
                : createdId         ? "Solicitação registrada!"
                : "Nova Solicitação de Transferência"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* ════ VIEW ════════════════════════════════════════════════════ */}
        {mode === "view" && solicitacao && (
          <ViewTransferencia solicitacao={solicitacao} />
        )}

        {/* ════ STATUS ══════════════════════════════════════════════════ */}
        {mode === "status" && selectedItem && (
          <form onSubmit={statusForm.handleSubmit(onStatusSubmit)} className="space-y-4 pt-2">
            {/* Resumo do item */}
            <div className="p-3 rounded-lg border border-gray-200" style={{ backgroundColor: "#EBF5F9" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold" style={{ color: "#16455C" }}>
                  Solicitação: {selectedItem.solicitacaoId}
                </span>
                <span className="text-gray-300">·</span>
                <StatusBadge status={selectedItem.status} />
              </div>
              <p className="text-sm font-semibold text-gray-800">
                <span className="font-mono" style={{ color: "#16455C" }}>{selectedItem.codigo}</span>
                <span className="text-gray-300 mx-1.5">—</span>
                {selectedItem.descricao}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedItem.origem} → {selectedItem.destino} · {selectedItem.quantidade} un
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Novo status do item</Label>
              <Controller control={statusForm.control} name="status" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">⏳ Pendente</SelectItem>
                    <SelectItem value="PROCESSADA">✅ Processada</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading} style={{ backgroundColor: "#16455C", color: "white" }}>
                {isLoading && <Loader2 size={14} className="animate-spin" />} Salvar
              </Button>
            </div>
          </form>
        )}

        {/* ════ CREATE › Sucesso ════════════════════════════════════════ */}
        {mode === "create" && createdId && (
          <div className="flex flex-col items-center py-10 gap-5 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#E8F7F3" }}>
              <PartyPopper size={32} style={{ color: "#2E9B7C" }} />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800">Solicitação criada com sucesso!</p>
              <p className="text-sm text-gray-500 mt-1">Guarde este ID para acompanhar:</p>
            </div>
            <div
              className="px-8 py-4 rounded-xl border-2 font-mono text-3xl font-bold tracking-widest select-all"
              style={{ borderColor: "#16455C", color: "#16455C", backgroundColor: "#EBF5F9" }}
            >
              {createdId}
            </div>
            <p className="text-xs text-gray-400">{itens.length} item(ns) — o Planejamento será notificado por e-mail.</p>
            <Button onClick={() => onOpenChange(false)} style={{ backgroundColor: "#16455C", color: "white" }}>
              <Check size={14} /> Concluir
            </Button>
          </div>
        )}

        {/* ════ CREATE › Formulário multi-item ═════════════════════════ */}
        {mode === "create" && !createdId && (
          <div className="space-y-5 pt-2">

            {/* Lista de itens adicionados */}
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200" style={{ backgroundColor: "#EBF5F9" }}>
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: "#16455C" }}>
                  <Package size={13} /> Itens da solicitação
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  itens.length >= 20
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "bg-white text-gray-500 border-gray-200"
                }`}>
                  {itens.length}/20
                </span>
              </div>

              {itens.length === 0 ? (
                <div className="py-8 text-center bg-white">
                  <Package size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">Preencha o formulário abaixo e clique em &quot;Adicionar item&quot;</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 bg-white">
                  {itens.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <span className="text-xs font-bold text-gray-300 mt-0.5 w-5 shrink-0">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          <span className="font-mono" style={{ color: "#16455C" }}>{item.codigo}</span>
                          <span className="text-gray-300 mx-1.5">—</span>
                          {item.descricao}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.origem} → {item.destino} · {item.quantidade} un
                          {item.refrigerado === "S" && <span className="ml-1.5 text-blue-500">❄ Refrig.</span>}
                          {item.controlado  === "S" && <span className="ml-1.5 text-amber-500">⚠ Contr.</span>}
                        </p>
                      </div>
                      <Button
                        type="button" variant="ghost" size="icon"
                        className="h-7 w-7 text-gray-300 hover:text-red-500 hover:bg-red-50 shrink-0"
                        onClick={() => handleRemoveItem(idx)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulário do item */}
            <form onSubmit={form.handleSubmit(handleAddItem)} className="space-y-4">

              {/* Produto (grouped) */}
              <SectionCard title="Produto">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Código *</Label>
                  <div className="relative">
                    <Input
                      placeholder="Ex: PROD001"
                      className="pr-9 font-mono uppercase"
                      {...form.register("codigo", {
                        onChange: () => setProdutoStatus("idle"),
                      })}
                      onBlur={handleCodigoBlur}
                    />
                    {produtoStatus === "loading"   && <Loader2    size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                    {produtoStatus === "found"     && <CheckCircle2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />}
                    {produtoStatus === "not_found" && <AlertCircle  size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />}
                  </div>
                  {produtoStatus === "not_found" && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} /> Produto não encontrado.</p>}
                  {produtoStatus === "found"     && <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 size={11} /> Campos preenchidos automaticamente.</p>}
                  {form.formState.errors.codigo  && <p className="text-xs text-red-500">{form.formState.errors.codigo.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                    Descrição *
                    {produtoStatus === "found" && <span className="text-[10px] font-normal text-emerald-600 normal-case">(preenchida automaticamente)</span>}
                  </Label>
                  <Input
                    placeholder="Preenchida automaticamente ao digitar o código"
                    readOnly={produtoStatus === "found"}
                    className={produtoStatus === "found" ? "bg-gray-50 text-gray-500 cursor-default border-dashed" : ""}
                    {...form.register("descricao")}
                  />
                  {form.formState.errors.descricao && <p className="text-xs text-red-500">{form.formState.errors.descricao.message}</p>}
                </div>

                {/* Refrigerado / Controlado */}
                <div className="grid grid-cols-2 gap-4">
                  {(["refrigerado", "controlado"] as const).map((field) => (
                    <div key={field} className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                        {field === "refrigerado" ? "❄ Refrigerado" : "⚠ Controlado"}
                        {produtoStatus === "found" && <span className="text-[10px] font-normal text-emerald-600 normal-case">(auto)</span>}
                      </Label>
                      <Controller control={form.control} name={field} render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange} disabled={produtoStatus === "found"}>
                          <SelectTrigger className={produtoStatus === "found" ? "bg-gray-50 border-dashed text-gray-500" : ""}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="S">Sim</SelectItem>
                            <SelectItem value="N">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      )} />
                    </div>
                  ))}
                </div>

                {/* Tributação + Múltiplo (preenchidos automaticamente) */}
                {produtoStatus === "found" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                        Tributação
                        <span className="text-[10px] font-normal text-emerald-600 normal-case">(auto)</span>
                      </Label>
                      <Input
                        value={produtoTributacao}
                        readOnly
                        className="bg-gray-50 text-gray-500 cursor-default border-dashed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                        Múltiplo
                        <span className="text-[10px] font-normal text-emerald-600 normal-case">(auto)</span>
                      </Label>
                      <Input
                        value={produtoMultiplo}
                        readOnly
                        className={`bg-gray-50 cursor-default border-dashed ${produtoMultiplo > 1 ? "text-amber-700 font-semibold" : "text-gray-500"}`}
                      />
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Quantidade */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2">
                  Quantidade *
                  {produtoMultiplo > 1 && (
                    <span className="text-[10px] font-normal text-amber-600 normal-case">
                      deve ser múltiplo de {produtoMultiplo}
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  min={produtoMultiplo > 1 ? produtoMultiplo : 1}
                  step={produtoMultiplo > 1 ? produtoMultiplo : 1}
                  className="max-w-40"
                  {...form.register("quantidade")}
                />
                {produtoMultiplo > 1 && (
                  <p className="text-[11px] text-amber-600">
                    Exemplos válidos: {produtoMultiplo}, {produtoMultiplo * 2}, {produtoMultiplo * 3}...
                  </p>
                )}
                {form.formState.errors.quantidade && <p className="text-xs text-red-500">{form.formState.errors.quantidade.message}</p>}
              </div>

              {/* Origem / Destino */}
              <div className="grid grid-cols-2 gap-4">
                {(["origem", "destino"] as const).map((field) => (
                  <div key={field} className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {field === "origem" ? "CD Origem *" : "CD Destino *"}
                    </Label>
                    <Controller control={form.control} name={field} render={({ field: f }) => (
                      <Select value={f.value ?? ""} onValueChange={f.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={field === "origem" ? "Selecione a origem" : "Selecione o destino"} />
                        </SelectTrigger>
                        <SelectContent>
                          {centros.map((cd) => (
                            <SelectItem key={cd.codigo} value={cd.codigo}>{cd.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )} />
                    {form.formState.errors[field] && <p className="text-xs text-red-500">{form.formState.errors[field]?.message}</p>}
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full border-dashed border-gray-300 text-gray-600 hover:border-[#16455C] hover:text-[#16455C]"
                disabled={produtoStatus === "loading" || produtoStatus === "not_found" || itens.length >= 20}
              >
                <Plus size={15} /> Adicionar item à solicitação
              </Button>
            </form>

            {/* Observação geral */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Observação geral (opcional)</Label>
              <Textarea
                placeholder="Informações adicionais para toda a solicitação..."
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className="resize-none"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                {itens.length === 0
                  ? "Adicione ao menos 1 item para finalizar"
                  : `${itens.length} item(ns) pronto(s) para envio`}
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button
                  onClick={handleFinalizar}
                  disabled={isLoading || itens.length === 0}
                  style={{ backgroundColor: "#16455C", color: "white" }}
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Finalizar ({itens.length} item{itens.length !== 1 ? "s" : ""})
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Visão detalhada ─────────────────────────────────────────────────── */
function ViewTransferencia({ solicitacao }: { solicitacao: SolicitacaoTransferenciaWithDetails }) {
  return (
    <div className="space-y-4 pt-2">
      {/* Header info */}
      <div className="grid grid-cols-3 gap-4 p-4 rounded-lg border border-gray-200" style={{ backgroundColor: "#EBF5F9" }}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">ID</p>
          <p className="font-mono font-bold text-xl mt-0.5" style={{ color: "#16455C" }}>{solicitacao.id}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Status</p>
          <div className="mt-1"><StatusBadge status={solicitacao.status} /></div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Data</p>
          <p className="text-sm text-gray-700 mt-0.5">{formatDate(solicitacao.createdAt)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Solicitante</p>
          <p className="text-sm text-gray-700 mt-0.5">
            {solicitacao.user.nome} <span className="text-gray-400">— {solicitacao.user.setor}</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Total de itens</p>
          <p className="text-sm font-semibold text-gray-700 mt-0.5">{solicitacao._count.itens}</p>
        </div>
        {solicitacao.obs && (
          <div className="col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Observação</p>
            <p className="text-sm text-gray-700 mt-0.5">{solicitacao.obs}</p>
          </div>
        )}
      </div>

      {/* Item list */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-200" style={{ backgroundColor: "#EBF5F9" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#16455C" }}>Itens da solicitação</p>
        </div>
        <div className="divide-y divide-gray-100 bg-white">
          {solicitacao.itens.map((item: TransferenciaItem, idx: number) => (
            <div key={item.id} className="flex items-start gap-3 px-4 py-3">
              <span className="text-xs font-bold text-gray-300 mt-0.5 w-5 shrink-0">{idx + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  <span className="font-mono" style={{ color: "#16455C" }}>{item.codigo}</span>
                  <span className="text-gray-300 mx-1.5">—</span>
                  {item.descricao}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{item.origem} → {item.destino}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-800">{item.quantidade} un</p>
                <div className="flex gap-1 justify-end mt-1 flex-wrap">
                  {item.refrigerado === "S" && <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-blue-500 border-blue-200">❄ Refrig.</Badge>}
                  {item.controlado  === "S" && <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-amber-500 border-amber-200">⚠ Contr.</Badge>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
