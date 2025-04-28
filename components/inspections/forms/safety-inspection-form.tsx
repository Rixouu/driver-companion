"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CameraModal } from "@/components/inspections/camera-modal"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { useI18n } from "@/lib/i18n/context"
import { Check, X, Camera, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils/styles"
import { getInspectionTemplates } from "@/lib/services/inspections"
import type { InspectionCategory, InspectionItemTemplate } from "@/lib/types/inspections"

interface SafetyInspectionFormProps {
  onSectionComplete: (sectionId: string, status: 'pass' | 'fail') => void
  onPhotoAdd: (sectionId: string, itemId: string, photoUrl: string) => void
  onNotesChange: (sectionId: string, itemId: string, notes: string) => void
}

interface SectionWithItems extends InspectionCategory {
  items: (InspectionItemTemplate & {
    status: 'pass' | 'fail' | null
    notes: string
    photos: string[]
  })[]
}

const SAFETY_SECTIONS = [
  {
    id: 'brake_safety',
    items: [
      { id: 'emergency_brake', status: null, notes: '', photos: [], requires_photo: true, requires_notes: true },
      { id: 'brake_lines', status: null, notes: '', photos: [], requires_photo: true, requires_notes: true },
      { id: 'abs_system', status: null, notes: '', photos: [], requires_photo: true, requires_notes: true },
    ]
  },
  {
    id: 'restraint_systems',
    items: [
      { id: 'seatbelt_condition', status: null, notes: '', photos: [], requires_photo: true, requires_notes: true },
      { id: 'airbag_indicators', status: null, notes: '', photos: [], requires_photo: true, requires_notes: true },
      { id: 'child_locks', status: null, notes: '', photos: [], requires_photo: true, requires_notes: true },
    ]
  },
  {
    id: 'visibility',
    items: [
      { id: 'windshield_condition', status: null, notes: '', photos: [], requires_photo: true, requires_notes: true },
      { id: 'mirror_condition', status: null, notes: '', photos: [], requires_photo: true, requires_notes: true },
      { id: 'window_operation', status: null, notes: '', photos: [], requires_photo: true, requires_notes: true },
    ]
  }
]

// New safety inspection form
export function SafetyInspectionForm({ onSectionComplete, onPhotoAdd, onNotesChange }: SafetyInspectionFormProps) {
  const { t } = useI18n()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [currentPhotoItem, setCurrentPhotoItem] = useState<{
    sectionId: string;
    itemId: string;
  } | null>(null)
  const [sections, setSections] = useState<SectionWithItems[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadTemplates() {
      try {
        const categories = await getInspectionTemplates('safety')
        setSections(categories.map(category => ({
          ...category,
          items: category.inspection_item_templates.map(item => ({
            ...item,
            status: null,
            notes: '',
            photos: []
          }))
        })))
      } catch (error) {
        console.error('Error loading templates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplates()
  }, [])

  const handlePhotoCapture = (photoUrl: string) => {
    if (currentPhotoItem) {
      onPhotoAdd(currentPhotoItem.sectionId, currentPhotoItem.itemId, photoUrl)
    }
  }

  if (isLoading) {
    return <div>{t('common.loading')}</div>
  }

  return (
    <div className="space-y-6">
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
              <h3 className="text-lg font-medium">
                {t(`inspections.categories.${section.name.toLowerCase().replace(/\s+/g, '_')}.title`)}
              </h3>
              <div className="flex items-center gap-2">
                <Progress
                  value={
                    (section.items.filter(i => i.status).length / section.items.length) * 100
                  }
                  className="w-24 h-1"
                />
                <span className="text-sm text-muted-foreground">
                  {`${section.items.filter(i => i.status).length}/${section.items.length}`}
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
                  <h4 className="font-medium">
                    {t(`inspections.items.${item.name.toLowerCase().replace(/\s+/g, '_')}`)}
                  </h4>

                  <div className="flex gap-2">
                    <Button
                      variant={item.status === 'pass' ? 'default' : 'outline'}
                      className={cn(
                        "flex-1",
                        item.status === 'pass' && "bg-green-500 hover:bg-green-600"
                      )}
                      onClick={() => onSectionComplete(section.id, 'pass')}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {t('inspections.actions.pass')}
                    </Button>
                    <Button
                      variant={item.status === 'fail' ? 'destructive' : 'outline'}
                      className="flex-1"
                      onClick={() => onSectionComplete(section.id, 'fail')}
                    >
                      <X className="mr-2 h-4 w-4" />
                      {t('inspections.actions.fail')}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setCurrentPhotoItem({ sectionId: section.id, itemId: item.id })
                        setIsCameraOpen(true)
                      }}
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
                    placeholder={t('inspections.fields.notesPlaceholder')}
                    value={item.notes}
                    onChange={(e) => onNotesChange(section.id, item.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => {
          setIsCameraOpen(false)
          setCurrentPhotoItem(null)
        }}
        onCapture={handlePhotoCapture}
      />
    </div>
  );
} 