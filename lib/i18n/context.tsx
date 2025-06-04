"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { en } from "./locales/en"
import { ja } from "./locales/ja"
import { getCookie, setCookie } from "cookies-next"
import type { TranslationPaths } from "./types"

type Language = "en" | "ja"

// Define the type for a single translation key, generated from the structure of 'en' locale
export type AppTranslationKey = TranslationPaths<typeof en>

const languages = {
  en,
  ja,
} as const

interface I18nContextType {
  language: Language
  locale: Language
  setLanguage: (lang: Language) => void
  t: (key: AppTranslationKey, params?: Record<string, string | number | undefined>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    // First check cookie (server-side preference)
    const cookieLang = getCookie('NEXT_LOCALE') as Language
    
    // Then check localStorage (client-side preference)
    const savedLang = localStorage.getItem("language") as Language
    
    // Use cookie first, then localStorage, then default to "en"
    if (cookieLang && (cookieLang === "en" || cookieLang === "ja")) {
      setLanguage(cookieLang)
      // Sync localStorage with cookie
      localStorage.setItem("language", cookieLang)
    } else if (savedLang && (savedLang === "en" || savedLang === "ja")) {
      setLanguage(savedLang)
      // Sync cookie with localStorage
      setCookie('NEXT_LOCALE', savedLang, { maxAge: 60 * 60 * 24 * 30 }) // 30 days
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
    setCookie('NEXT_LOCALE', lang, { maxAge: 60 * 60 * 24 * 30 }) // 30 days
  }

  const t = (key: AppTranslationKey, params?: Record<string, string | number | undefined>) => {
    const keys = key.split(".")
    let value: any = languages[language]
    let fallbackValue: any = languages["en"] // Use English as fallback
    
    // Try to find the translation in the current language
    for (const k of keys) {
      if (value === undefined || value[k] === undefined) {
        value = undefined
        break
      }
      value = value[k]
    }
    
    // If not found, try to find in the fallback language (English)
    if (value === undefined && language !== "en") {
      for (const k of keys) {
        if (fallbackValue === undefined || fallbackValue[k] === undefined) {
          fallbackValue = undefined
          break
        }
        fallbackValue = fallbackValue[k]
      }
    }
    
    // Use the found value, fallback, or default
    let result = value !== undefined ? value : (fallbackValue !== undefined ? fallbackValue : undefined)
    
    // Safety check: if result is an object, convert to a string representation 
    // to avoid React "Objects are not valid as React child" error
    if (result !== undefined && typeof result === 'object' && result !== null) {
      console.warn(`Translation key "${key}" returned an object instead of a string`);
      return key; // Return the key itself as a fallback
    }
    
    // If we have a default value in the parameters, use it when no translation found
    if (result === undefined && params?.defaultValue) {
      result = params.defaultValue
    } else if (result === undefined) {
      console.warn(`Translation key not found: ${key}`)
      return key // Return key as last resort
    }

    // Replace parameters in the translation if provided
    if (params && result !== undefined) {
      return Object.entries(params).reduce((acc, [paramKey, paramVal]) => {
        if (paramKey === 'defaultValue') return acc // Skip the defaultValue parameter
        // Ensure paramVal is a string for replacement
        const replacementValue = typeof paramVal === 'number' ? String(paramVal) : (paramVal || '');
        return acc.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), replacementValue)
      }, result)
    }

    return result
  }

  return (
    <I18nContext.Provider value={{ language, locale: language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
} 