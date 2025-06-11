"use client"

import { FormField, FormItem, FormControl } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { InspectionType } from "@/types/inspections"
import { Control } from "react-hook-form"
import { useI18n } from "@/lib/i18n/context"

interface InspectionTypeSelectorProps {
  control: Control<any>
  onTypeChange: (type: InspectionType) => void
  defaultValue?: InspectionType
  availableTypes?: InspectionType[]
  showAllTypes?: boolean
}

export function InspectionTypeSelector({
  control,
  onTypeChange,
  defaultValue = 'routine',
  availableTypes = [],
  showAllTypes = false
}: InspectionTypeSelectorProps) {
  const { t } = useI18n();
  
  const allTypes: InspectionType[] = ['routine', 'safety', 'maintenance', 'daily', 'test'];
  
  const typesToShow = showAllTypes 
    ? allTypes 
    : availableTypes.length > 0 
      ? availableTypes 
      : [defaultValue];
  
  if (!showAllTypes && availableTypes.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/30">
        <h3 className="text-lg font-medium mb-2">No Inspection Templates Assigned</h3>
        <p className="text-muted-foreground">
          This vehicle has no inspection templates assigned. Please contact an administrator to assign templates to this vehicle or its group.
        </p>
      </div>
    );
  }
  
  return (
    <FormField
      control={control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={(value: InspectionType) => {
                field.onChange(value)
                onTypeChange(value)
              }}
              defaultValue={defaultValue}
              className={`grid gap-4 ${typesToShow.length <= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
            >
              {typesToShow.map((type) => (
                <div key={type}>
                  <RadioGroupItem value={type} id={type} className="peer sr-only" />
                  <Label
                    htmlFor={type}
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span className="text-sm font-medium">{t(`inspections.type.${type}`)}</span>
                    {!showAllTypes && (
                      <span className="text-xs text-muted-foreground mt-1">Assigned</span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
} 