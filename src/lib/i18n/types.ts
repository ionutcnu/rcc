export type Language = "en" | "fr" | "de" | "it" | "ro"

export const languages: Record<Language, string> = {
    en: "English",
    fr: "French",
    de: "German",
    it: "Italian",
    ro: "Romanian",
}

export const languageOptions = [
    { code: "en" as Language, name: "English", flag: "🇬🇧" },
    { code: "fr" as Language, name: "French", flag: "🇫🇷" },
    { code: "de" as Language, name: "German", flag: "🇩🇪" },
    { code: "it" as Language, name: "Italian", flag: "🇮🇹" },
    { code: "ro" as Language, name: "Romanian", flag: "🇷🇴" },
]
