/**
 * Clean translated text by removing separator markers
 */
export function cleanTranslatedText(text: string | null): string {
  if (!text) return ""
  return text.replace(/TRADUZIONE_SEPARATORE-+/g, "").trim()
}
