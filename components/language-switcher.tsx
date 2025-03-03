"use client"

import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "ja" : "en")}
    >
      {language === "en" ? "日本語" : "English"}
    </Button>
  )
} 