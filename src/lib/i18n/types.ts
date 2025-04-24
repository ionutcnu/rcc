export type Language = "en" | "ro" | "de" | "it" | "fr"

export interface LanguageOption {
    code: Language
    name: string
    nativeName: string
    flag: string
}

export const languages: Record<Language, string> = {
    en: "English",
    ro: "Romanian",
    de: "German",
    it: "Italian",
    fr: "French",
}

export const languageOptions: LanguageOption[] = [
    {
        code: "en",
        name: "English",
        nativeName: "English",
        flag: "🇬🇧",
    },
    {
        code: "ro",
        name: "Romanian",
        nativeName: "Română",
        flag: "🇷🇴",
    },
    {
        code: "de",
        name: "German",
        nativeName: "Deutsch",
        flag: "🇩🇪",
    },
    {
        code: "it",
        name: "Italian",
        nativeName: "Italiano",
        flag: "🇮🇹",
    },
    {
        code: "fr",
        name: "French",
        nativeName: "Français",
        flag: "🇫🇷",
    },
]
