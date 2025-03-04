"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { createFuelLog, updateFuelLog } from "@/lib/services/fuel"
import type { FuelLog } from "@/types"
import { fuelLogSchema } from "@/lib/validations/fuel"
import type { z } from "zod"
import { Checkbox } from "@/components/ui/checkbox"

interface FuelFormProps {
  vehicleId: string
  initialData?: FuelLog
}

type FormData = z.infer<typeof fuelLogSchema>

export function FuelForm({ vehicleId, initialData }: FuelFormProps) {
  const router = useRouter()
  const { user } = useAuth()

  const form = useForm<FormData>({
    resolver: zodResolver(fuelLogSchema),
    defaultValues: {
      date: initialData?.date || new Date().toISOString().split("T")[0],
      odometer_reading: initialData?.odometer_reading || 0,
      fuel_amount: initialData?.fuel_amount || 0,
      fuel_cost: initialData?.fuel_cost || 0,
      full_tank: initialData?.full_tank ?? true,
    },
  })

  async function onSubmit(data: FormData) {
    try {
      if (!user?.id) {
        toast.error("You must be logged in to create a fuel log")
        return
      }

      if (!vehicleId) {
        toast.error("Vehicle ID is required")
        return
      }

      const payload = {
        ...data,
        vehicle_id: vehicleId,
        user_id: user.id,
      }

      if (initialData?.id) {
        const { error } = await updateFuelLog(initialData.id, payload)
        if (error) throw error
        toast.success("Fuel log updated successfully")
      } else {
        const { error } = await createFuelLog(payload)
        if (error) throw error
        toast.success("Fuel log created successfully")
      }

      router.push(`/vehicles/${vehicleId}`)
      router.refresh()
    } catch (error) {
      console.error(error)
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
                name="odometer_reading"
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
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fuel_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Amount (Liters)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fuel_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Cost</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
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
            <FormField
              control={form.control}
              name="full_tank"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Full Tank</FormLabel>
                    <FormDescription>
                      Check if this was a full tank fill-up
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit">
                {initialData ? "Update" : "Create"} Fuel Log
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 