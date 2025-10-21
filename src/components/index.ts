// Multilingual JSON Field Components
export { MultilingualJsonField } from "./multilingual-json-field";
export type { LanguageValue } from "./multilingual-json-field";
export { MultilingualJsonFieldRHF } from "./multilingual-json-field-rhf";

// Genre Management
export { GenreManagementDialog } from "./genre-management-dialog";

// Re-export language configuration for convenience
export {
  AVAILABLE_LANGUAGES,
  getLanguageByCode,
  getLanguageDisplayName,
} from "@/config/languages";
export type { Language } from "@/config/languages";
