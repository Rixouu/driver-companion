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

export function VehicleForm({ initialData }: VehicleFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)

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

      // Generate a temporary VIN if not provided (for testing only)
      const vin = data.vin || `TEMP-${Date.now()}`

      // Insert vehicle directly using Supabase client
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
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Form completion</span>
            <span className="text-sm font-medium">0%</span>
          </div>
          <div className="bg-secondary h-2 rounded-full">
            <div className="bg-primary h-full rounded-full w-0" />
          </div>
        </div>

        <div className="border rounded-lg p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Family SUV" {...field} />
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
                    <Input placeholder="e.g., Toyota" {...field} />
                  </FormControl>
                  <FormDescription>
                    The manufacturer of the vehicle
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Camry" {...field} />
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
                    <Input placeholder="e.g., 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="vin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VIN</FormLabel>
                  <FormControl>
                    <Input placeholder="Vehicle Identification Number" {...field} />
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
                    <Input placeholder="e.g., ABC123" {...field} />
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
                    <SelectTrigger>
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

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Car className="mr-2 h-4 w-4" />
            {isLoading ? "Adding..." : "Add Vehicle"}
          </Button>
        </div>
      </form>
    </Form>
  )
}  