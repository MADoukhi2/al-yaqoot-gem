import { type ReactNode } from "react";
import { Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ServiceStatus } from "@/lib/erp";

export const statusStyles: Record<ServiceStatus, string> = {
  Received: "bg-secondary text-muted-foreground border border-border",
  "Delivering to Workshop": "bg-blue-500/10 text-blue-300 border border-blue-500/20",
  Crafting: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
  Polishing: "bg-purple-500/10 text-purple-300 border border-purple-500/20",
  "Heading to Shop": "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20",
  Ready: "bg-primary/15 text-primary border border-primary/30",
};

export function StatusBadge({ status }: { status: ServiceStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[status]}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 text-start font-medium">{children}</th>;
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-luxury">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted-foreground">
        {label}
      </td>
    </tr>
  );
}

export function FormFooter({
  error,
  pending,
  onClose,
}: {
  error: string | null;
  pending: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {t("common.cancel")}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-gold px-5 py-2 text-sm font-semibold text-primary-foreground shadow-luxury disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("common.save")}
        </button>
      </div>
    </>
  );
}
