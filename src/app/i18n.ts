// i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enCommon from '../../../rcc/public/locales/en/common.json';
import roCommon from '../../../rcc/public/locales/ro/common.json';

i18n.use(initReactI18next).init({
    resources: {
        en: { common: enCommon },
        ro: { common: roCommon },
    },
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common'],          // Specify the namespaces
    defaultNS: 'common',     // Set the default namespace
    interpolation: {
        escapeValue: false,
    },
    react: {
        useSuspense: false,
    },
});

export default i18n;
