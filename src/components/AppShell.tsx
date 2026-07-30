import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Boxes,
  ShoppingBag,
  Users,
  Menu,
  X,
  TrendingUp,
  ReceiptText,
  Settings,
  Wrench,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useLiveGoldPrice, fmt } from "@/lib/gold";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "./LanguageToggle";

/** Silk Al-Yaqoot gem logo — navy faceted gemstone with gold accent */
function YaqootLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Al Yaqoot"
    >
      {/* Outer gem shape */}
      <polygon
        points="20,2 36,12 36,28 20,38 4,28 4,12"
        fill="#0f1e3d"
        stroke="#c9a84c"
        strokeWidth="1.5"
      />
      {/* Top facets */}
      <polygon points="20,2 36,12 20,16 4,12" fill="#1a3060" />
      {/* Left facet */}
      <polygon points="4,12 20,16 4,28" fill="#162a55" />
      {/* Right facet */}
      <polygon points="36,12 20,16 36,28" fill="#0d1e45" />
      {/* Bottom facet */}
      <polygon points="4,28 20,16 36,28 20,38" fill="#1a3060" />
      {/* Centre sparkle */}
      <polygon points="20,16 23,20 20,24 17,20" fill="#c9a84c" opacity="0.9" />
      {/* Top glint */}
      <line x1="20" y1="2" x2="20" y2="7" stroke="#e8c96e" strokeWidth="1" opacity="0.7" />
    </svg>
  );
}

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
    { to: "/invoices", label: t("nav.invoices"), icon: ReceiptText },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 start-0 z-40 flex w-[17rem] flex-col border-e border-border bg-card/70 backdrop-blur-xl transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[4.5rem] items-center gap-3 px-5">
          <YaqootLogo size={40} />
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-semibold tracking-tight">
              {t("appName")}
            </div>
            <div className="truncate text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("appSubtitle")}
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 p-3">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary/12 text-foreground"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                }`}
              >
                <span
                  className={`absolute inset-y-2 start-0 w-1 rounded-full bg-primary transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
                <Icon className={`h-[1.05rem] w-[1.05rem] ${active ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="m-3 rounded-2xl border border-primary/25 bg-primary/8 p-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            {t("liveGold")}
          </div>
          <div className="mt-1.5 font-display text-lg font-bold text-foreground">{fmt(price)}</div>
          <div className="text-[11px] text-muted-foreground">24K · g</div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="lg:ps-[17rem]">
        <header className="sticky top-0 z-20 flex h-[4.5rem] items-center gap-3 border-b border-border/70 bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:text-foreground lg:hidden"
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <YaqootLogo size={28} />
            <h1 className="truncate font-display text-lg font-semibold tracking-tight sm:text-xl">
              {t("appName")} <span className="text-muted-foreground">ERP</span>
            </h1>
          </div>
          <LanguageToggle />
          <div className="hidden items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-2 text-xs sm:flex">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">{t("liveGold")}</span>
            <span className="font-semibold text-foreground">{fmt(price)}/g</span>
          </div>
        </header>
        <main className="mx-auto max-w-[95rem] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
