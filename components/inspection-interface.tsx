"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/components/providers/language-provider"
import { Checkbox } from "@/components/ui/checkbox"
import { Camera, Download } from "lucide-react"
import type { Vehicle, CheckItem } from "@/types"

export function InspectionInterface({ vehicle }: { vehicle: Vehicle }) {
  const [selectedArea, setSelectedArea] = useState<string>("front")
  const [photos, setPhotos] = useState<string[]>([])
  const { t } = useLanguage()

  const areas = ["front", "rear", "left", "right", "interior"]

  const checkItems: CheckItem[] = [
    {
      id: "1",
      type: "paint",
      label: "Paint",
      labelJa: "塗装",
      checked: false,
      photos: [],
      notes: "",
      area: "front"
    },
    {
      id: "2",
      type: "dent",
      label: "Dent / Scratch",
      labelJa: "へこみ / 傷",
      checked: false,
      photos: [],
      notes: "",
      area: "front"
    },
    {
      id: "3",
      type: "gap",
      label: "Gap / Alignment",
      labelJa: "隙間 / 位置ずれ",
      checked: false,
      photos: [],
      notes: "",
      area: "front"
    },
    {
      id: "4",
      type: "malfunction",
      label: "Malfunction",
      labelJa: "故障",
      checked: false,
      photos: [],
      notes: "",
      area: "front"
    }
  ]

  return (
    <div className="container mx-auto p-4 grid md:grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="relative aspect-[3/2] mb-4">
            <Image
              src={vehicle.imageUrl || "/placeholder.svg"}
              alt={vehicle.name}
              fill
              className="object-cover rounded-lg"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {areas.map((area) => (
              <Button
                key={area}
                variant={selectedArea === area ? "default" : "outline"}
                onClick={() => setSelectedArea(area)}
                className="capitalize"
              >
                {area}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 capitalize">{selectedArea} Inspection</h3>
          <div className="space-y-4">
            {checkItems.map((item) => (
              <div key={item.id} className="flex items-start space-x-4">
                <Checkbox id={item.id} />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={item.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {item.label}
                    <span className="text-muted-foreground ml-2">{item.labelJa}</span>
                  </label>
                </div>
                <Button size="icon" variant="outline" className="ml-auto">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button className="w-full mt-6">
            <Download className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

