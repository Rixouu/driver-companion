"use client"

import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()
  const router = useRouter()

  const handleLanguageChange = () => {
    const newLanguage = language === "en" ? "ja" : "en"
    setLanguage(newLanguage)
    router.refresh() // Refresh the page to update server components
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLanguageChange}
    >
      {language === "en" ? "日本語" : "English"}
    </Button>
  )
} 