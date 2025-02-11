"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Camera, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

// Mock inspection items for each side
const INSPECTION_ITEMS = {
  front: [
    { id: "f1", description: "Lights functioning" },
    { id: "f2", description: "Grill condition" },
    { id: "f3", description: "Hood condition" },
    { id: "f4", description: "Windshield condition" },
  ],
  left: [
    { id: "l1", description: "Left front tire condition" },
    { id: "l2", description: "Left rear tire condition" },
    { id: "l3", description: "Left side panels" },
    { id: "l4", description: "Left mirrors" },
  ],
  right: [
    { id: "r1", description: "Right front tire condition" },
    { id: "r2", description: "Right rear tire condition" },
    { id: "r3", description: "Right side panels" },
    { id: "r4", description: "Right mirrors" },
  ],
  rear: [
    { id: "b1", description: "Tail lights" },
    { id: "b2", description: "Trunk condition" },
    { id: "b3", description: "Rear bumper" },
    { id: "b4", description: "License plate" },
  ],
}

interface InspectionItem {
  status: "pass" | "fail" | null
  image: string | null
}

interface InspectionFormProps {
  vehicleId: string
  initialData?: Record<string, Record<string, InspectionItem>>
  readOnly?: boolean
}

export function InspectionForm({ vehicleId, initialData, readOnly }: InspectionFormProps) {
  const [activeTab, setActiveTab] = useState("front")
  const [inspectionData, setInspectionData] = useState<Record<string, Record<string, InspectionItem>>>(
    initialData || {}
  )

  const handleStatus = (side: string, itemId: string, status: "pass" | "fail") => {
    if (readOnly) return
    setInspectionData((prev) => ({
      ...prev,
      [side]: {
        ...prev[side],
        [itemId]: { ...prev[side]?.[itemId], status },
      },
    }))
  }

  const handleCapture = async (side: string, itemId: string) => {
    if (readOnly) return
    // Mock image capture - in real app, this would use the device camera
    const mockImageUrl = "data:image/jpeg;base64,..."
    setInspectionData((prev) => ({
      ...prev,
      [side]: {
        ...prev[side],
        [itemId]: { ...prev[side]?.[itemId], image: mockImageUrl },
      },
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 border-b">
        {Object.keys(INSPECTION_ITEMS).map((side) => (
          <button
            key={side}
            onClick={() => setActiveTab(side)}
            className={`px-4 py-2 capitalize ${
              activeTab === side 
                ? "border-b-2 border-primary font-medium" 
                : "text-muted-foreground"
            }`}
          >
            {side}
          </button>
        ))}
      </div>

      {Object.entries(INSPECTION_ITEMS).map(([side, items]) => (
        <div key={side} className={activeTab === side ? "block" : "hidden"}>
          <div className="space-y-8">
            {items.map((item) => {
              const itemData = inspectionData[side]?.[item.id]
              return (
                <div key={item.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg">{item.description}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={itemData?.status === "pass" ? "default" : "outline"}
                        onClick={() => handleStatus(side, item.id, "pass")}
                        className="min-w-[80px]"
                        disabled={readOnly}
                      >
                        Pass
                      </Button>
                      <Button
                        size="sm"
                        variant={itemData?.status === "fail" ? "destructive" : "outline"}
                        onClick={() => handleStatus(side, item.id, "fail")}
                        className="min-w-[80px]"
                        disabled={readOnly}
                      >
                        Fail
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCapture(side, item.id)}
                        disabled={readOnly}
                      >
                        Capture
                      </Button>
                    </div>
                  </div>
                  {itemData?.image && (
                    <div className="mt-2">
                      <img
                        src={itemData.image}
                        alt="Inspection"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="container flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href="/vehicles">Back</Link>
          </Button>
          {!readOnly && (
            <Button className="min-w-[200px]">Complete Inspection</Button>
          )}
        </div>
      </div>
    </div>
  )
}

