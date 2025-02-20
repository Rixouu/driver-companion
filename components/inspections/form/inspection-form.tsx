"use client"

import { useState, useEffect } from "react"
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

const INSPECTION_SECTIONS: Record<string, InspectionItem[]> = {
  "Steering": [
    { id: "steering-wheel", label: "Steering Wheel", status: null, photos: [], notes: "" },
    { id: "power-steering", label: "Power Steering", status: null, photos: [], notes: "" },
    // Add other steering items
  ],
  "Brake": [
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

interface InspectionFormProps {
  inspectionId?: string
  vehicle?: DbVehicle
}

export function InspectionForm({ inspectionId, vehicle }: InspectionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentSection, setCurrentSection] = useState<SectionKey>("Steering")
  const [sections, setSections] = useState<Record<SectionKey, InspectionItem[]>>(INSPECTION_SECTIONS)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      vehicle_id: vehicle?.id || "",
    },
  })

  useEffect(() => {
    async function loadInspectionItems() {
      if (!inspectionId) return

      try {
        const { data: items, error } = await supabase
          .from('inspection_items')
          .select('*')
          .eq('inspection_id', inspectionId)

        if (error) throw error

        if (items?.length) {
          // Update sections with existing items
          const updatedSections = { ...INSPECTION_SECTIONS }
          items.forEach(item => {
            const section = Object.keys(updatedSections).find(
              key => key === item.category
            )
            if (section) {
              const sectionItemIndex = updatedSections[section].findIndex(
                sectionItem => sectionItem.label === item.item
              )
              if (sectionItemIndex !== -1) {
                updatedSections[section][sectionItemIndex] = {
                  ...updatedSections[section][sectionItemIndex],
                  status: item.status as 'pass' | 'fail',
                  notes: item.notes || '',
                }
              }
            }
          })
          setSections(updatedSections)
        }
      } catch (error) {
        console.error('Error loading inspection items:', error)
        toast({
          title: "Error",
          description: "Failed to load inspection items",
          variant: "destructive",
        })
      }
    }

    loadInspectionItems()
  }, [inspectionId])

  const handleStatusChange = async (itemId: string, status: "pass" | "fail") => {
    if (!user?.id) return

    try {
      // Update local state
      setSections(prev => ({
        ...prev,
        [currentSection]: prev[currentSection].map(item =>
          item.id === itemId ? { ...item, status } : item
        ),
      }))

      // Save progress if we have an inspectionId
      if (inspectionId) {
        const item = sections[currentSection].find(i => i.id === itemId)
        if (!item) return

        // Save or update the inspection item
        const { error } = await supabase
          .from('inspection_items')
          .upsert({
            inspection_id: inspectionId,
            category: currentSection,
            item: item.label,
            status,
            notes: item.notes || null,
            user_id: user.id
          })

        if (error) throw error

        // Update inspection status to in_progress if it was scheduled
        await supabase
          .from('inspections')
          .update({ status: 'in_progress' })
          .eq('id', inspectionId)
          .eq('status', 'scheduled')
      }
    } catch (error) {
      console.error('Error saving inspection item:', error)
      toast({
        title: "Error",
        description: "Failed to save inspection item",
        variant: "destructive",
      })
    }
  }

  const handlePhotoCapture = (photoUrl: string) => {
    if (!selectedItemId) return

    setSections(prev => ({
      ...prev,
      [currentSection]: prev[currentSection].map(item =>
        item.id === selectedItemId
          ? {
              ...item,
              photos: [...(item.photos || []), photoUrl]
            }
          : item
      ),
    }))

    setIsCameraOpen(false)
    setSelectedItemId(null)
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

      // Collect all inspection items that have been checked
      const inspectionItems = Object.entries(sections)
        .flatMap(([sectionName, items]) => 
          items
            .filter(item => item.status !== null)
            .map(item => ({
              category: sectionName,
              item: item.label,
              status: item.status,
              notes: item.notes || null
            }))
        )

      // Check if any items have been checked
      if (inspectionItems.length === 0) {
        toast({
          title: "Error",
          description: "Please complete at least one inspection item",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Create the inspection
      const { data: inspection, error: inspectionError } = await supabase
        .from('inspections')
        .insert([
          {
            vehicle_id: data.vehicle_id,
            inspector_id: user.id,
            status: 'completed',
            date: new Date().toISOString(),
            schedule_type: 'routine',
            due_date: new Date().toISOString(),
          }
        ])
        .select()
        .single()

      if (inspectionError) throw inspectionError

      // Save all inspection items
      const { error: itemsError } = await supabase
        .from('inspection_items')
        .insert(
          inspectionItems.map(item => ({
            inspection_id: inspection.id,
            ...item,
            user_id: user.id
          }))
        )

      if (itemsError) throw itemsError

      toast({
        title: "Success",
        description: "Inspection created successfully",
      })

      router.push(`/inspections/${inspection.id}`)
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Inspection Items</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Check and record inspection results
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={currentSection} onValueChange={(value) => setCurrentSection(value as SectionKey)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(sections).map((section) => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sections[currentSection].map((item) => (
              <div key={item.id} className="rounded-lg border p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <span className="font-medium flex-1">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex-1 sm:flex-none transition-colors",
                        item.status === 'pass' && "bg-green-500 text-white hover:bg-green-600"
                      )}
                      onClick={() => handleStatusChange(item.id, 'pass')}
                    >
                      <Check className="h-4 w-4" />
                      <span className="ml-2 sm:hidden">Pass</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex-1 sm:flex-none transition-colors",
                        item.status === 'fail' && "bg-red-500 text-white hover:bg-red-600"
                      )}
                      onClick={() => handleStatusChange(item.id, 'fail')}
                    >
                      <X className="h-4 w-4" />
                      <span className="ml-2 sm:hidden">Fail</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      onClick={() => {
                        setSelectedItemId(item.id)
                        setIsCameraOpen(true)
                      }}
                    >
                      <Camera className="h-4 w-4" />
                      <span className="ml-2 sm:hidden">Photo</span>
                    </Button>
                  </div>
                </div>

                {item.photos?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                  className="min-h-[80px]"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row gap-4 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button 
          onClick={() => handleSubmit(form.getValues())}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "Saving..." : "Complete Inspection"}
        </Button>
      </div>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => {
          setIsCameraOpen(false)
          setSelectedItemId(null)
        }}
        onCapture={handlePhotoCapture}
      />
    </div>
  )
} 