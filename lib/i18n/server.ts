import { cookies } from 'next/headers'
import { en } from './locales/en'
import { ja } from './locales/ja'
import type { Translations } from './types'

const dictionaries = {
  en,
  ja,
}

export async function getDictionary(locale?: string): Promise<Translations> {
  // If locale is not provided, try to get it from cookies
  if (!locale) {
    const cookieStore = cookies()
    locale = cookieStore.get('NEXT_LOCALE')?.value || 'en'
  }
  
  // Ensure locale is valid
  if (!['en', 'ja'].includes(locale)) {
    locale = 'en'
  }
  
  return dictionaries[locale as keyof typeof dictionaries]
} 