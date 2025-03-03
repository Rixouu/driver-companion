"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useEffect, useState } from "react"
import { ClientThemeSelector } from "@/components/theme-selector"
import { useI18n } from "@/lib/i18n/context"
import type { Session } from '@supabase/auth-helpers-nextjs'

export default function SettingsPage() {
  const supabase = createClientComponentClient()
  const [session, setSession] = useState<Session | null>(null)
  const { t } = useI18n()

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    getSession()
  }, [supabase])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground">
          {t("settings.description")}
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.profile.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("settings.profile.description")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("settings.profile.name")}</Label>
              <Input 
                id="name" 
                value={session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || ""} 
                disabled 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("settings.profile.email")}</Label>
              <Input 
                id="email" 
                type="email" 
                value={session?.user?.email || ""} 
                disabled 
              />
              <p className="text-sm text-muted-foreground">
                {t("settings.profile.emailDescription")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.preferences.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("settings.preferences.description")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">{t("settings.preferences.theme.title")}</Label>
              <ClientThemeSelector />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 