"use client";

import React, { createContext, useContext, useState, useTransition } from "react";
import { Locale } from "./translations";
import { getTranslation, getTranslatedTeamName } from "./utils";
import { useRouter } from "next/navigation";

interface LanguageContextProps {
  locale: Locale;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
  isPending: boolean;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    // Set the cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  };

  const t = (key: string, replacements?: Record<string, string | number>) => {
    return getTranslation(locale, key, replacements);
  };

  return (
    <LanguageContext.Provider value={{ locale, t, setLocale, isPending }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

export { getTranslation, getTranslatedTeamName };
export type { Locale };
