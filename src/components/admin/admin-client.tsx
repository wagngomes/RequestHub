"use client";

import { useState } from "react";
import { Users, Package, MapPin, Bell, Clock } from "lucide-react";
import { UsersSection } from "./users-section";
import { ProductsSection } from "./products-section";
import { CentrosSection } from "./centros-section";
import { NotificacoesSection } from "./notificacoes-section";
import { SlasSection } from "./slas-section";

type Tab = "usuarios" | "produtos" | "centros" | "slas" | "notificacoes";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "usuarios",     label: "Usuários",                icon: Users   },
  { id: "produtos",     label: "Produtos",                icon: Package },
  { id: "centros",      label: "Centros de Distribuição", icon: MapPin  },
  { id: "slas",         label: "SLA entre CDs",           icon: Clock   },
  { id: "notificacoes", label: "Notificações",            icon: Bell    },
];

export function AdminClient() {
  const [activeTab, setActiveTab] = useState<Tab>("usuarios");

  return (
    <div className="flex flex-col h-full">
      {/* ── Cabeçalho ── */}
      <div
        className="px-6 py-5 border-b border-gray-200 shrink-0"
        style={{ backgroundColor: "#EBF5F9" }}
      >
        <h1 className="text-xl font-bold" style={{ color: "#16455C" }}>
          Administração
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Gerencie usuários, produtos e centros de distribuição
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="px-6 border-b border-gray-200 bg-white shrink-0">
        <div className="flex gap-0">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all duration-150"
                style={{
                  borderBottomColor: isActive ? "#16455C" : "transparent",
                  color: isActive ? "#16455C" : "#6B7280",
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Conteúdo da aba ── */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "usuarios"     && <UsersSection />}
        {activeTab === "produtos"     && <ProductsSection />}
        {activeTab === "centros"      && <CentrosSection />}
        {activeTab === "slas"         && <SlasSection />}
        {activeTab === "notificacoes" && <NotificacoesSection />}
      </div>
    </div>
  );
}
