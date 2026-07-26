import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { fmt, purityFactor, useLiveGoldPrice } from "@/lib/gold";
import {
  ORDER_STATUSES,
  useCreateOrder,
  useCustomers,
  useDeleteOrder,
  useFinishedItems,
  useOrders,
  useUpdateOrderStatus,
  type OrderStatus,
} from "@/lib/erp";
import { Field } from "@/components/erp-ui";
import { useMemo, useState } from "react";
import { User, Briefcase, Receipt, Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({
    meta: [
      { title: "Sales — Al Yaqoot Cloud ERP" },
      {
        name: "description",
        content: "Create retail and investment gold orders with live pricing, VAT and customer records.",
      },
      { property: "og:title", content: "Sales — Al Yaqoot Cloud ERP" },
      { property: "og:description", content: "Dual-channel selling for jewelry retail and bullion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const { t } = useTranslation();
  const { price } = useLiveGoldPrice();
  const [channel, setChannel] = useState<"Retail" | "Investment">("Retail");

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("sales.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("sales.subtitle")}</p>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {(["Retail", "Investment"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                channel === c
                  ? "bg-gradient-gold text-primary-foreground shadow-luxury"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c === "Retail" ? <User className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
              {c === "Retail" ? t("sales.retailOrder") : t("sales.investOrder")}
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

function CustomerPicker({
  customerId,
  onChange,
  label,
}: {
  customerId: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const { t } = useTranslation();
  const customers = useCustomers();
  return (
    <Field label={label}>
      <select className="input" value={customerId} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t("sales.walkIn")}</option>
        {(customers.data ?? []).map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

function RetailForm({ price }: { price: number }) {
  const { t } = useTranslation();
  const createOrder = useCreateOrder();
  const finished = useFinishedItems();
  const customers = useCustomers();

  const [customerId, setCustomerId] = useState("");
  const [itemId, setItemId] = useState("");
  const [description, setDescription] = useState("Classic Band Ring");
  const [weight, setWeight] = useState(6.4);
  const [karat, setKarat] = useState(22);
  const [labor, setLabor] = useState(45);
  const [profit, setProfit] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const sellable = (finished.data ?? []).filter((f) => f.kind === "Sellable" && !f.sold);
  const subtotal = weight * price * purityFactor(karat) + labor + profit;
  const total = useMemo(() => subtotal * 1.15, [subtotal]);

  function pickItem(id: string) {
    setItemId(id);
    const item = sellable.find((f) => f.id === id);
    if (item) {
      setDescription(item.name);
      setWeight(Number(item.weight_g));
      setKarat(item.karat);
      setLabor(Number(item.labor_cost));
      setProfit(Number(item.profit));
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(null);
    try {
      const order = await createOrder.mutateAsync({
        channel: "Retail",
        customer_id: customerId || null,
        customer_name: customers.data?.find((c) => c.id === customerId)?.name ?? "Walk-in",
        gold_price: price,
        lines: [
          {
            description,
            weight_g: weight,
            karat,
            quantity: 1,
            unit_price: subtotal,
            finished_item_id: itemId || null,
          },
        ],
      });
      setDone(order.order_no);
      setItemId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <form onSubmit={submit}>
      <Card title={t("sales.retailCardTitle")} subtitle={t("sales.retailCardSub")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <CustomerPicker customerId={customerId} onChange={setCustomerId} label={t("sales.customerName")} />
          <Field label={t("sales.fromStock")}>
            <select className="input" value={itemId} onChange={(e) => pickItem(e.target.value)}>
              <option value="">{t("sales.customItem")}</option>
              {sellable.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.sku} · {f.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("sales.itemDesc")}>
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={160}
              required
            />
          </Field>
          <Field label={t("sales.weight")}>
            <input
              type="number"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(+e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("sales.purity")}>
            <select value={karat} onChange={(e) => setKarat(+e.target.value)} className="input">
              {[24, 22, 21, 18, 14].map((k) => (
                <option key={k} value={k}>
                  {k}K
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("sales.laborCost")}>
            <input
              type="number"
              min="0"
              value={labor}
              onChange={(e) => setLabor(+e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("sales.profitMargin")}>
            <input
              type="number"
              min="0"
              value={profit}
              onChange={(e) => setProfit(+e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <div className="mt-5 rounded-xl border border-primary/30 bg-gradient-to-br from-accent to-card p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <ValueLine label={t("sales.subtotal")} value={fmt(subtotal)} />
            <ValueLine label={t("sales.vat")} value={fmt(total - subtotal)} />
            <ValueLine label={t("sales.totalVat")} value={fmt(total)} highlight />
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {t("sales.formulaRetail")} {fmt(price)}
            {t("sales.formulaRetailSuffix")}
          </div>
        </div>

        <Feedback error={error} done={done} />

        <button
          type="submit"
          disabled={createOrder.isPending}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-luxury disabled:opacity-60"
        >
          {createOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
          {t("sales.confirmRetail")}
        </button>
      </Card>
    </form>
  );
}

function InvestmentForm({ price }: { price: number }) {
  const { t } = useTranslation();
  const createOrder = useCreateOrder();
  const customers = useCustomers();

  const [customerId, setCustomerId] = useState("");
  const [weight, setWeight] = useState(500);
  const [karat, setKarat] = useState(24);
  const [premium, setPremium] = useState(1.5);
  const [delivery, setDelivery] = useState("vaultStorage");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const spotValue = weight * price * purityFactor(karat);
  const premiumValue = spotValue * (premium / 100);
  const subtotal = spotValue + premiumValue;
  const total = subtotal * 1.15;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(null);
    try {
      const order = await createOrder.mutateAsync({
        channel: "Investment",
        customer_id: customerId || null,
        customer_name: customers.data?.find((c) => c.id === customerId)?.name ?? "Bullion buyer",
        gold_price: price,
        notes: t(`sales.${delivery}`),
        lines: [
          {
            description: `${karat}K Investment Bullion ${weight}g`,
            weight_g: weight,
            karat,
            quantity: 1,
            unit_price: subtotal,
          },
        ],
      });
      setDone(order.order_no);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <form onSubmit={submit}>
      <Card title={t("sales.investCardTitle")} subtitle={t("sales.investCardSub")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <CustomerPicker customerId={customerId} onChange={setCustomerId} label={t("sales.clientEntity")} />
          <Field label={t("sales.weight")}>
            <input
              type="number"
              step="1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(+e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("sales.purity")}>
            <select value={karat} onChange={(e) => setKarat(+e.target.value)} className="input">
              {[24, 22, 21].map((k) => (
                <option key={k} value={k}>
                  {k}K
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("sales.premiumSpot")}>
            <input
              type="number"
              step="0.1"
              value={premium}
              onChange={(e) => setPremium(+e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("sales.delivery")}>
            <select className="input" value={delivery} onChange={(e) => setDelivery(e.target.value)}>
              <option value="vaultStorage">{t("sales.vaultStorage")}</option>
              <option value="physicalPickup">{t("sales.physicalPickup")}</option>
              <option value="insuredCourier">{t("sales.insuredCourier")}</option>
            </select>
          </Field>
        </div>

        <div className="mt-5 rounded-xl border border-primary/30 bg-gradient-to-br from-accent to-card p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <ValueLine label={t("sales.spotValue")} value={fmt(spotValue)} />
            <ValueLine label={`${t("sales.premiumSpot")} (${premium}%)`} value={fmt(premiumValue)} />
            <ValueLine label={t("sales.totalVat")} value={fmt(total)} highlight />
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            {t("sales.formulaInvest")} {fmt(price)}
            {t("sales.formulaInvestSuffix")}
          </div>
        </div>

        <Feedback error={error} done={done} />

        <button
          type="submit"
          disabled={createOrder.isPending}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-luxury disabled:opacity-60"
        >
          {createOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
          {t("sales.issueCert")}
        </button>
      </Card>
    </form>
  );
}

function Feedback({ error, done }: { error: string | null; done: string | null }) {
  const { t } = useTranslation();
  if (!error && !done) return null;
  return (
    <div className="mt-4">
      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      {done && (
        <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
          {t("sales.created")} {done}
        </p>
      )}
    </div>
  );
}

function ValueLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-semibold ${highlight ? "text-lg text-gradient-gold" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
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

function RecentOrders() {
  const { t } = useTranslation();
  const { data, isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const remove = useDeleteOrder();

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-sm font-semibold">{t("sales.recentOrders")}</h3>
      {isLoading && <p className="mt-3 text-xs text-muted-foreground">{t("common.loading")}</p>}
      <ul className="mt-3 divide-y divide-border">
        {!isLoading && (data ?? []).length === 0 && (
          <li className="py-3 text-xs text-muted-foreground">{t("common.noRows")}</li>
        )}
        {(data ?? []).slice(0, 12).map((o) => (
          <li key={o.id} className="py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      o.channel === "Investment"
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {o.channel}
                  </span>
                  <span className="truncate text-sm font-medium">{o.customer_name}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {o.order_no} · {Number(o.total_weight_g)}g
                </div>
              </div>
              <div className="text-end">
                <div className="text-sm font-semibold text-primary">{fmt(Number(o.total))}</div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <select
                value={o.status}
                onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value as OrderStatus })}
                className="input h-8 flex-1 py-0 text-xs"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`orderStatus.${s}`)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (confirm(t("common.confirmDelete"))) remove.mutate(o.id);
                }}
                aria-label={t("common.delete")}
                className="grid h-8 w-8 place-items-center rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
