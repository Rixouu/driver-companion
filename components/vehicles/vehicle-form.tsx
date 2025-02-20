"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import { vehicleSchema, type VehicleFormData, VehicleFormProps } from "@/lib/validations/vehicle"
import { supabase } from "@/lib/supabase/client"
import { decode } from "@/lib/utils"
import { Car } from "lucide-react"
import { useState, useEffect } from "react"

export function VehicleForm({ initialData }: VehicleFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  const [completion, setCompletion] = useState(0)

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: "",
      model: "",
      brand: "",
      year: "",
      status: "active",
      image_url: "",
      vin: "",
      plate_number: "",
    },
  })

  // Add watch to monitor form fields with proper typing
  const watchedFields = form.watch() as Record<string, string>

  // Calculate completion percentage whenever form fields change
  useEffect(() => {
    const requiredFields = [
      'name',
      'brand',
      'model',
      'year',
      'plate_number',
      'status'
    ] as const

    const filledFields = requiredFields.filter(
      field => watchedFields[field] && watchedFields[field].length > 0
    )

    const percentage = Math.round((filledFields.length / requiredFields.length) * 100)
    setCompletion(percentage)
  }, [watchedFields])

  async function onSubmit(data: VehicleFormData) {
    try {
      setIsLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("Not authenticated - Please log in again")
      }

      let imageUrl = data.image_url
      if (imageUrl && imageUrl.startsWith('data:')) {
        const fileName = `${Date.now()}.webp`
        const { error: uploadError } = await supabase.storage
          .from('vehicles-images')
          .upload(fileName, decode(imageUrl), {
            contentType: 'image/webp',
            upsert: true,
          })

        if (uploadError) {
          throw new Error("Failed to upload image")
        }

        const { data: { publicUrl } } = supabase.storage
          .from('vehicles-images')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      // Generate a unique VIN if not provided
      const vin = data.vin || `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

      // Check if VIN already exists
      if (data.vin) {
        const { data: existingVehicle } = await supabase
          .from('vehicles')
          .select('id')
          .eq('vin', data.vin)
          .single()

        if (existingVehicle) {
          throw new Error("A vehicle with this VIN already exists")
        }
      }

      // Insert vehicle
      const { error: insertError } = await supabase
        .from('vehicles')
        .insert([
          {
            ...data,
            vin,
            image_url: imageUrl,
            user_id: user.id,
          }
        ])

      if (insertError) {
        console.error('Insert Error:', insertError)
        throw new Error(insertError.message)
      }

      toast({
        title: "Success",
        description: "Vehicle added successfully",
      })
      
      router.push("/vehicles")
      router.refresh()
    } catch (error) {
      console.error("Error adding vehicle:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add vehicle",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Completion Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-muted-foreground">Form completion</span>
            <span className="text-sm font-medium">{completion}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary">
            <div 
              className="h-full rounded-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <div className="border rounded-lg p-4 sm:p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Family SUV" {...field} className="w-full" />
                  </FormControl>
                  <FormDescription>
                    A friendly name to identify this vehicle
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Toyota" {...field} className="w-full" />
                  </FormControl>
                  <FormDescription>
                    The manufacturer of the vehicle
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Camry" {...field} className="w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 2024" {...field} className="w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="vin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VIN</FormLabel>
                  <FormControl>
                    <Input placeholder="Vehicle Identification Number" {...field} className="w-full" />
                  </FormControl>
                  <FormDescription>
                    17-character vehicle identification number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plate_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Plate</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ABC123" {...field} className="w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  PNG, JPG or WEBP (MAX. 800x400px)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Current operational status of the vehicle
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <Car className="mr-2 h-4 w-4" />
            {isLoading ? "Adding..." : "Add Vehicle"}
          </Button>
        </div>
      </form>
    </Form>
  )
}  