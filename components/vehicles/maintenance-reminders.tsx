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
import { useToast } from "@/hooks/use-toast"

interface MaintenanceRemindersProps {
  vehicleId: string
}

export function MaintenanceReminders({ vehicleId }: MaintenanceRemindersProps) {
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
      title: "common.success",
      description: "vehicles.management.maintenance.reminders.saved",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"vehicles.details.maintenance.reminders.title"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{"vehicles.details.maintenance.reminders.enable"}</Label>
            <Switch />
          </div>
          <div>
            <Label>{"vehicles.details.maintenance.reminders.notification"}</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder={"vehicles.details.maintenance.reminders.both"} />
              </SelectTrigger>
            </Select>
          </div>
          <div>
            <Label>{"vehicles.details.maintenance.reminders.before"}</Label>
            <Input type="number" />
            <span className="ml-2">{"vehicles.details.maintenance.reminders.days"}</span>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          {"common.save"}
        </Button>
      </CardContent>
    </Card>
  )
} 