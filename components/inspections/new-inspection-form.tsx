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
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { offlineStorage } from "@/lib/offline-storage"

// Mock data for the vehicle being inspected
const MOCK_VEHICLE = {
  id: "1",
  name: "Toyota Alphard Z-Class",
  plateNumber: "ABC-123",
  imageUrl: "https://staging.japandriver.com/wp-content/uploads/2024/04/preview-car-alphard-executive-300x200.jpg",
}

interface InspectionItem {
  id: string
  label: string
  status: "pass" | "fail" | null
  photos: string[]
  notes: string
}

type VehicleSide = "front" | "left" | "right" | "rear"

// Changed to use arrays instead of objects
const initialSections: Record<VehicleSide, InspectionItem[]> = {
  front: [
    { id: "headlights", label: "Headlights", status: null, photos: [], notes: "" },
    { id: "signals", label: "Turn Signals", status: null, photos: [], notes: "" },
    { id: "bumper", label: "Front Bumper", status: null, photos: [], notes: "" },
    { id: "hood", label: "Hood", status: null, photos: [], notes: "" },
    { id: "windshield", label: "Windshield", status: null, photos: [], notes: "" },
  ],
  left: [
    { id: "mirror", label: "Side Mirror", status: null, photos: [], notes: "" },
    { id: "tires", label: "Tires", status: null, photos: [], notes: "" },
    { id: "body", label: "Body Panels", status: null, photos: [], notes: "" },
  ],
  right: [
    { id: "mirror", label: "Side Mirror", status: null, photos: [], notes: "" },
    { id: "tires", label: "Tires", status: null, photos: [], notes: "" },
    { id: "body", label: "Body Panels", status: null, photos: [], notes: "" },
  ],
  rear: [
    { id: "taillights", label: "Taillights", status: null, photos: [], notes: "" },
    { id: "bumper", label: "Rear Bumper", status: null, photos: [], notes: "" },
    { id: "trunk", label: "Trunk/Cargo Door", status: null, photos: [], notes: "" },
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

function loadProgress(vehicleId: string) {
  const saved = localStorage.getItem(`inspection-progress-${vehicleId}`)
  return saved ? JSON.parse(saved) : null
}

export function NewInspectionForm() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const [sections, setSections] = useState<Record<VehicleSide, InspectionItem[]>>(initialSections)
  const [currentSection, setCurrentSection] = useState<VehicleSide>("front")
  const [photos, setPhotos] = useState<string[]>([])
  const [recordings, setRecordings] = useState<string[]>([])
  const [signatureData, setSignatureData] = useState<SignatureData | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<string | null>(null)

  // Load saved progress on mount
  useEffect(() => {
    const saved = loadProgress(MOCK_VEHICLE.id)
    if (saved) {
      setSections(saved.items)
      setPhotos(saved.photos)
      setRecordings(saved.recordings)
      setSignatureData(saved.signature)
    }
  }, [])

  // Save progress when data changes
  useEffect(() => {
    const saveData = async () => {
      await offlineStorage.saveProgress(MOCK_VEHICLE.id, {
        items: sections,
        photos,
        recordings,
        timestamp: new Date().toISOString()
      })
    }
    saveData()
  }, [sections, photos, recordings])

  const handleStatusChange = (itemId: string, status: "pass" | "fail") => {
    setSections(prev => ({
      ...prev,
      [currentSection]: prev[currentSection].map(item =>
        item.id === itemId ? { ...item, status } : item
      ),
    }))
  }

  const handlePhotoCapture = (photoUrl: string) => {
    if (currentItem) {
      setSections(prev => ({
        ...prev,
        [currentSection]: prev[currentSection].map(item =>
          item.id === currentItem
            ? { ...item, photos: [...item.photos, photoUrl] }
            : item
        ),
      }))
      setPhotos(prev => [...prev, photoUrl])
    }
    setIsCameraOpen(false)
  }

  const getSectionProgress = (section: string) => {
    const sectionItems = Object.values(sections[section as VehicleSide])
    return {
      id: section,
      total: sectionItems.length,
      completed: sectionItems.filter(item => item.status).length,
      failed: sectionItems.filter(item => item.status === 'fail').length,
    }
  }

  // Move validation inside component
  const validateInspection = (data: {
    items: Record<string, InspectionItem[]>
    photos: string[]
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
      items: sections,
      photos,
      signature: signatureData,
    })

    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    // TODO: Submit inspection
    console.log("Inspection complete", { items: sections, photos, recordings, signatureData })
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
        sections={Object.keys(sections).map(getSectionProgress)}
        currentSection={currentSection}
      />

      {/* Inspection Checklist with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>{t("inspections.inspectionChecklist")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex border-b mb-6">
            {Object.keys(sections).map((section) => (
              <button
                key={section}
                onClick={() => setCurrentSection(section as VehicleSide)}
                className={`px-6 py-3 text-sm font-medium capitalize border-b-2 -mb-[2px] transition-colors ${
                  currentSection === section 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                {t(`inspections.sections.${section}`)}
              </button>
            ))}
          </div>

          {sections[currentSection as VehicleSide].map((item) => (
            <div key={item.id} className={currentSection === item.id ? "block" : "hidden"}>
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <Label className="text-base">{item.label}</Label>
                  <RadioGroup
                    value={item.status || ""}
                    onValueChange={(value) => handleStatusChange(item.id, value as "pass" | "fail")}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pass" id={`${item.id}-pass`} />
                      <Label htmlFor={`${item.id}-pass`}>{t("inspections.results.pass")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fail" id={`${item.id}-fail`} />
                      <Label htmlFor={`${item.id}-fail`}>{t("inspections.results.fail")}</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCurrentItem(item.id)
                      setIsCameraOpen(true)
                    }}
                  >
                    {t("inspections.photos.takePhoto")}
                  </Button>
                </div>

                {item.photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {item.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`${item.label} photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <SignaturePad 
          onSignatureCapture={setSignatureData}
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

      {isCameraOpen && (
        <CameraModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handlePhotoCapture}
        />
      )}
    </div>
  )
} 