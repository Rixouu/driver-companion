import { cookies } from 'next/headers'
import { createTranslator } from './translator'
import { en } from './locales/en'
import { ja } from './locales/ja'
import type { TranslationValue } from './types'

const locales = {
  en,
  ja
} as const

export async function getDictionary() {
  // In Next.js, pass cookies directly
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
  
  // Get the translations for the current locale
  const translations = locales[locale as keyof typeof locales] || locales.en
  
  // Create a translator function
  const t = createTranslator(translations)
  
  return {
    t,
    dictionary: translations as TranslationValue
  }
}

export type Locale = keyof typeof locales
export type Translations = typeof en 