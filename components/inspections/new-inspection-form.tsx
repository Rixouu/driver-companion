"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast"
import { VehicleSelector } from "@/components/vehicle-selector"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/lib/hooks/use-auth"
import { useI18n } from "@/lib/i18n/context"

// Moved schema outside to use t() from useI18n in the component scope
// const inspectionSchema = z.object({
// vehicle_id: z.string().min(1, "Required"),
// });

type InspectionFormData = z.infer<ReturnType<typeof getSchema>>;

function getSchema(t: (key: string) => string) {
  return z.object({
    vehicle_id: z.string().min(1, t('common.forms.required')),
  });
}

export function NewInspectionForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const { t } = useI18n()

  // Get Supabase client instance
  const supabase = useMemo(() => createClient(), []);

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(getSchema(t)),
    defaultValues: {
      vehicle_id: "",
    },
  })

  async function onSubmit(data: InspectionFormData) {
    if (!user?.id) return

    try {
      setIsSubmitting(true)

      const { data: inspection, error } = await supabase
        .from('inspections')
        .insert([
          {
            vehicle_id: data.vehicle_id,
            inspector_id: user.id,
            status: 'scheduled',
            date: new Date().toISOString(),
            schedule_type: 'routine',
            due_date: new Date().toISOString(),
          }
        ])
        .select()
        .single()

      if (error) throw error

      toast({
        title: t('common.notifications.success'),
        description: t('inspections.notifications.createSuccess'),
      })

      router.push(`/inspections/${inspection.id}/perform`)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: t('common.notifications.error'),
        description: t('inspections.notifications.createError'),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="border rounded-lg p-6">
          <FormField
            control={form.control}
            name="vehicle_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('inspections.fields.vehicle')}</FormLabel>
                <VehicleSelector
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={t('inspections.fields.selectVehiclePlaceholder')}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('common.creating') : t('inspections.createInspection')}
          </Button>
        </div>
      </form>
    </Form>
  )
} 