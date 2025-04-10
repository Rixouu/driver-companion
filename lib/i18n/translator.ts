import type { Translations } from './types'

type TranslationKey = string
type TranslationParams = Record<string, string | number>

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, part) => acc?.[part], obj) as string
}

export function createTranslator(translations: Translations) {
  /**
   * Translate a string based on a key path
   * @param key The key path (e.g. "common.cancel")
   * @param params Optional parameters to replace in the string
   * @returns The translated string
   */
  return function translate(key: string, params?: Record<string, string | undefined>): string {
    // Split the key into parts
    const keys = key.split(".")
    
    // Start with the translations object
    let value: any = translations
    
    // Navigate through the keys
    for (const k of keys) {
      if (value === undefined || value[k] === undefined) {
        console.warn(`Translation key not found: ${key}`)
        return key // Return the key if not found
      }
      value = value[k]
    }
    
    // Safety check: if value is an object, convert to a string representation
    // to avoid React "Objects are not valid as React child" error
    if (value !== undefined && typeof value === 'object' && value !== null) {
      console.warn(`Translation key "${key}" returned an object instead of a string`);
      return key; // Return the key itself as a fallback
    }
    
    // Handle parameters
    if (params && value !== undefined) {
      return Object.entries(params).reduce((acc, [paramKey, paramVal]) => {
        return acc.replace(new RegExp(`{${paramKey}}`, "g"), paramVal || "")
      }, value)
    }
    
    return value
  }
} 