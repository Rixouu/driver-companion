"use client"

import { useState } from "react"
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
import { useToast } from "@/components/ui/use-toast"
import { VehicleSelector } from "@/components/vehicle-selector"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

const inspectionSchema = z.object({
  vehicle_id: z.string().min(1, "Required"),
})

type InspectionFormData = z.infer<typeof inspectionSchema>

export function NewInspectionForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
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
        title: "Success",
        description: "Inspection created successfully",
      })

      router.push(`/inspections/${inspection.id}/perform`)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Failed to create inspection",
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
                <FormLabel>Vehicle</FormLabel>
                <VehicleSelector
                  value={field.value}
                  onChange={field.onChange}
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
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Inspection"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 