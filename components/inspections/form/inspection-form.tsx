"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InspectionProgress } from "./inspection-progress"
import { CameraModal } from "../camera/camera-modal"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateInspectionStatus, saveInspectionResults } from "@/lib/services/inspections"
import { InspectionItemComponent } from "../inspection-item"
import { Check, X, Camera, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { DbVehicle } from "@/types"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { VehicleSelector } from "@/components/vehicle-selector"

type SectionKey = keyof typeof INSPECTION_SECTIONS
type InspectionItem = {
  id: string
  label: string
  status: 'pass' | 'fail' | null
  photos: string[]
  notes: string
}

type VehicleSide = "front" | "left" | "right" | "rear"
type SectionType = Record<VehicleSide, InspectionItem[]>

const SECTIONS: VehicleSide[] = ["front", "left", "right", "rear"]

const INSPECTION_SECTIONS = {
  "Steering System": [
    { id: "steering-wheel", label: "Steering Wheel", status: null, photos: [], notes: "" },
    { id: "power-steering", label: "Power Steering", status: null, photos: [], notes: "" },
    // Add other steering items
  ],
  "Brake System": [
    { id: "brake-pads", label: "Brake Pads", status: null, photos: [], notes: "" },
    { id: "brake-discs", label: "Brake Discs", status: null, photos: [], notes: "" },
    // Add other brake items
  ],
  "Suspension": [
    { id: "shock-absorbers", label: "Shock Absorbers", status: null, photos: [], notes: "" },
    { id: "springs", label: "Springs", status: null, photos: [], notes: "" },
    // Add other suspension items
  ],
  "Lighting": [
    { id: "headlights", label: "Headlights", status: null, photos: [], notes: "" },
    { id: "tail-lights", label: "Tail Lights", status: null, photos: [], notes: "" },
    // Add other lighting items
  ],
  "Tires": [
    { id: "tread-depth", label: "Tread Depth", status: null, photos: [], notes: "" },
    { id: "tire-pressure", label: "Tire Pressure", status: null, photos: [], notes: "" },
    { id: "tire-wear", label: "Tire Wear Pattern", status: null, photos: [], notes: "" },
    { id: "wheel-alignment", label: "Wheel Alignment", status: null, photos: [], notes: "" },
    { id: "tire-damage", label: "Tire Damage", status: null, photos: [], notes: "" }
  ]
}

const inspectionSchema = z.object({
  vehicle_id: z.string().min(1, "Required"),
})

type InspectionFormData = z.infer<typeof inspectionSchema>

export function InspectionForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentSection, setCurrentSection] = useState<SectionKey>("Steering System")
  const [sections, setSections] = useState<Record<SectionKey, InspectionItem[]>>(INSPECTION_SECTIONS)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      vehicle_id: "",
    },
  })

  const handleStatusChange = (itemId: string, status: "pass" | "fail") => {
    setSections(prev => ({
      ...prev,
      [currentSection]: prev[currentSection].map(item =>
        item.id === itemId ? { ...item, status } : item
      ),
    }))
  }

  const handlePhotoCapture = (photoUrl: string) => {
    if (selectedItemId) {
      setSections(prev => ({
        ...prev,
        [currentSection]: prev[currentSection].map(item =>
          item.id === selectedItemId 
            ? { ...item, photos: [...item.photos, photoUrl] }
            : item
        ),
      }))
    }
    setIsCameraOpen(false)
  }

  const handleNotesChange = (itemId: string, notes: string) => {
    setSections(prev => ({
      ...prev,
      [currentSection]: prev[currentSection].map(item =>
        item.id === itemId ? { ...item, notes } : item
      ),
    }))
  }

  const handleSubmit = async (data: InspectionFormData) => {
    if (!user?.id) return

    try {
      setIsSubmitting(true)

      // Create inspection
      const { data: inspection, error: inspectionError } = await supabase
        .from('inspections')
        .insert([
          {
            vehicle_id: data.vehicle_id,
            inspector_id: user.id,
            status: 'in_progress',
          }
        ])
        .select()
        .single()

      if (inspectionError) throw inspectionError

      // Save inspection items
      const resultsToSave = Object.entries(sections)
        .flatMap(([sectionName, items]) => 
          items
            .filter(item => item.status !== null)
            .map(item => ({
              inspection_id: inspection.id,
              item_id: item.id,
              category: sectionName,
              status: item.status,
              notes: item.notes,
              photos: item.photos
            }))
        )

      const { error: itemsError } = await supabase
        .from('inspection_items')
        .insert(resultsToSave)

      if (itemsError) throw itemsError

      toast({
        title: "Success",
        description: "Inspection created successfully",
      })

      router.push(`/vehicles/${data.vehicle_id}`)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Failed to create inspection",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Vehicle Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="vehicle_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle</FormLabel>
                  <VehicleSelector
                    value={field.value}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Inspection Items */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-6">
              {Object.keys(INSPECTION_SECTIONS).map((section) => (
                <Button
                  key={section}
                  variant={currentSection === section ? "default" : "outline"}
                  onClick={() => setCurrentSection(section as SectionKey)}
                >
                  {section}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              {sections[currentSection].map((item) => (
                <div key={item.id} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "transition-colors",
                          item.status === 'pass' && "bg-green-500 text-white hover:bg-green-600"
                        )}
                        onClick={() => handleStatusChange(item.id, 'pass')}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "transition-colors",
                          item.status === 'fail' && "bg-red-500 text-white hover:bg-red-600"
                        )}
                        onClick={() => handleStatusChange(item.id, 'fail')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedItemId(item.id)
                          setIsCameraOpen(true)
                        }}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {item.photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {item.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  <Textarea
                    placeholder="Add notes..."
                    value={item.notes}
                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Inspection"}
          </Button>
        </div>
      </form>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => {
          setIsCameraOpen(false)
          setSelectedItemId(null)
        }}
        onCapture={handlePhotoCapture}
      />
    </Form>
  )
} 