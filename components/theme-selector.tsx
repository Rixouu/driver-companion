"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Monitor } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export function ClientThemeSelector() {
  const { setTheme, theme } = useTheme()
  const { t } = useI18n()

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={theme === "light" ? "default" : "outline"}
        onClick={() => setTheme("light")}
        className="flex items-center gap-2"
        size="sm"
      >
        <Sun className="h-4 w-4" />
        {t("settings.preferences.theme.light")}
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "outline"}
        onClick={() => setTheme("dark")}
        className="flex items-center gap-2"
        size="sm"
      >
        <Moon className="h-4 w-4" />
        {t("settings.preferences.theme.dark")}
      </Button>
      <Button
        variant={theme === "system" ? "default" : "outline"}
        onClick={() => setTheme("system")}
        className="flex items-center gap-2"
        size="sm"
      >
        <Monitor className="h-4 w-4" />
        {t("settings.preferences.theme.system")}
      </Button>
    </div>
  )
} 