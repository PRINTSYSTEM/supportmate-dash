import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import vi from './locales/vi.json';
import en from './locales/en.json';

type Locale = 'vi' | 'en';
type Translations = Record<string, string>;

const messages: Record<Locale, Translations> = { vi, en };

interface I18nContextType {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = params[key];
    return val != null ? String(val) : `{${key}}`;
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Locale>(() => {
    const saved = localStorage.getItem('language') as Locale | null;
    return saved === 'en' ? 'en' : 'vi';
  });

  const setLanguage = useCallback((lang: Locale) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const template = messages[language]?.[key];
      if (!template) return key;
      return interpolate(template, params);
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
