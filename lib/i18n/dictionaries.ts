import { en } from "./locales/en"
import { ja } from "./locales/ja"
import { createTranslator } from "./translator"
import { getCookie } from "cookies-next"

const locales = {
  en,
  ja
} as const

/**
 * Client-side version of getDictionary to be used in client components.
 * Uses cookies-next instead of next/headers cookies which is server-only.
 */
export async function getDictionary() {
  // Get locale from cookie in client components
  const locale = getCookie('NEXT_LOCALE')?.toString() || 'en'
  
  // Get the translations for the current locale
  const translations = (locale === 'ja' ? ja : en)
  
  // Create a translator function
  const t = createTranslator(translations)
  
  return {
    t,
    dictionary: translations
  }
} 