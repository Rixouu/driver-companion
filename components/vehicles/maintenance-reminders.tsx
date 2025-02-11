"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/providers/language-provider"

interface MaintenanceRemindersProps {
  vehicleId: string
}

export function MaintenanceReminders({ vehicleId }: MaintenanceRemindersProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    enabled: true,
    notificationType: "both",
    daysBeforeReminder: 7,
  })

  const handleSave = async () => {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast({
      title: t("common.success"),
      description: t("vehicles.management.maintenance.reminders.saved"),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("vehicles.management.maintenance.reminders.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="notifications">
            {t("vehicles.management.maintenance.reminders.enable")}
          </Label>
          <Switch
            id="notifications"
            checked={settings.enabled}
            onCheckedChange={(checked) => 
              setSettings({ ...settings, enabled: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>
            {t("vehicles.management.maintenance.reminders.notification")}
          </Label>
          <Select
            value={settings.notificationType}
            onValueChange={(value) => 
              setSettings({ ...settings, notificationType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">
                {t("vehicles.management.maintenance.reminders.email")}
              </SelectItem>
              <SelectItem value="push">
                {t("vehicles.management.maintenance.reminders.push")}
              </SelectItem>
              <SelectItem value="both">
                {t("vehicles.management.maintenance.reminders.both")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>
            {t("vehicles.management.maintenance.reminders.before")}
          </Label>
          <Input
            type="number"
            value={settings.daysBeforeReminder}
            onChange={(e) => setSettings({
              ...settings,
              daysBeforeReminder: parseInt(e.target.value)
            })}
            min={1}
            max={30}
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          {t("common.save")}
        </Button>
      </CardContent>
    </Card>
  )
} 