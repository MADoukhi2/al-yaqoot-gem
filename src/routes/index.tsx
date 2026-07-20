import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLiveGoldPrice, calcTotalValue, fmt, KARATS, pricePerGram } from "@/lib/gold";
import { rawAssets, finishedItems, orders, SERVICE_STATUSES, type ServiceStatus } from "@/lib/mock-data";
import { Coins, Package, Wrench, TrendingUp, Plus, ArrowUpRight, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const statusStyles: Record<ServiceStatus, string> = {
  "Received": "bg-secondary text-muted-foreground",
  "Delivering to Workshop": "bg-blue-500/10 text-blue-300 border-blue-500/20",
  "Crafting": "bg-amber-500/10 text-amber-300 border-amber-500/20",
  "Polishing": "bg-purple-500/10 text-purple-300 border-purple-500/20",
  "Heading to Shop": "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  "Ready": "bg-primary/15 text-primary border-primary/30",
};

function Dashboard() {
  const { price, updatedAt } = useLiveGoldPrice();

  const rawValue = rawAssets.reduce(
    (sum, a) => sum + (a.metal === "Gold" ? a.weightG * price * (a.karat / 24) : a.weightG * 0.9),
    0,
  );
  const finishedValue = finishedItems
    .filter((f) => f.kind === "Sellable")
    .reduce((sum, f) => sum + calcTotalValue({ weightG: f.weightG, karat: f.karat, goldPrice: price, laborCost: f.laborCost, profit: f.profit }), 0);

  const serviceJobs = finishedItems.filter((f) => f.kind === "Service");
  const retailPending = orders.filter((o) => o.type === "Retail" && o.status === "Pending");
  const investPending = orders.filter((o) => o.type === "Investment" && o.status === "Pending");

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Hero row */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<Coins className="h-4 w-4" />} label="Raw Assets Value" value={fmt(rawValue)} sub={`${rawAssets.length} assets in vault`} accent />
          <Metric icon={<Package className="h-4 w-4" />} label="Finished Stock Value" value={fmt(finishedValue)} sub="VAT-inclusive · sellable" />
          <Metric icon={<Wrench className="h-4 w-4" />} label="Active Service Jobs" value={String(serviceJobs.length)} sub="Across workshop pipeline" />
          <Metric icon={<TrendingUp className="h-4 w-4" />} label="Live Gold / g" value={fmt(price)} sub={`Updated ${updatedAt.toLocaleTimeString()}`} accent />
        </section>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link to="/sales" className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-luxury transition-transform hover:scale-[1.02]">
            <Plus className="h-4 w-4" /> New Sales Order
          </Link>
          <Link to="/inventory" className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-card px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-accent">
            <Wrench className="h-4 w-4" /> New Repair Job
          </Link>
        </div>

        {/* Two-column: service jobs + orders */}
        <section className="grid gap-6 xl:grid-cols-3">
          {/* Service jobs */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-card xl:col-span-2">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Active Service Jobs</h2>
                <p className="text-xs text-muted-foreground">Workshop pipeline · {serviceJobs.length} in progress</p>
              </div>
              <Link to="/inventory" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </header>

            {/* Pipeline counts */}
            <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {SERVICE_STATUSES.map((s) => {
                const count = serviceJobs.filter((j) => j.status === s).length;
                return (
                  <div key={s} className="rounded-lg border border-border bg-secondary/40 p-2 text-center">
                    <div className="text-lg font-bold text-primary">{count}</div>
                    <div className="mt-0.5 line-clamp-2 text-[10px] uppercase tracking-wide text-muted-foreground">{s}</div>
                  </div>
                );
              })}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="pb-2 pr-4 font-medium">Job</th>
                    <th className="pb-2 pr-4 font-medium">Customer</th>
                    <th className="pb-2 pr-4 font-medium">Artisan</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {serviceJobs.slice(0, 6).map((j) => (
                    <tr key={j.sku}>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{j.name}</div>
                        <div className="text-xs text-muted-foreground">{j.sku}</div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{j.customer}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{j.artisan}</td>
                      <td className="py-3">
                        <StatusBadge status={j.status!} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending orders */}
          <div className="space-y-4">
            <PendingCard title="Retail Orders" subtitle="Walk-in & custom" items={retailPending} tone="soft" />
            <PendingCard title="Investment / Bulk" subtitle="Weight-based, certificate-ready" items={investPending} tone="gold" />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 shadow-card ${accent ? "border-primary/30 bg-gradient-to-br from-accent to-card" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <span className={accent ? "text-primary" : ""}>{icon}</span>
        {label}
      </div>
      <div className={`mt-3 text-2xl font-bold tracking-tight ${accent ? "text-gradient-gold" : "text-foreground"}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

function PendingCard({ title, subtitle, items, tone }: { title: string; subtitle: string; items: { id: string; customer: string; amount: number; weightG: number }[]; tone: "gold" | "soft" }) {
  return (
    <div className={`rounded-xl border p-5 shadow-card ${tone === "gold" ? "border-primary/30 bg-gradient-to-br from-accent to-card" : "border-border bg-card"}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`text-sm font-semibold ${tone === "gold" ? "text-primary" : ""}`}>{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-semibold">{items.length}</span>
      </div>
      <ul className="mt-3 space-y-2">
        {items.length === 0 && <li className="text-xs text-muted-foreground">No pending orders.</li>}
        {items.map((o) => (
          <li key={o.id} className="flex items-center justify-between rounded-lg border border-border bg-background/40 p-2.5">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{o.customer}</div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" /> {o.id} · {o.weightG}g
              </div>
            </div>
            <div className="text-sm font-semibold text-primary">{fmt(o.amount)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
