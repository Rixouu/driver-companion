"use client"

import { useState, useEffect } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CameraModal } from "@/components/inspections/camera-modal"
import { useRouter } from "next/navigation"
import { toast, useToast } from "@/components/ui/use-toast"
import { Check, X, Camera, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { InspectionType } from "@/lib/types/inspections"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form"
import { VehicleSelector } from "@/components/vehicle-selector"
import { InspectionTypeSelector } from "./inspection-type-selector"
import { useTranslations } from 'next-intl'

interface InspectionFormProps {
  inspectionId?: string
  type?: InspectionType
  vehicleId?: string
}

interface InspectionItem {
  id: string
  title: string
  description: string
  status: 'pass' | 'fail' | null
  photos: string[]
  notes?: string
}

interface InspectionSection {
  id: string
  title: string
  description: string
  items: InspectionItem[]
}

const inspectionFormSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  type: z.enum(["routine", "safety", "maintenance"]),
  notes: z.string().optional(),
  items: z.record(z.array(z.object({
    id: z.string(),
    label: z.string(),
    status: z.enum(["pass", "fail", "null"]),
    photos: z.array(z.string()),
    notes: z.string().optional()
  }))),
  location: z.tuple([z.number(), z.number()]).optional()
})

type InspectionFormData = z.infer<typeof inspectionFormSchema>

export function InspectionForm({ inspectionId, type = 'routine', vehicleId }: InspectionFormProps) {
  const t = useTranslations()
  const [sections, setSections] = useState<InspectionSection[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [currentPhotoItem, setCurrentPhotoItem] = useState<{ sectionId: string; itemId: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notes, setNotes] = useState('')
  const [selectedType, setSelectedType] = useState<InspectionType>(type)
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(vehicleId || null)

  const methods = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: {
      vehicleId: vehicleId || '',
      type: type || 'routine',
      notes: '',
      items: {},
    },
  })

  const getOverallProgress = () => {
    if (!sections.length) return 0
    const completedItems = sections.reduce((acc, section) => 
      acc + section.items.filter(i => i.status !== null).length, 0)
    const totalItems = sections.reduce((acc, section) => 
      acc + section.items.length, 0)
    return Math.round((completedItems / totalItems) * 100)
  }

  const getSectionProgress = (section: InspectionSection) => {
    const completed = section.items.filter(i => i.status !== null).length
    return `${completed}/${section.items.length}`
  }

  const handleVehicleChange = (value: string) => {
    setSelectedVehicle(value)
  }

  const handlePhotoCapture = async (photoData: string) => {
    if (!currentPhotoItem) return
    
    const { sectionId, itemId } = currentPhotoItem
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? {
                      ...item,
                      photos: [...item.photos, photoData]
                    }
                  : item
              )
            }
          : section
      )
    )
    setIsCameraOpen(false)
    setCurrentPhotoItem(null)
  }

  const handlePhotoDelete = (sectionId: string, itemId: string, photoIndex: number) => {
    setSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? {
                      ...item,
                      photos: item.photos.filter((_, idx) => idx !== photoIndex)
                    }
                  : item
              )
            }
          : section
      )
    )
    toast({
      title: t('common.success'),
      description: t('inspections.messages.photoDeleted'),
    })
  }

  const handleSubmit = async () => {
    try {
      // Your existing submit logic
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: t('inspections.messages.error'),
        variant: "destructive",
      })
    }
  }

  const onSubmit = methods.handleSubmit(async () => {
    try {
      setIsSubmitting(true)
      await handleSubmit()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: t('inspections.messages.error'),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <div className="relative">
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('inspections.type.select')}</CardTitle>
            </CardHeader>
            <CardContent>
              <InspectionTypeSelector
                control={methods.control}
                onTypeChange={setSelectedType}
                defaultValue={type}
              />
            </CardContent>
          </Card>

          <Card className="p-4">
            <h2 className="text-lg font-medium mb-4">{t('inspections.fields.vehicle')}</h2>
            <FormField
              control={methods.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <VehicleSelector
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        handleVehicleChange(value)
                      }}
                      placeholder={t('inspections.fields.vehicleDescription')}
                      disabled={!!vehicleId}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          {/* Progress section */}
          <div className="space-y-2">
            <h2 className="text-lg font-medium">{t('inspections.details.inspectionProgress')}</h2>
            <Progress value={getOverallProgress()} className="h-2" />
            <p className="text-sm text-muted-foreground text-right">{getOverallProgress()}%</p>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((section) => (
              <Card key={section.id} className={cn("p-4 transition-colors", activeSection === section.id ? "bg-card" : "bg-muted/50")}>
                <button
                  type="button"
                  className="flex items-center justify-between w-full"
                  onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                >
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">{section.title}</h3>
                    <div className="flex items-center gap-2">
                      <Progress value={(section.items.filter(i => i.status !== null).length / section.items.length) * 100} className="w-24 h-1" />
                      <span className="text-sm text-muted-foreground">{getSectionProgress(section)}</span>
                    </div>
                  </div>
                  {activeSection === section.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                {activeSection === section.id && (
                  <div className="mt-4 space-y-4">
                    {section.items.map((item) => (
                      <div key={item.id} className={cn("space-y-4 rounded-lg p-4", activeItem === item.id ? "bg-muted" : "bg-transparent")}>
                        {/* Item content */}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Notes */}
          <Card className="p-4">
            <h2 className="text-lg font-medium mb-4">{t('inspections.fields.notes')}</h2>
            <FormField
              control={methods.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('inspections.fields.generalNotesPlaceholder')}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </Card>

          <div className="sticky bottom-0 p-4 bg-background border-t">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !selectedVehicle}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                t('inspections.actions.complete')
              )}
            </Button>
          </div>
        </form>
      </FormProvider>

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