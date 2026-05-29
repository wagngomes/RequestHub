"use client";

import { useState, useEffect, useMemo } from "react";
import type { Sla } from "@/types";

export function useSlas() {
  const [slas, setSlas]     = useState<Sla[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/slas")
      .then((r) => r.json())
      .then((json: { data: Sla[] }) => setSlas(json.data ?? []))
      .catch(() => setSlas([]))
      .finally(() => setLoading(false));
  }, []);

  /** Map "ORIGEM|DESTINO" → dias de SLA para lookup O(1) na tabela */
  const slaMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of slas) {
      m.set(`${s.origem}|${s.destino}`, s.sla);
    }
    return m;
  }, [slas]);

  function getSla(origem: string, destino: string): number | null {
    return slaMap.get(`${origem}|${destino}`) ?? null;
  }

  return { slas, loading, slaMap, getSla };
}
