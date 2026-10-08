'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './messages/en.json';
import id from './messages/id.json';

const messages = { en, id };
const LanguageContext = createContext(null);

export function LanguageProvider({ children, initialLocale = 'en' }) {
  const [locale, setLocaleState] = useState(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((nextLocale) => {
    if (nextLocale !== 'en' && nextLocale !== 'id') {
      return;
    }
    document.cookie = `mercury_locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setLocaleState(nextLocale);
  }, []);

  const value = useMemo(() => {
    const t = (key, values = {}) => {
      const message = key.split('.').reduce((current, part) => current?.[part], messages[locale]);
      if (typeof message !== 'string') {
        return key;
      }

      return message.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`);
    };

    return {
      locale,
      t,
      setLocale
    };
  }, [locale, setLocale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
