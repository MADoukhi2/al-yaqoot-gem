import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLiveGoldPrice, calcTotalValue, fmt, purityFactor } from "@/lib/gold";
import { rawAssets, finishedItems, type ServiceStatus } from "@/lib/mock-data";
import { Plus, Wrench, Pencil } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Al Yaqoot ERP" },
      { name: "description", content: "Raw assets and finished stock with live valuation." },
    ],
  }),
  component: InventoryPage,
});

const statusStyles: Record<ServiceStatus, string> = {
  "Received": "bg-secondary text-muted-foreground",
  "Delivering to Workshop": "bg-blue-500/10 text-blue-300 border border-blue-500/20",
  "Crafting": "bg-amber-500/10 text-amber-300 border border-amber-500/20",
  "Polishing": "bg-purple-500/10 text-purple-300 border border-purple-500/20",
  "Heading to Shop": "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20",
  "Ready": "bg-primary/15 text-primary border border-primary/30",
};

function InventoryPage() {
  const { t } = useTranslation();
  const { price } = useLiveGoldPrice();
  const [tab, setTab] = useState<"raw" | "finished">("raw");
  const [finishedKind, setFinishedKind] = useState<"Sellable" | "Service">("Sellable");

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("inventory.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("inventory.subtitle")} {fmt(price)}{t("inventory.subtitleSuffix")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-luxury">
              <Plus className="h-4 w-4" /> {t("inventory.addAsset")}
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-card px-4 py-2 text-sm font-semibold text-primary hover:bg-accent">
              <Wrench className="h-4 w-4" /> {t("inventory.startService")}
            </button>
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {(["raw", "finished"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                tab === tabKey ? "bg-gradient-gold text-primary-foreground shadow-luxury" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tabKey === "raw" ? t("inventory.rawAssets") : t("inventory.finishedStock")}
            </button>
          ))}
        </div>

        {tab === "raw" ? (
          <RawTable price={price} />
        ) : (
          <>
            <div className="inline-flex rounded-full border border-border bg-secondary/50 p-1 text-xs">
              {(["Sellable", "Service"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setFinishedKind(k)}
                  className={`rounded-full px-4 py-1.5 font-semibold transition-colors ${
                    finishedKind === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {k === "Sellable" ? t("inventory.sellableStock") : t("inventory.inService")}
                </button>
              ))}
            </div>
            <FinishedTable price={price} kind={finishedKind} />
          </>
        )}
      </div>
    </AppShell>
  );
}

function RawTable({ price }: { price: number }) {
  const { t } = useTranslation();
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <Th>{t("inventory.colSku")}</Th>
              <Th>{t("inventory.colName")}</Th>
              <Th>{t("inventory.colMetal")}</Th>
              <Th>{t("inventory.colWeight")}</Th>
              <Th>{t("inventory.colPurity")}</Th>
              <Th>{t("inventory.colValue")}</Th>
              <Th>{t("inventory.colActions")}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rawAssets.map((a) => {
              const value = a.metal === "Gold"
                ? a.weightG * price * purityFactor(a.karat) * 1.15
                : a.weightG * 0.9 * 1.15;
              return (
                <tr key={a.sku} className="hover:bg-secondary/30">
                  <Td className="font-mono text-xs text-primary">{a.sku}</Td>
                  <Td className="font-medium">{a.name}</Td>
                  <Td>{a.metal}</Td>
                  <Td>{a.weightG.toFixed(1)}</Td>
                  <Td>{a.karat}K</Td>
                  <Td className="font-semibold text-primary">{fmt(value)}</Td>
                  <Td>
                    <button className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3 w-3" /> {t("inventory.edit")}
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinishedTable({ price, kind }: { price: number; kind: "Sellable" | "Service" }) {
  const { t } = useTranslation();
  const rows = finishedItems.filter((f) => f.kind === kind);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <Th>{t("inventory.colSku")}</Th>
              <Th>{t("inventory.colName")}</Th>
              <Th>{t("inventory.colType")}</Th>
              <Th>{t("inventory.colWeight")}</Th>
              <Th>{t("inventory.colPurity")}</Th>
              <Th>{t("inventory.colValueVat")}</Th>
              <Th>{t("inventory.colStatus")}</Th>
              <Th>{t("inventory.colActions")}</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((f) => {
              const value = calcTotalValue({ weightG: f.weightG, karat: f.karat, goldPrice: price, laborCost: f.laborCost, profit: f.profit });
              return (
                <tr key={f.sku} className="hover:bg-secondary/30">
                  <Td className="font-mono text-xs text-primary">{f.sku}</Td>
                  <Td className="font-medium">{f.name}</Td>
                  <Td>{f.category}</Td>
                  <Td>{f.weightG.toFixed(1)}</Td>
                  <Td>{f.karat}K</Td>
                  <Td className="font-semibold text-primary">{fmt(value)}</Td>
                  <Td>
                    {f.status ? (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[f.status]}`}>
                        {t(`status.${f.status}`)}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        {t("inventory.inStock")}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <button className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3 w-3" /> {t("inventory.edit")}
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-start font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
