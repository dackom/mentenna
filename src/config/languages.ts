/**
 * Language Configuration
 *
 * Define the languages available for multilingual fields.
 * You can add or remove languages as needed (up to 10 recommended).
 *
 * Each language has:
 * - code: ISO 639-1 two-letter code (lowercase)
 * - name: Display name in English
 * - nativeName: Display name in the native language
 */

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const AVAILABLE_LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "sr", name: "Serbian", nativeName: "Српски" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
];

/**
 * Get language by code
 */
export function getLanguageByCode(code: string): Language | undefined {
  return AVAILABLE_LANGUAGES.find((lang) => lang.code === code.toLowerCase());
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(code: string): string {
  const language = getLanguageByCode(code);
  return language ? `${language.name}` : code.toUpperCase();
}
