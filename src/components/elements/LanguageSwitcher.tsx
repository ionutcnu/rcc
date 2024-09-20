// components/LanguageSwitcher.tsx

'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    const handleLanguageSwitch = (lang: string) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;
    };

    return (
        <div className="flex items-center space-x-2">
            <button
                onClick={() => handleLanguageSwitch('ro')}
                className={`hover:text-gray-400 ${i18n.language === 'ro' ? 'font-bold' : ''}`}
            >
                RO
            </button>
            <span>|</span>
            <button
                onClick={() => handleLanguageSwitch('en')}
                className={`hover:text-gray-400 ${i18n.language === 'en' ? 'font-bold' : ''}`}
            >
                EN
            </button>
        </div>
    );
};

export default LanguageSwitcher;
