"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, parse, set } from "date-fns"
import { CalendarIcon, CheckIcon, XIcon, Clock } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

import type { DriverAvailability, DriverAvailabilityStatus } from "@/types/drivers"
import { createDriverAvailability, updateDriverAvailability } from "@/lib/services/driver-availability"

// Add time regex validation pattern
const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const formSchema = z.object({
  status: z.enum(["available", "unavailable", "leave", "training"]),
  start_date: z.date({
    required_error: "Start date is required",
  }),
  start_time: z.string()
    .regex(timePattern, { message: "Time must be in 24hr format (HH:MM)" })
    .default("09:00"),
  end_date: z.date({
    required_error: "End date is required",
  }),
  end_time: z.string()
    .regex(timePattern, { message: "Time must be in 24hr format (HH:MM)" })
    .default("17:00"),
  notes: z.string().optional(),
}).refine(data => {
  const startDateTime = combineDateTime(data.start_date, data.start_time);
  const endDateTime = combineDateTime(data.end_date, data.end_time);
  return endDateTime >= startDateTime;
}, {
  message: "End date/time must be after start date/time",
  path: ["end_date"],
});

// Helper function to combine date and time
function combineDateTime(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return set(date, { hours, minutes });
}

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

  // Parse initial dates and times if available
  let initialStartTime = "09:00";
  let initialEndTime = "17:00";
  
  if (initialData) {
    // Extract time if it exists in the date strings
    const startDateStr = initialData.start_date;
    const endDateStr = initialData.end_date;
    
    if (startDateStr.includes('T')) {
      const startDate = new Date(startDateStr);
      initialStartTime = format(startDate, "HH:mm");
    }
    
    if (endDateStr.includes('T')) {
      const endDate = new Date(endDateStr);
      initialEndTime = format(endDate, "HH:mm");
    }
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          status: initialData.status,
          start_date: new Date(initialData.start_date),
          start_time: initialStartTime,
          end_date: new Date(initialData.end_date),
          end_time: initialEndTime,
          notes: initialData.notes || "",
        }
      : {
          status: "available",
          start_date: new Date(),
          start_time: "09:00",
          end_date: new Date(),
          end_time: "17:00",
          notes: "",
        },
  })

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      // Combine date and time for both start and end
      const startDateTime = combineDateTime(values.start_date, values.start_time);
      const endDateTime = combineDateTime(values.end_date, values.end_time);
      
      const availabilityData = {
        driver_id: driverId,
        status: values.status as DriverAvailabilityStatus,
        // Use ISO string format to include time
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
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

        <div className="grid grid-cols-1 gap-4">
          {/* Start Date and Time Fields */}
          <div className="grid grid-cols-2 gap-2">
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
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <div className="flex">
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        className="w-full"
                        placeholder="HH:MM"
                      />
                    </FormControl>
                    <Clock className="ml-2 h-4 w-4 opacity-50 self-center" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* End Date and Time Fields */}
          <div className="grid grid-cols-2 gap-2">
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
                        disabled={(date) => date < form.getValues().start_date}
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
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <div className="flex">
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        className="w-full"
                        placeholder="HH:MM"
                      />
                    </FormControl>
                    <Clock className="ml-2 h-4 w-4 opacity-50 self-center" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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