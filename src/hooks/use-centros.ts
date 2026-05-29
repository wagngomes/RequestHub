"use client";

import { useState, useEffect } from "react";

export interface Centro {
  id: string;
  codigo: string;
  label: string;
}

export function useCentros() {
  const [centros, setCentros] = useState<Centro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/centros")
      .then((r) => {
        if (!r.ok) throw new Error("Erro ao carregar centros");
        return r.json();
      })
      .then((json: { data: Centro[] }) => {
        setCentros(json.data);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { centros, loading, error };
}
