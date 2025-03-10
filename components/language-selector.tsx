"use client"

import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n()

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={language === "en" ? "default" : "outline"}
        onClick={() => setLanguage("en")}
        className="flex items-center gap-2"
        size="sm"
      >
        <span className="font-medium text-xs">EN</span>
        {t("settings.preferences.language.en")}
      </Button>
      <Button
        variant={language === "ja" ? "default" : "outline"}
        onClick={() => setLanguage("ja")}
        className="flex items-center gap-2"
        size="sm"
      >
        <span className="font-medium text-xs">JA</span>
        {t("settings.preferences.language.ja")}
      </Button>
    </div>
  )
} 