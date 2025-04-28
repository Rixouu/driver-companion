"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, CheckIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils/styles"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"

import type { DriverAvailability, DriverAvailabilityStatus } from "@/types/drivers"
import { createDriverAvailability, updateDriverAvailability } from "@/lib/services/driver-availability"

const formSchema = z.object({
  status: z.enum(["available", "unavailable", "leave", "training"]),
  start_date: z.date({
    required_error: "Start date is required",
  }),
  end_date: z.date({
    required_error: "End date is required",
  }),
  notes: z.string().optional(),
}).refine(data => {
  return data.end_date >= data.start_date;
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

interface DriverAvailabilityFormProps {
  driverId: string
  initialData?: DriverAvailability
  onSuccess?: () => void
  onCancel?: () => void
}

export function DriverAvailabilityForm({
  driverId,
  initialData,
  onSuccess,
  onCancel
}: DriverAvailabilityFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          status: initialData.status,
          start_date: new Date(initialData.start_date),
          end_date: new Date(initialData.end_date),
          notes: initialData.notes || "",
        }
      : {
          status: "available",
          start_date: new Date(),
          end_date: new Date(),
          notes: "",
        },
  })

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const availabilityData = {
        driver_id: driverId,
        status: values.status as DriverAvailabilityStatus,
        start_date: format(values.start_date, "yyyy-MM-dd"),
        end_date: format(values.end_date, "yyyy-MM-dd"),
        notes: values.notes,
      }

      if (initialData) {
        await updateDriverAvailability(initialData.id, availabilityData)
        toast({
          title: "Availability updated",
          description: "Driver availability has been updated successfully",
        })
      } else {
        await createDriverAvailability(availabilityData)
        toast({
          title: "Availability added",
          description: "Driver availability has been added successfully",
        })
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error saving driver availability:", error)
      toast({
        title: "Error",
        description: "Failed to save driver availability",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(form.getValues().start_date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional notes here"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              <XIcon className="mr-2 h-4 w-4" /> Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            <CheckIcon className="mr-2 h-4 w-4" />
            {initialData ? "Update" : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 