import { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { ClientThemeSelector } from "@/components/theme-selector"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences",
}

export default async function SettingsPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage your account settings
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || ""} 
                disabled 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={session?.user?.email || ""} 
                disabled 
              />
              <p className="text-sm text-muted-foreground">
                Your email address is used for notifications and sign-in
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <p className="text-sm text-muted-foreground">
              Customize your application experience
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <ClientThemeSelector />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

