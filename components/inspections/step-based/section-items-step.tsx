"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, Camera, ArrowLeft, ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import Image from "next/image"

interface InspectionItem {
  id: string
  title: string
  description?: string
  requires_photo: boolean
  requires_notes: boolean
  status: 'pass' | 'fail' | null
  notes: string
  photos: string[]
}

interface InspectionSection {
  id: string
  title: string
  description?: string
  items: InspectionItem[]
}

interface SectionItemsStepProps {
  sections: InspectionSection[]
  currentSectionIndex: number
  onItemStatusChange: (sectionId: string, itemId: string, status: 'pass' | 'fail') => void
  onCameraClick: (sectionId: string, itemId: string) => void
  onDeletePhoto: (sectionId: string, itemId: string, photoIndex: number) => void
  onNotesChange: (sectionId: string, itemId: string, notes: string) => void
  onPreviousSection: () => void
  onNextSection: () => void
  onBackToTypeSelection: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function SectionItemsStep({
  sections,
  currentSectionIndex,
  onItemStatusChange,
  onCameraClick,
  onDeletePhoto,
  onNotesChange,
  onPreviousSection,
  onNextSection,
  onBackToTypeSelection,
  onSubmit,
  isSubmitting
}: SectionItemsStepProps) {
  const { t } = useI18n()

  if (!sections.length || currentSectionIndex >= sections.length) {
    return null
  }

  const currentSection = sections[currentSectionIndex]

  return (
    <div className="space-y-8">
      <div className="bg-muted/30 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{currentSection.title}</h2>
          <span className="bg-muted px-3 py-1 rounded-full text-sm font-medium">
            {currentSectionIndex + 1}/{sections.length}
          </span>
        </div>
        {currentSection.description && (
          <p className="text-muted-foreground">{currentSection.description}</p>
        )}
      </div>
      
      {/* Inspection items */}
      <div className="space-y-6">
        {currentSection.items.map((item, itemIndex) => (
          <Card key={`${currentSection.id}-${item.id}-${itemIndex}`} className="border">
            <CardContent className="p-6 space-y-5">
              <div className="bg-muted/20 p-3 rounded-md">
                <h3 className="font-medium text-lg">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                )}
              </div>
              
              <div className="flex gap-4 flex-wrap">
                <Button 
                  variant={item.status === 'pass' ? 'default' : 'outline'} 
                  size="sm"
                  className={item.status === 'pass' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => onItemStatusChange(currentSection.id, item.id, 'pass')}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {t('inspections.actions.pass')}
                </Button>
                <Button 
                  variant={item.status === 'fail' ? 'default' : 'outline'} 
                  size="sm"
                  className={item.status === 'fail' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => onItemStatusChange(currentSection.id, item.id, 'fail')}
                >
                  <X className="mr-2 h-4 w-4" />
                  {t('inspections.actions.fail')}
                </Button>
                {item.requires_photo && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onCameraClick(currentSection.id, item.id)}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {item.photos.length > 0 
                      ? t('inspections.actions.photos', { count: String(item.photos.length) }) 
                      : t('inspections.actions.takePhoto')}
                  </Button>
                )}
              </div>
              
              {/* Display photos if any */}
              {item.photos.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {item.photos.map((photo, index) => (
                    <div key={index} className="w-20 h-20 relative rounded overflow-hidden group">
                      <Image 
                        src={photo} 
                        alt={t('inspections.labels.photoNumber', { number: String(index + 1) })}
                        fill
                        className="object-cover" 
                      />
                      <button
                        onClick={() => onDeletePhoto(currentSection.id, item.id, index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Delete photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Notes input */}
              {item.status === 'fail' && (
                <Textarea
                  placeholder={t('inspections.fields.notesPlaceholder')}
                  value={item.notes}
                  onChange={(e) => onNotesChange(currentSection.id, item.id, e.target.value)}
                  className="min-h-[100px] mt-4"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button 
          variant="outline" 
          onClick={currentSectionIndex === 0 ? onBackToTypeSelection : onPreviousSection}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> 
          {currentSectionIndex === 0 
            ? t('common.back') 
            : `${t('inspections.actions.previousSection')} (${currentSectionIndex}/${sections.length})`}
        </Button>
        
        {currentSectionIndex < sections.length - 1 ? (
          <Button onClick={onNextSection}>
            {`${t('inspections.actions.nextSection')} (${currentSectionIndex + 2}/${sections.length})`} 
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? t('common.submitting') : t('inspections.actions.completeInspection')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
