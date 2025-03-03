"use client"

import { useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { InspectionType } from "@/lib/types/inspections"
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form"
import { VehicleSelector } from "@/components/vehicle-selector"
import { InspectionTypeSelector } from "./inspection-type-selector"

const inspectionSchema = z.object({
  vehicle_id: z.string().min(1, "Required"),
  type: z.enum(["routine", "safety", "maintenance"]).default("routine"),
})

type InspectionFormData = z.infer<typeof inspectionSchema>

interface InspectionFormProps {
  inspectionId: string
  type?: InspectionType
  vehicleId: string
}

export function InspectionForm({ inspectionId, type = 'routine', vehicleId }: InspectionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useI18n()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedType, setSelectedType] = useState<InspectionType>(type)

  const methods = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      vehicle_id: vehicleId || '',
      type: type || 'routine',
    },
  })

  const onSubmit = methods.handleSubmit(async (data) => {
    try {
      setIsSubmitting(true)
      // Your submit logic here
      toast({
        title: t('inspections.messages.createSuccess'),
      })
      router.push('/inspections')
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
              name="vehicle_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <VehicleSelector
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={t('inspections.fields.vehicleDescription')}
                      disabled={!!vehicleId}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          <div className="sticky bottom-0 bg-background p-4 border-t">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
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
    </div>
  )
} 