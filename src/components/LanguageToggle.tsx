import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();

  const toggle = () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", next);
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = next;
    }
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
      aria-label="Toggle language"
    >
      <Languages className="h-3.5 w-3.5" />
      {t("toggleLang")}
    </button>
  );
}
