import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Boxes, ShoppingBag, Users, Gem, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useLiveGoldPrice, fmt } from "@/lib/gold";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "./LanguageToggle";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { price } = useLiveGoldPrice();

  const nav = [
    { to: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/inventory", label: t("nav.inventory"), icon: Boxes },
    { to: "/sales", label: t("nav.sales"), icon: ShoppingBag },
    { to: "/customers", label: t("nav.customers"), icon: Users },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 start-0 z-40 w-64 border-e border-border bg-card/80 backdrop-blur transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-gold shadow-luxury">
            <Gem className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-wide text-gradient-gold">
              {t("appName")}
            </div>
            <div className="truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("appSubtitle")}
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground shadow-luxury"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-3 bottom-3 rounded-lg border border-border bg-secondary/60 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("liveGold")}</div>
          <div className="mt-1 font-semibold text-primary">{fmt(price)}</div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="lg:ps-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground lg:hidden"
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
              <span className="text-gradient-gold">{t("appName")} ERP</span>
            </h1>
          </div>
          <LanguageToggle />
          <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            <span className="text-muted-foreground">{t("liveGold")}</span>
            <span className="font-semibold text-primary">{fmt(price)}/g</span>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
