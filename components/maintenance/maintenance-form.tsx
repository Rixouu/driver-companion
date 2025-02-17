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
import { createMaintenanceTask, updateMaintenanceTask } from "@/lib/services/maintenance"
import { useAuth } from "@/hooks/use-auth"

const maintenanceSchema = z.object({
  vehicle_id: z.string().min(1, "Required"),
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.string().min(1, "Required"),
  estimated_duration: z.string().optional(),
  cost: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "overdue"]).default("pending"),
})

type MaintenanceFormData = z.infer<typeof maintenanceSchema>

interface MaintenanceFormProps {
  initialData?: MaintenanceFormData & { id?: string }
  mode?: 'create' | 'edit'
}

export function MaintenanceForm({ initialData, mode = 'create' }: MaintenanceFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: initialData || {
      vehicle_id: "",
      title: "",
      description: "",
      priority: "medium",
      due_date: "",
      estimated_duration: "",
      cost: "",
      notes: "",
      status: "pending",
    },
  })

  const onSubmit = async (data: MaintenanceFormData) => {
    if (!user?.id) return

    try {
      setIsSubmitting(true)

      const formattedData = {
        ...data,
        user_id: user.id,
        estimated_duration: data.estimated_duration ? parseFloat(data.estimated_duration) : undefined,
        cost: data.cost ? parseFloat(data.cost) : undefined,
      }

      if (mode === 'edit' && initialData?.id) {
        await updateMaintenanceTask(initialData.id, formattedData)
        toast({
          title: "Success",
          description: "Maintenance task updated successfully",
        })
      } else {
        const { data, error } = await createMaintenanceTask({
          ...formattedData,
          user_id: user?.id,
        })
        if (error) {
          console.error('Error:', error)
          toast({
            title: "Error",
            description: "Failed to create maintenance task",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Success",
            description: "Maintenance task created successfully",
          })
        }
      }

      router.push("/maintenance")
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: mode === 'edit' 
          ? "Failed to update maintenance task" 
          : "Failed to create maintenance task",
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
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Oil Change" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the maintenance task" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
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
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="estimated_duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Duration (hours)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 2"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Cost</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 100.00"
                      {...field}
                    />
                  </FormControl>
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
            {isSubmitting 
              ? mode === 'create' ? "Creating..." : "Updating..."
              : mode === 'create' ? "Create Task" : "Update Task"
            }
          </Button>
        </div>
      </form>
    </Form>
  )
} 