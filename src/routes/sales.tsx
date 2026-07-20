import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLiveGoldPrice, calcTotalValue, fmt, purityFactor } from "@/lib/gold";
import { orders } from "@/lib/mock-data";
import { useMemo, useState } from "react";
import { User, Briefcase, Receipt, FileCheck2 } from "lucide-react";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales — Al Yaqoot ERP" },
      { name: "description", content: "Retail and Investment/Bulk orders for gold and jewelry." },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const { price } = useLiveGoldPrice();
  const [channel, setChannel] = useState<"Retail" | "Investment">("Retail");

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="mt-1 text-sm text-muted-foreground">Dual channel — Retail walk-ins & Investment / Bulk buyers.</p>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {(["Retail", "Investment"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                channel === c ? "bg-gradient-gold text-primary-foreground shadow-luxury" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c === "Retail" ? <User className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
              {c === "Retail" ? "Retail Order" : "Investment / Bulk Order"}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {channel === "Retail" ? <RetailForm price={price} /> : <InvestmentForm price={price} />}
          </div>
          <RecentOrders />
        </div>
      </div>
    </AppShell>
  );
}

function RetailForm({ price }: { price: number }) {
  const [weight, setWeight] = useState(6.4);
  const [karat, setKarat] = useState(22);
  const [labor, setLabor] = useState(45);
  const [profit, setProfit] = useState(30);

  const total = useMemo(() => calcTotalValue({ weightG: weight, karat, goldPrice: price, laborCost: labor, profit }), [weight, karat, price, labor, profit]);
  const subtotal = weight * price * purityFactor(karat) + labor + profit;

  return (
    <Card title="Retail Order" subtitle="Walk-in / custom item — labor + profit + VAT">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer name"><input className="input" placeholder="e.g. S. Hassan" /></Field>
        <Field label="Item description"><input className="input" placeholder="e.g. 22K Ring" defaultValue="Classic Band Ring" /></Field>
        <Field label="Weight (g)"><input type="number" step="0.1" value={weight} onChange={(e) => setWeight(+e.target.value)} className="input" /></Field>
        <Field label="Purity (karat)">
          <select value={karat} onChange={(e) => setKarat(+e.target.value)} className="input">
            {[24, 22, 21, 18, 14].map((k) => <option key={k} value={k}>{k}K</option>)}
          </select>
        </Field>
        <Field label="Labor cost"><input type="number" value={labor} onChange={(e) => setLabor(+e.target.value)} className="input" /></Field>
        <Field label="Profit margin"><input type="number" value={profit} onChange={(e) => setProfit(+e.target.value)} className="input" /></Field>
      </div>

      <Valuation subtotal={subtotal} total={total} price={price} />

      <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-luxury">
        <Receipt className="h-4 w-4" /> Confirm Retail Order
      </button>
    </Card>
  );
}

function InvestmentForm({ price }: { price: number }) {
  const [weight, setWeight] = useState(500);
  const [karat, setKarat] = useState(24);
  const [premium, setPremium] = useState(1.5); // % over spot

  const spotValue = weight * price * purityFactor(karat);
  const premiumValue = spotValue * (premium / 100);
  const total = (spotValue + premiumValue) * 1.15;

  return (
    <Card title="Investment / Bulk Order" subtitle="Weight-based · certificate-ready">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client / Entity"><input className="input" placeholder="e.g. Al Noor Holdings" /></Field>
        <Field label="Certificate ID"><input className="input" placeholder="Auto: CRT-00234" defaultValue="CRT-00234" /></Field>
        <Field label="Weight (g)"><input type="number" step="1" value={weight} onChange={(e) => setWeight(+e.target.value)} className="input" /></Field>
        <Field label="Purity (karat)">
          <select value={karat} onChange={(e) => setKarat(+e.target.value)} className="input">
            {[24, 22, 21].map((k) => <option key={k} value={k}>{k}K</option>)}
          </select>
        </Field>
        <Field label="Premium over spot (%)"><input type="number" step="0.1" value={premium} onChange={(e) => setPremium(+e.target.value)} className="input" /></Field>
        <Field label="Delivery"><select className="input"><option>Vault storage</option><option>Physical pickup</option><option>Insured courier</option></select></Field>
      </div>

      <div className="mt-5 rounded-xl border border-primary/30 bg-gradient-to-br from-accent to-card p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <ValueLine label="Spot value" value={fmt(spotValue)} />
          <ValueLine label={`Premium (${premium}%)`} value={fmt(premiumValue)} />
          <ValueLine label="Total (VAT incl.)" value={fmt(total)} highlight />
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">Locked at gold {fmt(price)}/g · Formula: (Weight × Spot × Purity + Premium) × 1.15</div>
      </div>

      <button className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-luxury">
        <FileCheck2 className="h-4 w-4" /> Issue Certificate & Confirm
      </button>
    </Card>
  );
}

function Valuation({ subtotal, total, price }: { subtotal: number; total: number; price: number }) {
  const vat = total - subtotal;
  return (
    <div className="mt-5 rounded-xl border border-primary/30 bg-gradient-to-br from-accent to-card p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <ValueLine label="Subtotal" value={fmt(subtotal)} />
        <ValueLine label="VAT (15%)" value={fmt(vat)} />
        <ValueLine label="Total" value={fmt(total)} highlight />
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">Live gold {fmt(price)}/g · Formula: (Weight × Price × Purity + Labor + Profit) × 1.15</div>
    </div>
  );
}

function ValueLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-semibold ${highlight ? "text-lg text-gradient-gold" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function RecentOrders() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-sm font-semibold">Recent Orders</h3>
      <ul className="mt-3 divide-y divide-border">
        {orders.map((o) => (
          <li key={o.id} className="flex items-center justify-between py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${o.type === "Investment" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  {o.type}
                </span>
                <span className="truncate text-sm font-medium">{o.customer}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">{o.id} · {o.weightG}g · {o.createdAt}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-primary">{fmt(o.amount)}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{o.status}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
