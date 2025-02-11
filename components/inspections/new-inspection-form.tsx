"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/components/providers/language-provider"
import { PhotoUpload } from "@/components/inspections/photo-upload"
import { VoiceRecorder } from "@/components/inspections/voice-recorder"
import { SignaturePad } from "@/components/inspections/signature-pad"
import { Checkbox } from "@/components/ui/checkbox"
import { InspectionProgress } from "./inspection-progress"
import { cn } from "@/lib/utils"
import { CameraModal } from "@/components/inspections/camera-modal"

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

interface InspectionItem {
  id: string
  description: string
  status?: 'pass' | 'fail'
  photo?: InspectionPhoto
  recording?: VoiceRecording
}

function saveProgress(vehicleId: string, data: {
  items: Record<string, InspectionItem[]>
  photos: InspectionPhoto[]
  recordings: VoiceRecording[]
  signature: SignatureData | null
}) {
  localStorage.setItem(`inspection-progress-${vehicleId}`, JSON.stringify(data))
}

function loadProgress(vehicleId: string) {
  const saved = localStorage.getItem(`inspection-progress-${vehicleId}`)
  return saved ? JSON.parse(saved) : null
}

export function NewInspectionForm() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState("front")
  const [photos, setPhotos] = useState<InspectionPhoto[]>([])
  const [recordings, setRecordings] = useState<VoiceRecording[]>([])
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null)
  const [items, setItems] = useState<Record<string, InspectionItem[]>>(
    Object.entries(INSPECTION_ITEMS).reduce((acc, [section, sectionItems]) => ({
      ...acc,
      [section]: sectionItems.map(item => ({ ...item, status: undefined })),
    }), {})
  )
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [currentItemId, setCurrentItemId] = useState<string | null>(null)

  // Load saved progress on mount
  useEffect(() => {
    const saved = loadProgress(MOCK_VEHICLE.id)
    if (saved) {
      setItems(saved.items)
      setPhotos(saved.photos)
      setRecordings(saved.recordings)
      setSignatureData(saved.signature)
    }
  }, [])

  // Save progress when data changes
  useEffect(() => {
    saveProgress(MOCK_VEHICLE.id, {
      items,
      photos,
      recordings,
      signature: signatureData,
    })
  }, [items, photos, recordings, signatureData])

  const handlePhotoAdd = (photo: InspectionPhoto) => {
    setPhotos((prevPhotos) => [...prevPhotos, photo])
  }

  const handlePhotoRemove = (photoId: string) => {
    setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== photoId))
  }

  const handleRecordingAdd = (recording: VoiceRecording) => {
    setRecordings((prev) => [...prev, recording])
  }

  const handleRecordingRemove = (recordingId: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== recordingId))
  }

  const handleSignatureCapture = (data: SignatureData) => {
    setSignatureData(data)
  }

  const getSectionProgress = (section: string) => {
    const sectionItems = items[section]
    return {
      id: section,
      total: sectionItems.length,
      completed: sectionItems.filter(item => item.status).length,
      failed: sectionItems.filter(item => item.status === 'fail').length,
    }
  }

  const handleItemStatus = (sectionId: string, itemId: string, status: 'pass' | 'fail') => {
    setItems(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].map(item =>
        item.id === itemId ? { ...item, status } : item
      ),
    }))
  }

  // Move validation inside component
  const validateInspection = (data: {
    items: Record<string, InspectionItem[]>
    photos: InspectionPhoto[]
    signature: SignatureData | null
  }) => {
    const allItems = Object.values(data.items).flat()
    const requiredPhotos = 4 // One for each section
    const errors: string[] = []

    // Check if all items are marked
    const unmarkedItems = allItems.filter(item => !item.status)
    if (unmarkedItems.length > 0) {
      errors.push(t("inspections.validation.incompleteItems"))
    }

    // Check for minimum required photos
    if (data.photos.length < requiredPhotos) {
      errors.push(t("inspections.validation.missingPhotos"))
    }

    // Check for signature
    if (!data.signature) {
      errors.push(t("inspections.validation.missingSignature"))
    }

    return errors
  }

  const handleComplete = () => {
    const errors = validateInspection({
      items,
      photos,
      signature: signatureData,
    })

    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    // TODO: Submit inspection
    console.log("Inspection complete", { items, photos, recordings, signatureData })
  }

  const handleCameraClick = (sectionId: string, itemId: string) => {
    setCurrentItemId(itemId)
    setIsCameraOpen(true)
  }

  const handlePhotoCapture = (photoUrl: string) => {
    if (currentItemId && activeTab) {
      const newPhoto: InspectionPhoto = {
        id: crypto.randomUUID(),
        url: photoUrl,
        timestamp: new Date().toISOString(),
        sectionId: activeTab
      }
      handlePhotoAdd(newPhoto)
      
      // Update the item to reference the photo
      setItems(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].map(item =>
          item.id === currentItemId ? { ...item, photo: newPhoto } : item
        ),
      }))
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("inspections.newInspection")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("inspections.vehicleInformation")}: {MOCK_VEHICLE.name}
        </p>
      </div>

      {/* Vehicle Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("inspections.vehicleInformation")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Vehicle Name</p>
                <p className="font-medium">{MOCK_VEHICLE.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plate Number</p>
                <p className="font-medium">{MOCK_VEHICLE.plateNumber}</p>
              </div>
            </div>
            <div className="relative h-48 rounded-lg overflow-hidden">
              <Image
                src={MOCK_VEHICLE.imageUrl}
                alt={MOCK_VEHICLE.name}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Component - Now above the checklist */}
      <InspectionProgress
        sections={Object.keys(items).map(getSectionProgress)}
        currentSection={activeTab}
      />

      {/* Inspection Checklist with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>{t("inspections.inspectionChecklist")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex border-b mb-6">
            {Object.keys(INSPECTION_ITEMS).map((section) => (
              <button
                key={section}
                onClick={() => setActiveTab(section)}
                className={`px-6 py-3 text-sm font-medium capitalize border-b-2 -mb-[2px] transition-colors ${
                  activeTab === section 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                {t(`inspections.sections.${section}`)}
              </button>
            ))}
          </div>

          {Object.entries(items).map(([section, sectionItems]) => (
            <div key={section} className={activeTab === section ? "block" : "hidden"}>
              <div className="space-y-6">
                {sectionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-4 border-b last:border-0 
                      animate-in slide-in-from-left duration-300 ease-in-out hover:bg-muted/50 
                      transition-colors"
                  >
                    <p className="text-base font-medium">
                      {t(`inspections.items.${item.id}`)}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={item.status === 'pass' ? 'default' : 'outline'}
                        className={cn(
                          "w-[90px] transition-all duration-300",
                          item.status === 'pass' && "bg-emerald-600 hover:bg-emerald-700 animate-in zoom-in",
                          "hover:scale-105 active:scale-95"
                        )}
                        onClick={() => handleItemStatus(section, item.id, 'pass')}
                      >
                        {t("inspections.actions.pass")}
                      </Button>
                      <Button
                        size="sm"
                        variant={item.status === 'fail' ? 'destructive' : 'outline'}
                        className={cn(
                          "w-[90px] transition-all duration-300",
                          item.status === 'fail' && "animate-in zoom-in",
                          "hover:scale-105 active:scale-95"
                        )}
                        onClick={() => handleItemStatus(section, item.id, 'fail')}
                      >
                        {t("inspections.actions.fail")}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="transition-transform hover:scale-105 active:scale-95"
                        onClick={() => handleCameraClick(section, item.id)}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <PhotoUpload
                  sectionId={section}
                  onPhotoAdd={handlePhotoAdd}
                  onPhotoRemove={handlePhotoRemove}
                />
                <VoiceRecorder
                  sectionId={section}
                  onRecordingAdd={handleRecordingAdd}
                  onRecordingRemove={handleRecordingRemove}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <SignaturePad 
          onSignatureCapture={handleSignatureCapture}
          inspectorName="John Doe"
        />
        <div className="flex items-center space-x-2">
          <Checkbox id="confirm" required />
          <label htmlFor="confirm" className="text-sm">
            {t("inspections.signature.confirm")}
          </label>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="container max-w-5xl mx-auto">
          {validationErrors.length > 0 && (
            <div className="mb-4 p-4 bg-destructive/10 rounded-lg">
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-destructive">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/inspections">{t("common.cancel")}</Link>
            </Button>
            <Button 
              className="w-[200px]"
              onClick={handleComplete}
            >
              {t("inspections.completeInspection")}
            </Button>
          </div>
        </div>
      </div>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCapture}
      />
    </div>
  )
} 