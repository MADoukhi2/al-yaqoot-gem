import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useLiveGoldPrice, calcTotalValue, fmt, fmtTime, KARATS, pricePerGram, purityFactor } from "@/lib/gold";
import {
  SERVICE_STATUSES,
  useCustomers,
  useFinishedItems,
  useOrders,
  useRawAssets,
  useUpdateOrderStatus,
  useUpdateServiceStatus,
  type Order,
  type OrderItem,
} from "@/lib/erp";
import { StatusBadge } from "@/components/erp-ui";
import { Coins, Package, Wrench, TrendingUp, Plus, ArrowUpRight, Clock, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Al Yaqoot Cloud ERP" },
      {
        name: "description",
        content:
          "Live gold valuation, raw and finished asset totals, workshop pipeline and pending retail and investment orders.",
      },
      { property: "og:title", content: "Dashboard — Al Yaqoot Cloud ERP" },
      { property: "og:description", content: "Live gold valuation and shop operations at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useTranslation();
  const { price, updatedAt } = useLiveGoldPrice();
  const rawAssets = useRawAssets();
  const finished = useFinishedItems();
  const customers = useCustomers();
  const ordersQuery = useOrders();
  const updateService = useUpdateServiceStatus();
  const updateOrder = useUpdateOrderStatus();

  const raw = rawAssets.data ?? [];
  const items = finished.data ?? [];
  const orders = ordersQuery.data ?? [];

  const rawValue = raw.reduce(
    (sum, a) =>
      sum +
      (a.metal === "Gold" ? Number(a.weight_g) * price * purityFactor(a.karat) : Number(a.weight_g) * 0.9),
    0,
  );

  const finishedValue = items
    .filter((f) => f.kind === "Sellable" && !f.sold)
    .reduce(
      (sum, f) =>
        sum +
        calcTotalValue({
          weightG: Number(f.weight_g),
          karat: f.karat,
          goldPrice: price,
          laborCost: Number(f.labor_cost),
          profit: Number(f.profit),
        }),
      0,
    );

  const serviceJobs = items.filter((f) => f.kind === "Service");
  const retailPending = orders.filter((o) => o.channel === "Retail" && o.status === "Pending");
  const investPending = orders.filter((o) => o.channel === "Investment" && o.status === "Pending");

  return (
    <AppShell>
      <div className="grid gap-4 xl:grid-cols-6">
        {/* Hero: live gold price */}
        <section className="surface relative overflow-hidden p-6 xl:col-span-4">
          <div className="pointer-events-none absolute -end-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("liveGoldTitle")}
              </div>
              <div className="mt-2 font-display text-4xl font-extrabold tracking-tight">
                {fmt(price)}
                <span className="ms-1 text-base font-medium text-muted-foreground">/g · 24K</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("updated")} {fmtTime(updatedAt)}
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <TrendingUp className="h-3 w-3" /> {t("live")}
            </span>
          </div>
          <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {KARATS.map((k) => (
              <div
                key={k}
                className="rounded-xl border border-border bg-background/50 p-3 transition-colors hover:border-primary/40"
              >
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {k}K
                </div>
                <div className="mt-1 font-display text-lg font-bold">{fmt(pricePerGram(k, price))}</div>
                <div className="text-[10px] text-muted-foreground">{t("perGram")}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section className="surface flex flex-col gap-2.5 p-5 xl:col-span-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("nav.dashboard")}
          </div>
          <Link
            to="/sales"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-4 py-3 text-sm font-semibold text-primary-foreground shadow-luxury transition-transform hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" /> {t("actions.newSalesOrder")}
          </Link>
          <Link
            to="/inventory"
            className="inline-flex items-center gap-2 rounded-xl border border-primary/35 bg-primary/8 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary/15"
          >
            <Wrench className="h-4 w-4 text-primary" /> {t("actions.newRepairJob")}
          </Link>
          <Link
            to="/customers"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            <Users className="h-4 w-4 text-muted-foreground" /> {t("actions.manageCustomers")}
          </Link>
        </section>

        {/* Metrics */}
        <Metric
          className="xl:col-span-3 2xl:col-span-3"
          icon={<Coins className="h-4 w-4" />}
          label={t("metrics.rawAssets")}
          value={fmt(rawValue)}
          sub={`${raw.length} ${t("metrics.rawSub")}`}
          accent
        />
        <Metric
          className="xl:col-span-3"
          icon={<Package className="h-4 w-4" />}
          label={t("metrics.finishedStock")}
          value={fmt(finishedValue)}
          sub={t("metrics.finishedSub")}
        />
        <Metric
          className="xl:col-span-3"
          icon={<Wrench className="h-4 w-4" />}
          label={t("metrics.serviceJobs")}
          value={String(serviceJobs.length)}
          sub={t("metrics.serviceSub")}
        />
        <Metric
          className="xl:col-span-3"
          icon={<Users className="h-4 w-4" />}
          label={t("metrics.customers")}
          value={String(customers.data?.length ?? 0)}
          sub={t("metrics.customersSub")}
        />

        {/* Workshop pipeline */}
        <div className="surface p-5 xl:col-span-4">
          <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">{t("serviceSection.title")}</h2>
              <p className="truncate text-xs text-muted-foreground">
                {t("serviceSection.subtitle")} · {serviceJobs.length} {t("serviceSection.inProgress")}
              </p>
            </div>
            <Link
              to="/inventory"
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-primary hover:bg-secondary"
            >
              {t("serviceSection.viewAll")} <ArrowUpRight className="h-3 w-3" />
            </Link>
          </header>

          <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {SERVICE_STATUSES.map((s) => (
              <div key={s} className="rounded-xl border border-border bg-background/50 p-2.5 text-center">
                <div className="font-display text-lg font-bold text-primary">
                  {serviceJobs.filter((j) => j.status === s).length}
                </div>
                <div className="mt-0.5 line-clamp-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t(`status.${s}`)}
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="pb-2 pe-4 text-start font-medium">{t("serviceSection.colJob")}</th>
                  <th className="pb-2 pe-4 text-start font-medium">{t("serviceSection.colCustomer")}</th>
                  <th className="pb-2 pe-4 text-start font-medium">{t("serviceSection.colArtisan")}</th>
                  <th className="pb-2 text-start font-medium">{t("serviceSection.colStatus")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {serviceJobs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                      {t("common.noRows")}
                    </td>
                  </tr>
                )}
                {serviceJobs.map((j) => (
                  <tr key={j.id} className="transition-colors hover:bg-secondary/40">
                    <td className="py-3 pe-4">
                      <div className="font-medium">{j.name}</div>
                      <div className="text-xs text-muted-foreground">{j.sku}</div>
                    </td>
                    <td className="py-3 pe-4 text-muted-foreground">{j.customers?.name ?? "—"}</td>
                    <td className="py-3 pe-4 text-muted-foreground">{j.artisan ?? "—"}</td>
                    <td className="py-3">
                      <select
                        value={j.status ?? "Received"}
                        onChange={(e) =>
                          updateService.mutate({
                            id: j.id,
                            status: e.target.value as (typeof SERVICE_STATUSES)[number],
                          })
                        }
                        className="input h-9 py-0 text-xs"
                      >
                        {SERVICE_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {t(`status.${s}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending orders */}
        <div className="grid gap-4 xl:col-span-2">
          <PendingCard
            title={t("orders.retailTitle")}
            subtitle={t("orders.retailSubtitle")}
            items={retailPending}
            tone="soft"
            onConfirm={(id) => updateOrder.mutate({ id, status: "Confirmed" })}
          />
          <PendingCard
            title={t("orders.investTitle")}
            subtitle={t("orders.investSubtitle")}
            items={investPending}
            tone="gold"
            onConfirm={(id) => updateOrder.mutate({ id, status: "Confirmed" })}
          />
        </div>
      </div>
    </AppShell>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  accent,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`surface p-5 transition-colors hover:border-primary/40 ${accent ? "border-primary/30" : ""} ${className}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`grid h-8 w-8 place-items-center rounded-lg ${accent ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}
        >
          {icon}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      </div>
      <div className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}


function PendingCard({
  title,
  subtitle,
  items,
  tone,
  onConfirm,
}: {
  title: string;
  subtitle: string;
  items: (Order & { order_items: OrderItem[] })[];
  tone: "gold" | "soft";
  onConfirm: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className={`surface p-5 ${tone === "gold" ? "border-primary/30" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`text-sm font-semibold ${tone === "gold" ? "text-primary" : ""}`}>{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-semibold">
          {items.length}
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {items.length === 0 && <li className="text-xs text-muted-foreground">{t("orders.noPending")}</li>}
        {items.map((o) => (
          <li key={o.id} className="rounded-lg border border-border bg-background/40 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{o.customer_name}</div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> {o.order_no} · {Number(o.total_weight_g)}g
                </div>
              </div>
              <div className="text-sm font-semibold text-primary">{fmt(Number(o.total))}</div>
            </div>
            <button
              onClick={() => onConfirm(o.id)}
              className="mt-2 w-full rounded-md border border-primary/40 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-accent"
            >
              {t("orders.confirm")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
