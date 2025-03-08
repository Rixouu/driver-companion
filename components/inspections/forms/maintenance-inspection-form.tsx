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

interface MaintenanceInspectionFormProps {
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

// New maintenance inspection form
export function MaintenanceInspectionForm({ onSectionComplete, onPhotoAdd, onNotesChange }: MaintenanceInspectionFormProps) {
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
        const categories = await getInspectionTemplates('maintenance')
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('inspections.templates.maintenance.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Maintenance inspection form content */}
      </CardContent>
    </Card>
  )
} 