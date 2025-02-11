"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { PageContainer } from "@/components/layouts/page-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/providers/language-provider"
import { PhotoUpload } from "@/components/inspections/photo-upload"
import { VoiceRecorder } from "@/components/inspections/voice-recorder"
import { SignaturePad } from "@/components/inspections/signature-pad"
import { Checkbox } from "@/components/ui/checkbox"
import { NewInspectionForm } from "@/components/inspections/new-inspection-form"

// Mock data for the vehicle being inspected
const MOCK_VEHICLE = {
  id: "1",
  name: "Toyota Alphard Z-Class",
  plateNumber: "ABC-123",
  imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/04/preview-car-alphard-executive-300x200.jpg",
}

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

interface InspectionPhoto {
  id: string
  url: string
  timestamp: string
  sectionId: string
}

interface VoiceRecording {
  id: string
  url: string
  timestamp: string
  duration: number
  sectionId: string
}

interface SignatureData {
  image: string
  metadata: {
    timestamp: string
    inspector: string
    location?: GeolocationCoordinates
    deviceInfo: {
      userAgent: string
      platform: string
      screenResolution: string
    }
  }
}

export default function NewInspectionPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="outline">
            <Link href="/inspections" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Inspections
            </Link>
          </Button>
        </div>

        <NewInspectionForm />
      </div>
    </PageContainer>
  )
} 