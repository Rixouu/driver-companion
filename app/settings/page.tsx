"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { PageContainer } from "@/components/layouts/page-container"
import { useLanguage } from "@/components/providers/language-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const [name, setName] = useState(session?.user?.name || "")
  const [email, setEmail] = useState(session?.user?.email || "")
  const [notifications, setNotifications] = useState(true)
  const { t, language, setLanguage } = useLanguage()

  if (status === "loading") {
    return <PageContainer>Loading...</PageContainer>
  }

  if (status === "unauthenticated") {
    return <PageContainer>Access Denied</PageContainer>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Implement update logic here
    console.log("Update profile:", { name, email, notifications })
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        
        {/* Language Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.languageSettings")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="language">{t("settings.language")}</Label>
              <Select value={language} onValueChange={(value: "en" | "ja") => setLanguage(value)}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.profile")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("settings.name")}</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("settings.email")}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="notifications" 
                    checked={notifications} 
                    onCheckedChange={setNotifications} 
                  />
                  <Label htmlFor="notifications">{t("settings.enableNotifications")}</Label>
                </div>
              </div>
              <Button type="submit">{t("settings.saveChanges")}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

