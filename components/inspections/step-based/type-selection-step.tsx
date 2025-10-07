"use client"

import { useState } from "react"
import { Control } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Wrench, Shield } from "lucide-react"
import { InspectionType } from "@/types/inspections"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

interface TypeSelectionStepProps {
  control: Control<any>
  onTypeChange: (type: InspectionType) => void
  selectedType: InspectionType
  availableTypes: InspectionType[]
  onBack: () => void
  onStartInspection: () => void
  isSubmitting: boolean
}

const inspectionTypeConfig = {
  routine: {
    icon: CheckCircle,
    color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
    hoverColor: "hover:border-green-300 dark:hover:border-green-700"
  },
  safety: {
    icon: Shield,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
    hoverColor: "hover:border-blue-300 dark:hover:border-blue-700"
  },
  maintenance: {
    icon: Wrench,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-800",
    hoverColor: "hover:border-orange-300 dark:hover:border-orange-700"
  }
}

export function TypeSelectionStep({
  control,
  onTypeChange,
  selectedType,
  availableTypes,
  onBack,
  onStartInspection,
  isSubmitting
}: TypeSelectionStepProps) {
  const { t } = useI18n()

  const handleTypeSelect = (type: InspectionType) => {
    onTypeChange(type)
  }

  const handleStart = () => {
    if (selectedType) {
      onStartInspection()
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">{t('inspections.steps.selectType')}</h2>
        <p className="text-muted-foreground">
          {t('inspections.steps.selectTypeDescription')}
        </p>
      </div>

      {availableTypes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('inspections.errors.noTemplatesAssigned')}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {t('inspections.errors.noTemplatesAssignedDescription')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableTypes.map((type) => {
            const config = inspectionTypeConfig[type as keyof typeof inspectionTypeConfig]
            if (!config) return null
            const Icon = config.icon
            const isSelected = selectedType === type

            return (
              <Card
                key={type}
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  isSelected
                    ? "ring-2 ring-primary border-primary"
                    : "hover:shadow-md",
                  config.borderColor,
                  config.hoverColor
                )}
                onClick={() => handleTypeSelect(type)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={cn("p-2 rounded-lg", config.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        {t('common.selected')}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardTitle className="text-lg mb-2">
                    {t(`inspections.types.${type}.title`)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t(`inspections.types.${type}.description`)}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('common.back')}
        </Button>

        <Button
          onClick={handleStart}
          disabled={!selectedType || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t('inspections.actions.starting')}
            </>
          ) : (
            <>
              {t('inspections.actions.startInspection')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 