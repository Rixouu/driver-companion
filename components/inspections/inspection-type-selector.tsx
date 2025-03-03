"use client"

import { FormField, FormItem, FormControl } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { InspectionType } from "@/lib/types/inspections"
import { Control } from "react-hook-form"

interface InspectionTypeSelectorProps {
  control: Control<any>
  onTypeChange: (type: InspectionType) => void
  defaultValue?: InspectionType
}

export function InspectionTypeSelector({
  control,
  onTypeChange,
  defaultValue = 'routine'
}: InspectionTypeSelectorProps) {
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
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="routine" id="routine" className="peer sr-only" />
                <Label
                  htmlFor="routine"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="text-sm font-medium">Routine</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="safety" id="safety" className="peer sr-only" />
                <Label
                  htmlFor="safety"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="text-sm font-medium">Safety</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="maintenance" id="maintenance" className="peer sr-only" />
                <Label
                  htmlFor="maintenance"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span className="text-sm font-medium">Maintenance</span>
                </Label>
              </div>
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  )
} 