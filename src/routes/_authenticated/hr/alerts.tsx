import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useComplianceAlerts } from "@/lib/hr";
import { AlertTriangle, ShieldAlert, Clock, FileCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_authenticated/hr/alerts")({
  head: () => ({ meta: [{ title: "Compliance Alerts — Al Yaqoot HR" }] }),
  component: AlertsPage,
});

const TYPE_ICONS: Record<string, React.ElementType> = {
  iqama: ShieldAlert,
  passport: FileCheck,
  contract: Clock,
  probation: AlertTriangle,
};

const TYPE_LABELS: Record<string, string> = {
  iqama: "hr.alertIqama",
  passport: "hr.alertPassport",
  contract: "hr.alertContract",
  probation: "hr.alertProbation",
};

function AlertsPage() {
  const { t } = useTranslation();
  const { data: alerts, isLoading } = useComplianceAlerts();

  const critical = (alerts ?? []).filter((a) => a.urgency === "critical");
  const warnings = (alerts ?? []).filter((a) => a.urgency === "warning");

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("hr.alerts")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("hr.alertsSubtitle")}</p>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive">
            <ShieldAlert className="h-4 w-4" />
            {critical.length} {t("hr.alertCritical")}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            {warnings.length} {t("hr.alertWarning")}
          </div>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        )}

        {!isLoading && (alerts ?? []).length === 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
            <div className="text-4xl">✅</div>
            <p className="mt-2 text-sm font-medium text-foreground">{t("hr.noAlerts")}</p>
            <p className="text-xs text-muted-foreground">{t("hr.noAlertsSubtitle")}</p>
          </div>
        )}

        {/* Critical */}
        {critical.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-destructive">{t("hr.alertCritical")}</h2>
            {critical.map((alert) => {
              const Icon = TYPE_ICONS[alert.type] ?? AlertTriangle;
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 rounded-xl border border-destructive/30 bg-destructive/8 p-4"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-destructive/15">
                    <Icon className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{alert.employee}</div>
                    <div className="text-xs text-muted-foreground">{alert.employee_no}</div>
                    <div className="mt-1 text-xs text-destructive font-medium">
                      {t(TYPE_LABELS[alert.type] ?? "hr.alertGeneric")} — {t("hr.expiredOn")} {alert.date}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-300">{t("hr.alertWarning")}</h2>
            {warnings.map((alert) => {
              const Icon = TYPE_ICONS[alert.type] ?? AlertTriangle;
              return (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 rounded-xl border border-amber-500/30 bg-amber-500/8 p-4"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500/15">
                    <Icon className="h-4 w-4 text-amber-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{alert.employee}</div>
                    <div className="text-xs text-muted-foreground">{alert.employee_no}</div>
                    <div className="mt-1 text-xs text-amber-300 font-medium">
                      {t(TYPE_LABELS[alert.type] ?? "hr.alertGeneric")} — {t("hr.expiresOn")} {alert.date}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </AppShell>
  );
}
