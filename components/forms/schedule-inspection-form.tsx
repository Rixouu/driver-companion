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
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { VehicleSelector } from "@/components/vehicle-selector"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

const scheduleInspectionSchema = z.object({
  vehicle_id: z.string().min(1, "Required"),
  schedule_type: z.enum(["routine", "annual", "safety", "emission"]),
  due_date: z.string().min(1, "Required"),
  notes: z.string().optional(),
})

type ScheduleInspectionFormData = z.infer<typeof scheduleInspectionSchema>

interface ScheduleInspectionFormProps {
  vehicleId: string
}

export function ScheduleInspectionForm({ vehicleId }: ScheduleInspectionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const form = useForm<ScheduleInspectionFormData>({
    resolver: zodResolver(scheduleInspectionSchema),
    defaultValues: {
      vehicle_id: vehicleId,
      schedule_type: "routine",
      due_date: "",
      notes: "",
    },
  })

  async function onSubmit(data: ScheduleInspectionFormData) {
    if (!user?.id) return

    try {
      setIsSubmitting(true)

      const { error } = await supabase
        .from('inspections')
        .insert([
          {
            vehicle_id: data.vehicle_id,
            inspector_id: user.id,
            schedule_type: data.schedule_type,
            due_date: new Date(data.due_date).toISOString(),
            date: new Date().toISOString(),
            notes: data.notes,
            status: 'scheduled',
          }
        ])

      if (error) throw error

      toast({
        title: "Success",
        description: "Inspection scheduled successfully",
      })

      router.push(`/vehicles/${data.vehicle_id}`)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "Failed to schedule inspection",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="border rounded-lg p-6 space-y-6">
          <FormField
            control={form.control}
            name="vehicle_id"
            render={({ field }) => (  
              <FormItem>
                <FormLabel>Vehicle</FormLabel>
                <VehicleSelector
                  value={field.value}
                  onChange={field.onChange}
                  disabled={true} 
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="schedule_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schedule Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select schedule type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="routine">Routine Inspection</SelectItem>
                    <SelectItem value="annual">Annual Inspection</SelectItem>
                    <SelectItem value="safety">Safety Inspection</SelectItem>
                    <SelectItem value="emission">Emission Test</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the type of inspection to be performed
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Add any additional notes"
                    {...field} 
                  />
                </FormControl>
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
            {isSubmitting ? "Scheduling..." : "Schedule Inspection"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 