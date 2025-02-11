"use client"

import { useState } from "react"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label" // Import the Label component
import type { DamageReport } from "@/types/api"

export function DamageReportForm() {
  const [damages, setDamages] = useState<DamageReport[]>([])

  const addDamageReport = async (report: Partial<DamageReport>) => {
    const newDamage: DamageReport = {
      id: Math.random().toString(),
      location: report.location || "",
      severity: report.severity || "minor",
      description: report.description || "",
      photos: report.photos || [],
      reportedAt: new Date().toISOString(),
    }

    setDamages([...damages, newDamage])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Damage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Location</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="front">Front</SelectItem>
              <SelectItem value="rear">Rear</SelectItem>
              <SelectItem value="left">Left Side</SelectItem>
              <SelectItem value="right">Right Side</SelectItem>
              <SelectItem value="interior">Interior</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Severity</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minor">Minor</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="severe">Severe</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea placeholder="Describe the damage..." />
        </div>

        <Button className="w-full">
          <Camera className="mr-2 h-4 w-4" />
          Add Photos
        </Button>
      </CardContent>
    </Card>
  )
}

