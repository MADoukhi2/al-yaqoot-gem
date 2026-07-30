import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Field } from "@/components/erp-ui";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Sign In — Al Yaqoot Cloud ERP" },
      {
        name: "description",
        content: "Sign in to the Al Yaqoot Cloud ERP to manage gold inventory, customers and sales.",
      },
      { property: "og:title", content: "Staff Sign In — Al Yaqoot Cloud ERP" },
      { property: "og:description", content: "Secure staff access to the Al Yaqoot jewelry ERP." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function YaqootLogo({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Al Yaqoot"
    >
      <polygon
        points="20,2 36,12 36,28 20,38 4,28 4,12"
        fill="#0f1e3d"
        stroke="#c9a84c"
        strokeWidth="1.5"
      />
      <polygon points="20,2 36,12 20,16 4,12" fill="#1a3060" />
      <polygon points="4,12 20,16 4,28" fill="#162a55" />
      <polygon points="36,12 20,16 36,28" fill="#0d1e45" />
      <polygon points="4,28 20,16 36,28 20,38" fill="#1a3060" />
      <polygon points="20,16 23,20 20,24 17,20" fill="#c9a84c" opacity="0.9" />
      <line x1="20" y1="2" x2="20" y2="7" stroke="#e8c96e" strokeWidth="1" opacity="0.7" />
    </svg>
  );
}

function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName.trim() },
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) navigate({ to: "/" });
        else setNotice(t("auth.checkEmail"));
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        navigate({ to: "/" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <YaqootLogo size={44} />
            <div>
              <div className="text-lg font-semibold text-gradient-gold">{t("appName")}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {t("appSubtitle")}
              </div>
            </div>
          </div>
          <LanguageToggle />
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {mode === "signin" ? t("auth.signInTitle") : t("auth.signUpTitle")}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">{t("auth.subtitle")}</p>
          </div>

          {mode === "signup" && (
            <Field label={t("auth.fullName")}>
              <input
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={100}
                required
              />
            </Field>
          )}

          <Field label={t("auth.email")}>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              required
            />
          </Field>

          <Field label={t("auth.password")}>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              maxLength={72}
              required
            />
          </Field>

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-luxury disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? t("auth.signIn") : t("auth.createAccount")}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setNotice(null);
            }}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? t("auth.needAccount") : t("auth.haveAccount")}
          </button>
        </form>
      </div>
    </div>
  );
}
