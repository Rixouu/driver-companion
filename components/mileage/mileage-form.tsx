"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { createMileageLog, updateMileageLog } from "@/lib/services/mileage"
import type { MileageLog } from "@/types"
import { mileageLogSchema } from "@/lib/validations/mileage"
import type { z } from "zod"

interface MileageFormProps {
  vehicleId: string
  initialData?: MileageLog
}

type FormData = z.infer<typeof mileageLogSchema>

export function MileageForm({ vehicleId, initialData }: MileageFormProps) {
  const router = useRouter()
  const { user } = useAuth()

  const form = useForm<FormData>({
    resolver: zodResolver(mileageLogSchema),
    defaultValues: {
      date: initialData?.date || new Date().toISOString().split("T")[0],
      reading: initialData?.reading || 0,
      notes: initialData?.notes || null,
    },
  })

  async function onSubmit(data: FormData) {
    try {
      if (!user?.id) {
        toast.error("You must be logged in to create a mileage log")
        return
      }

      if (!vehicleId) {
        toast.error("Vehicle ID is required")
        return
      }

      const timestamp = new Date().toISOString()
      const payload = {
        ...data,
        vehicle_id: vehicleId,
        user_id: user.id,
      }

      if (initialData?.id) {
        // Update existing log
        const { error } = await updateMileageLog(initialData.id, {
          ...payload,
          updated_at: timestamp,
        })
        if (error) {
          console.error("Error updating mileage log:", error)
          throw error
        }
        toast.success("Mileage log updated successfully")
        router.push(`/vehicles/${vehicleId}`)
      } else {
        // Create new log
        const { error } = await createMileageLog({
          ...payload,
          created_at: timestamp,
          updated_at: timestamp,
        })
        if (error) {
          console.error("Error creating mileage log:", error)
          throw error
        }
        toast.success("Mileage log created successfully")
        router.push(`/vehicles/${vehicleId}/mileage`)
      }
      router.refresh()
    } catch (error) {
      console.error("Error submitting mileage log:", error)
      toast.error("Something went wrong")
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odometer Reading</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit">
                {initialData ? "Update" : "Create"} Mileage Log
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 