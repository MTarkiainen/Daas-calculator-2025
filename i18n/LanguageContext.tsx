import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { translations } from './translations';
import { Language, languages } from './languages';

type LanguageCode = keyof typeof translations;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  locale: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const storedLangCode = localStorage.getItem('languageCode');
    return languages.find(l => l.code === storedLangCode) || languages[0]; // Default to English
  });

  useEffect(() => {
    localStorage.setItem('languageCode', language.code);
  }, [language]);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    const langCode = language.code as LanguageCode;

    // Helper to safely traverse a nested object based on a dot-separated key.
    const findTranslation = (langObj: any, key: string): string | undefined => {
        return key.split('.').reduce((obj: any, k: string) => obj?.[k], langObj);
    };

    // 1. Try to find the translation in the currently selected language.
    let translation = findTranslation(translations[langCode], key);

    // 2. If it's not found and the selected language is not English, fall back to English.
    if (translation === undefined && langCode !== 'en') {
        translation = findTranslation(translations.en, key);
    }

    // 3. If it's still not found, warn the developer and return the key.
    if (translation === undefined) {
        console.warn(`Translation key "${key}" not found for language "${langCode}" or fallback "en".`);
        return key;
    }
    
    // 4. Handle replacements (e.g., {name}).
    if (replacements) {
        Object.entries(replacements).forEach(([placeholder, value]) => {
            translation = translation!.replace(`{${placeholder}}`, String(value));
        });
    }

    return translation;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, locale: language.locale }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};