import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEmployees, useLeaveRequests, useComplianceAlerts } from "@/lib/hr";
import { Users, CalendarClock, Banknote, Palmtree, BarChart3, BellRing, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/hr/")({ 
  head: () => ({ meta: [{ title: "HR — Al Yaqoot ERP" }] }),
  component: HRDashboard,
});

function HRDashboard() {
  const { t } = useTranslation();
  const { data: employees } = useEmployees();
  const { data: leaves } = useLeaveRequests();
  const { data: alerts } = useComplianceAlerts();

  const pendingLeaves = (leaves ?? []).filter((l) => l.status === "pending").length;
  const criticalAlerts = (alerts ?? []).filter((a) => a.urgency === "critical").length;
  const totalAlerts = (alerts ?? []).length;

  const sections = [
    {
      to: "/hr/employees" as const,
      icon: Users,
      label: t("hr.employees"),
      sub: t("hr.employeesSubtitle"),
      badge: (employees ?? []).length,
      badgeClass: "bg-primary/15 text-primary",
    },
    {
      to: "/hr/attendance" as const,
      icon: CalendarClock,
      label: t("hr.attendance"),
      sub: t("hr.attendanceSubtitle"),
    },
    {
      to: "/hr/payroll" as const,
      icon: Banknote,
      label: t("hr.payroll"),
      sub: t("hr.payrollSubtitle"),
    },
    {
      to: "/hr/leave" as const,
      icon: Palmtree,
      label: t("hr.leave"),
      sub: t("hr.leaveSubtitle"),
      badge: pendingLeaves || undefined,
      badgeClass: "bg-amber-500/15 text-amber-300",
    },
    {
      to: "/hr/performance" as const,
      icon: BarChart3,
      label: t("hr.performance"),
      sub: t("hr.performanceSubtitle"),
    },
    {
      to: "/hr/alerts" as const,
      icon: BellRing,
      label: t("hr.alerts"),
      sub: t("hr.alertsSubtitle"),
      badge: totalAlerts || undefined,
      badgeClass: criticalAlerts > 0 ? "bg-destructive/15 text-destructive" : "bg-amber-500/15 text-amber-300",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("hr.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("hr.subtitle")}</p>
        </div>

        {/* Alert banner */}
        {criticalAlerts > 0 && (
          <Link
            to="/hr/alerts"
            className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/8 px-4 py-3 text-sm text-destructive hover:bg-destructive/12"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">{criticalAlerts} {t("hr.alertCritical")}</span>
            <span className="text-destructive/70">— {t("hr.alertBannerHint")}</span>
          </Link>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <Link
                key={sec.to}
                to={sec.to}
                className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:bg-card/80 hover:shadow-luxury"
              >
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  {sec.badge !== undefined && (
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${sec.badgeClass}`}>
                      {sec.badge}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{sec.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{sec.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
