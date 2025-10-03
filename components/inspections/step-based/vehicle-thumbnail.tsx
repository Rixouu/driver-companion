"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { format } from "date-fns"
import Image from "next/image"

interface Vehicle {
  id: string
  name: string
  plate_number: string
  brand?: string
  model?: string
  image_url?: string | null
  year?: string
}

interface InspectionSection {
  id: string
  title: string
  description?: string
}

interface VehicleThumbnailProps {
  selectedVehicle: Vehicle | null
  sections: InspectionSection[]
  currentSectionIndex: number
  currentStepIndex: number
  isBackdatingEnabled: boolean
  inspectionDate: Date | undefined
  progress: number
  estimatedTimeRemaining: number
}

export function VehicleThumbnail({
  selectedVehicle,
  sections,
  currentSectionIndex,
  currentStepIndex,
  isBackdatingEnabled,
  inspectionDate,
  progress,
  estimatedTimeRemaining
}: VehicleThumbnailProps) {
  const { t } = useI18n()

  if (!selectedVehicle) return null

  const currentSection = sections[currentSectionIndex] || { title: '' }

  return (
    <Card className="my-6">
      <CardContent className="p-4">
        <div className="flex flex-row gap-4 items-center">
          {/* Vehicle thumbnail - smaller size */}
          <div className="shrink-0">
            {selectedVehicle.image_url ? (
              <div className="relative rounded-md overflow-hidden h-24 w-32">
                <Image 
                  src={selectedVehicle.image_url} 
                  alt={selectedVehicle.name}
                  fill
                  sizes="128px"
                  className="object-cover"
                  priority={currentStepIndex === -1 || currentStepIndex === 0}
                />
              </div>
            ) : (
              <div className="w-32 h-24 bg-muted flex items-center justify-center rounded-md">
                <span className="text-muted-foreground">{t('common.noImage')}</span>
              </div>
            )}
          </div>
          
          {/* Vehicle info */}
          <div className="flex-1">
            <h3 className="text-xl font-bold">
              {selectedVehicle.brand} {selectedVehicle.model}
            </h3>
            <p className="text-muted-foreground">
              {selectedVehicle.year} {t('inspections.labels.model')}
            </p>
            <p className="text-muted-foreground mt-1">
              {selectedVehicle.plate_number}
            </p>
            {isBackdatingEnabled && inspectionDate && (
              <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 dark:text-amber-400">
                <Calendar className="h-4 w-4" />
                <span>{t('inspections.labels.inspectionDate')}: {format(inspectionDate, "PPP")}</span>
              </div>
            )}
          </div>
        </div>
            
        {currentStepIndex !== 0 && (
          <div className="mt-3 space-y-2">
            {/* Section info with progress */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {t('inspections.labels.currentSection')}: {currentSection.title}
              </p>
              <p className="text-sm font-medium">
                {progress}% - {currentSectionIndex + 1}/{sections.length}
              </p>
            </div>
            
            {/* Section indicators */}
            <div className="flex gap-1 h-2.5">
              {sections.map((section, index) => (
                <div 
                  key={section.id} 
                  className={`h-2.5 rounded-full flex-1 ${
                    index < currentSectionIndex 
                      ? 'bg-gradient-to-r from-green-500 to-green-600' 
                      : index === currentSectionIndex 
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                        : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            
            {/* Estimated time */}
            <p className="text-xs text-right text-muted-foreground">
              {t('inspections.labels.estimatedTime')}: {estimatedTimeRemaining} {t('common.minutes')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
