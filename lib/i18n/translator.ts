import type { Translations } from './types'

type TranslationKey = string
type TranslationParams = Record<string, string | number>

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, part) => acc?.[part], obj) as string
}

export function createTranslator(translations: Translations) {
  return function t(key: TranslationKey, params?: TranslationParams): string {
    // Get the translation string
    const value = getNestedValue(translations, key)
    
    // If no translation found, return the key
    if (!value) return key
    
    // If no params, return the translation as is
    if (!params) return value
    
    // Replace parameters in the translation string
    return Object.entries(params).reduce((acc, [key, value]) => {
      return acc.replace(new RegExp(`{${key}}`, 'g'), String(value))
    }, value)
  }
} 