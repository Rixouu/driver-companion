"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { en } from "./locales/en"
import { ja } from "./locales/ja"
import { getCookie, setCookie } from "cookies-next"

type Language = "en" | "ja"
type Translations = typeof en

const languages = {
  en,
  ja,
} as const

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string>) => string
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

  const t = (key: string, params?: Record<string, string>) => {
    const keys = key.split(".")
    let value: any = languages[language]

    for (const k of keys) {
      if (value[k] === undefined) {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
      value = value[k]
    }

    if (params) {
      return Object.entries(params).reduce((acc, [key, val]) => {
        return acc.replace(`{${key}}`, val)
      }, value)
    }

    return value
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
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