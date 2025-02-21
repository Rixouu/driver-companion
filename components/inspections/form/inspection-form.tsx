"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InspectionProgress } from "./inspection-progress"
import { CameraModal } from "@/components/inspections/camera/camera-modal"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateInspectionStatus, saveInspectionResults } from "@/lib/services/inspections"
import { InspectionItemComponent } from "../inspection-item"
import { Check, X, Camera, Calendar, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
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
import { Progress } from "@/components/ui/progress"

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

interface InspectionSection {
  id: string
  title: string
  items: {
    id: string
    title: string
    status: null | 'pass' | 'fail'
    notes: string
    photos: string[]
  }[]
}

const INSPECTION_SECTIONS: InspectionSection[] = [
  {
    id: 'steering',
    title: 'Steering',
    items: [
      { id: 'wheel', title: 'Steering Wheel', status: null, notes: '', photos: [] },
      { id: 'power', title: 'Power Steering', status: null, notes: '', photos: [] },
      { id: 'column', title: 'Steering Column', status: null, notes: '', photos: [] },
    ]
  },
  {
    id: 'brake',
    title: 'Brake',
    items: [
      { id: 'pedal', title: 'Brake Pedal', status: null, notes: '', photos: [] },
      { id: 'disc', title: 'Brake Discs', status: null, notes: '', photos: [] },
      { id: 'fluid', title: 'Brake Fluid', status: null, notes: '', photos: [] },
    ]
  },
  {
    id: 'suspension',
    title: 'Suspension',
    items: [
      { id: 'shocks', title: 'Shock Absorbers', status: null, notes: '', photos: [] },
      { id: 'springs', title: 'Springs', status: null, notes: '', photos: [] },
      { id: 'bushings', title: 'Bushings', status: null, notes: '', photos: [] },
    ]
  },
  {
    id: 'lighting',
    title: 'Lighting',
    items: [
      { id: 'headlights', title: 'Headlights', status: null, notes: '', photos: [] },
      { id: 'taillights', title: 'Taillights', status: null, notes: '', photos: [] },
      { id: 'indicators', title: 'Turn Indicators', status: null, notes: '', photos: [] },
    ]
  },
  {
    id: 'tires',
    title: 'Tires',
    items: [
      { id: 'pressure', title: 'Tire Pressure', status: null, notes: '', photos: [] },
      { id: 'tread', title: 'Tread Depth', status: null, notes: '', photos: [] },
      { id: 'wear', title: 'Wear Pattern', status: null, notes: '', photos: [] },
    ]
  },
  {
    id: 'engine',
    title: 'Engine',
    items: [
      { id: 'oil', title: 'Oil Level', status: null, notes: '', photos: [] },
      { id: 'coolant', title: 'Coolant Level', status: null, notes: '', photos: [] },
      { id: 'belts', title: 'Drive Belts', status: null, notes: '', photos: [] },
      { id: 'leaks', title: 'Fluid Leaks', status: null, notes: '', photos: [] },
    ]
  },
  {
    id: 'transmission',
    title: 'Transmission',
    items: [
      { id: 'fluid', title: 'Transmission Fluid', status: null, notes: '', photos: [] },
      { id: 'shifting', title: 'Shifting Operation', status: null, notes: '', photos: [] },
      { id: 'clutch', title: 'Clutch Operation', status: null, notes: '', photos: [] },
    ]
  },
  {
    id: 'electrical',
    title: 'Electrical',
    items: [
      { id: 'battery', title: 'Battery', status: null, notes: '', photos: [] },
      { id: 'alternator', title: 'Alternator', status: null, notes: '', photos: [] },
      { id: 'starter', title: 'Starter', status: null, notes: '', photos: [] },
    ]
  },
  {
    id: 'safety',
    title: 'Safety Equipment',
    items: [
      { id: 'seatbelts', title: 'Seatbelts', status: null, notes: '', photos: [] },
      { id: 'airbags', title: 'Airbag System', status: null, notes: '', photos: [] },
      { id: 'wipers', title: 'Windshield Wipers', status: null, notes: '', photos: [] },
    ]
  }
]

const inspectionSchema = z.object({
  vehicle_id: z.string().min(1, "Required"),
})

type InspectionFormData = z.infer<typeof inspectionSchema>

interface InspectionFormProps {
  inspectionId?: string
  vehicle?: DbVehicle
}

interface InspectionCategory {
  id: string;
  name: string;
}

// Map our section IDs to the actual UUIDs from the database
const CATEGORY_IDS = {
  steering: '63a30ec2-c4da-40ea-a408-da98b6e4fde',
  brake: '49884798-34d3-4576-a771-bae768eff1f3',
  suspension: '44ff8e2e-1773-49d9-b93c-a3128b760443',
  lighting: 'effb87ad-2917-4207-a51a-6889f4d4eeb7',
  tires: '5e18c77d-b822-4ba5-b45c-482635bd46d'
}

export function InspectionForm({ inspectionId, vehicle }: InspectionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [sections, setSections] = useState(INSPECTION_SECTIONS)
  const [activeSection, setActiveSection] = useState<string | null>('steering')
  const [activeItem, setActiveItem] = useState<string | null>('wheel')
  const [selectedVehicle, setSelectedVehicle] = useState<string | undefined>(undefined)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [currentPhotoItem, setCurrentPhotoItem] = useState<{
    sectionId: string;
    itemId: string;
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const [categories, setCategories] = useState<Record<string, string>>({})

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
          const updatedSections = INSPECTION_SECTIONS.map(section => ({
            ...section,
            items: section.items.map(item => ({
              ...item,
              status: items.find(i => i.item === item.title)?.status as 'pass' | 'fail' || null,
              notes: items.find(i => i.item === item.title)?.notes || '',
            }))
          }))
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

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('inspection_categories')
        .select('id, name')

      if (error) {
        console.error('Error fetching categories:', error)
        return
      }

      // Create a mapping of category name to ID
      const categoryMap = data.reduce((acc: Record<string, string>, cat) => {
        acc[cat.name.toLowerCase()] = cat.id
        return acc
      }, {})

      setCategories(categoryMap)
    }

    fetchCategories()
  }, [])

  const handleItemStatus = (sectionId: string, itemId: string, status: 'pass' | 'fail') => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map(item => {
            if (item.id === itemId) {
              return { ...item, status }
            }
            return item
          })
        }
      }
      return section
    }))

    // Auto-advance to next item
    const currentSection = sections.find(s => s.id === sectionId)
    if (currentSection) {
      const currentItemIndex = currentSection.items.findIndex(i => i.id === itemId)
      if (currentItemIndex < currentSection.items.length - 1) {
        // Next item in same section
        setActiveItem(currentSection.items[currentItemIndex + 1].id)
      } else {
        // Move to next section
        const currentSectionIndex = sections.findIndex(s => s.id === sectionId)
        if (currentSectionIndex < sections.length - 1) {
          const nextSection = sections[currentSectionIndex + 1]
          setActiveSection(nextSection.id)
          setActiveItem(nextSection.items[0].id)
        }
      }
    }
  }

  const handlePhotoCapture = (photoUrl: string) => {
    if (!currentPhotoItem) return

    setSections(prev => prev.map(section => {
      if (section.id === currentPhotoItem.sectionId) {
        return {
          ...section,
          items: section.items.map(item => {
            if (item.id === currentPhotoItem.itemId) {
              return {
                ...item,
                photos: [...item.photos, photoUrl]
              }
            }
            return item
          })
        }
      }
      return section
    }))

    setIsCameraOpen(false)
    setCurrentPhotoItem(null)
  }

  const handleCameraClick = (sectionId: string, itemId: string) => {
    setCurrentPhotoItem({ sectionId, itemId })
    setIsCameraOpen(true)
  }

  const handleNotesChange = (sectionId: string, itemId: string, notes: string) => {
    setSections(prev => prev.map(section => ({
      ...section,
      items: section.items.map(item =>
        item.id === itemId ? { ...item, notes } : item
      )
    })))
  }

  const handleSubmit = async () => {
    try {
      if (!selectedVehicle || !user?.id) {
        toast({
          title: "Error",
          description: "Please select a vehicle and ensure you're logged in",
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)

      // Create the inspection with only the fields we know exist
      const { data: inspection, error: inspectionError } = await supabase
        .from('inspections')
        .insert({
          vehicle_id: selectedVehicle,
          status: 'completed',
          inspector_id: user.id,
          date: new Date().toISOString(),
          type: 'routine'
        })
        .select()
        .single()

      if (inspectionError) {
        console.error('Error creating inspection:', inspectionError)
        throw inspectionError
      }

      console.log('Created inspection:', inspection)

      // Get all categories
      const { data: categories, error: categoriesError } = await supabase
        .from('inspection_categories')
        .select('id, name')

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError)
        throw categoriesError
      }

      console.log('Fetched categories:', categories)

      // Create a map of category names to IDs
      const categoryMap = categories?.reduce((acc: Record<string, string>, cat) => {
        acc[cat.name.toLowerCase()] = cat.id
        return acc
      }, {}) || {}

      console.log('Category map:', categoryMap)
      console.log('Sections to process:', sections)

      // Create inspection items
      const inspectionItems = sections.flatMap(section => {
        const categoryId = categoryMap[section.title.toLowerCase()]
        console.log(`Processing section ${section.title}, category ID: ${categoryId}`)

        return section.items
          .filter(item => item.status !== null)
          .map(item => {
            const itemData = {
              inspection_id: inspection.id,
              category: section.title,
              item: item.title,
              status: item.status,
              notes: item.notes || null,
              user_id: user.id,
              category_id: categoryId,
              order_number: 1,
              created_at: new Date().toISOString()
            }
            console.log('Created item:', itemData)
            return itemData
          })
      })

      console.log('Inspection items to insert:', inspectionItems)

      if (inspectionItems.length === 0) {
        toast({
          title: "Error",
          description: "No inspection items to save",
          variant: "destructive",
        })
        return
      }

      const { error: itemsError } = await supabase
        .from('inspection_items')
        .insert(inspectionItems)

      if (itemsError) {
        console.error('Error inserting items:', itemsError)
        throw itemsError
      }

      // Add a longer delay and force a hard navigation
      await new Promise(resolve => setTimeout(resolve, 1500))

      toast({
        title: "Success",
        description: "Inspection completed successfully",
      })

      // Use window.location for a hard refresh
      window.location.href = '/inspections'
    } catch (error) {
      console.error('Error submitting inspection:', error)
      toast({
        title: "Error",
        description: "Failed to submit inspection. Please check the console for details.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSectionProgress = (section: InspectionSection) => {
    const completed = section.items.filter(item => item.status).length
    return `${completed}/${section.items.length}`
  }

  const getOverallProgress = () => {
    const total = sections.reduce((acc, section) => acc + section.items.length, 0)
    const completed = sections.reduce((acc, section) => 
      acc + section.items.filter(item => item.status).length, 0
    )
    return Math.round((completed / total) * 100)
  }

  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicle(vehicleId)
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h2 className="text-lg font-medium mb-4">Select Vehicle</h2>
        <VehicleSelector
          value={selectedVehicle}
          onValueChange={handleVehicleChange}
        />
      </Card>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Overall Progress</h2>
        <Progress value={getOverallProgress()} className="h-2" />
        <p className="text-sm text-muted-foreground text-right">{getOverallProgress()}%</p>
      </div>

      <div className="space-y-4">
        {sections.map(section => (
          <Card 
            key={section.id}
            className={cn(
              "p-4 transition-colors",
              activeSection === section.id ? "bg-card" : "bg-muted/50"
            )}
          >
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setActiveSection(
                activeSection === section.id ? null : section.id
              )}
            >
              <div className="space-y-1">
                <h3 className="text-lg font-medium">{section.title}</h3>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={
                      (section.items.filter(i => i.status).length / section.items.length) * 100
                    } 
                    className="w-24 h-1"
                  />
                  <span className="text-sm text-muted-foreground">
                    {getSectionProgress(section)}
                  </span>
                </div>
              </div>
              {activeSection === section.id ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {activeSection === section.id && (
              <div className="mt-4 space-y-4">
                {section.items.map(item => (
                  <div 
                    key={item.id}
                    className={cn(
                      "space-y-4 rounded-lg p-4",
                      activeItem === item.id ? "bg-muted" : "bg-transparent"
                    )}
                  >
                    <h4 className="font-medium">{item.title}</h4>
                    
                    <div className="flex gap-2">
                      <Button
                        variant={item.status === 'pass' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => handleItemStatus(section.id, item.id, 'pass')}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Pass
                      </Button>
                      <Button
                        variant={item.status === 'fail' ? 'destructive' : 'outline'}
                        className="flex-1"
                        onClick={() => handleItemStatus(section.id, item.id, 'fail')}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Fail
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleCameraClick(section.id, item.id)}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>

                    {item.photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {item.photos.map((photo, index) => (
                          <div key={index} className="relative aspect-square">
                            <img
                              src={photo}
                              alt={`Photo ${index + 1}`}
                              className="rounded-lg object-cover w-full h-full"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <Textarea 
                      placeholder="Add notes..."
                      value={item.notes}
                      onChange={(e) => handleNotesChange(section.id, item.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="sticky bottom-0 bg-background p-4 border-t">
        <Button 
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedVehicle}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing Inspection...
            </>
          ) : (
            'Complete Inspection'
          )}
        </Button>
      </div>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => {
          setIsCameraOpen(false)
          setCurrentPhotoItem(null)
        }}
        onCapture={handlePhotoCapture}
      />
    </div>
  )
} 