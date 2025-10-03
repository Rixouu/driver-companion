"use client"

import { Button } from "@/components/ui/button"
import { FormProvider } from "react-hook-form"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { InspectionTypeSelector } from "./inspection-type-selector"
import type { InspectionType } from "@/types/inspections"
import type { Control } from "react-hook-form"

interface TypeSelectionStepProps {
  control: Control<any>
  onTypeChange: (type: InspectionType) => void
  selectedType: InspectionType
  availableTypes: InspectionType[]
  onBack: () => void
  onStartInspection: () => void
  isSubmitting: boolean
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

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">{t("inspections.steps.selectType")}</h2>

      <FormProvider control={control}>
        <InspectionTypeSelector
          control={control}
          onTypeChange={onTypeChange}
          defaultValue={selectedType}
          availableTypes={availableTypes}
          showAllTypes={false}
        />
      </FormProvider>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("common.back")}
        </Button>
        {availableTypes.length > 0 && (
          <Button 
            onClick={onStartInspection} 
            disabled={isSubmitting}
          >
            {isSubmitting ? t("common.creating") : t("inspections.actions.startInspection")}{" "}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
