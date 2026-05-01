import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { fr, enUS, es, type Locale } from "date-fns/locale";
import { format as fnsFormat, formatDistanceToNow as fnsDistance, formatRelative as fnsRelative } from "date-fns";

const LOCALES: Record<string, Locale> = { fr, en: enUS, es };

/** Returns the date-fns Locale matching the active i18n language. */
export function useDateLocale(): Locale {
  const { i18n } = useTranslation();
  const code = (i18n.resolvedLanguage ?? i18n.language ?? "fr").slice(0, 2);
  return LOCALES[code] ?? fr;
}

/** Convenience hook: localized date formatter helpers. */
export function useFormatters() {
  const locale = useDateLocale();
  return useMemo(() => ({
    locale,
    format: (date: Date | number | string, pattern: string) =>
      fnsFormat(typeof date === "string" ? new Date(date) : date, pattern, { locale }),
    distance: (date: Date | number | string) =>
      fnsDistance(typeof date === "string" ? new Date(date) : date, { addSuffix: true, locale }),
    relative: (date: Date | number | string, base: Date = new Date()) =>
      fnsRelative(typeof date === "string" ? new Date(date) : date, base, { locale }),
  }), [locale]);
}

/** Sync <html lang="…" dir="…"> with active language (call once at app root). */
export function useSyncHtmlLang() {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? i18n.language ?? "fr").slice(0, 2);
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    document.documentElement.dir = "ltr";
  }
}
