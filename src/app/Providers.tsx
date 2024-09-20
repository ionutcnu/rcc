// app/Providers.tsx

'use client';

import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../app/i18n';


export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load language from localStorage if available
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage && i18n.language !== storedLanguage) {
      i18n.changeLanguage(storedLanguage);
    }

    // Update the lang attribute of the HTML element
    document.documentElement.lang = i18n.language;

    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      document.documentElement.lang = lng;
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
