"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/providers/language-provider"
import { PageContainer } from "@/components/layouts/page-container"

export default function SettingsPage() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Since we're using Google auth, we can't modify the name
      // It will always come from Google
      toast({
        title: t("settings.success"),
        description: t("settings.profileUpdated"),
      })
    } catch (error) {
      toast({
        title: t("errors.error"),
        description: t("errors.updateFailed"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">{t("settings.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("settings.description")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.profile")}</CardTitle>
            <CardDescription>
              {t("settings.profileDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("settings.name")}</Label>
                <Input
                  id="name"
                  defaultValue={session?.user?.name || ""}
                  disabled={true}
                />
                <p className="text-sm text-muted-foreground">
                  {t("settings.nameNote")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("settings.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={session?.user?.email || ""}
                  disabled={true}
                />
                <p className="text-sm text-muted-foreground">
                  {t("settings.emailNote")}
                </p>
              </div>
              <Button type="submit" disabled={true}>
                {t("common.save")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

