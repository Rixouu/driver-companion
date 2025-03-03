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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/context"
import { vehicleSchema, type VehicleFormData } from "@/lib/validations/vehicle"
import { supabase } from "@/lib/supabase/client"
import { decode } from "@/lib/utils"
import { Car } from "lucide-react"
import { useState, useEffect } from "react"
import { z } from "zod"

interface VehicleFormProps {
  vehicle?: {
    id: string
    name: string
    plate_number: string
    brand?: string
    model?: string
    year?: number
    color?: string
    vin?: string
    image_url?: string
  }
}

// Storage bucket name - make sure this matches what's in your Supabase project
const STORAGE_BUCKET = 'vehicles-images';

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const { t } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(vehicle?.image_url || null)

  const form = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: vehicle?.name || "",
      plate_number: vehicle?.plate_number || "",
      brand: vehicle?.brand || "",
      model: vehicle?.model || "",
      year: vehicle?.year || undefined,
      vin: vehicle?.vin || "",
    },
  })

  // Create the storage bucket if it doesn't exist
  useEffect(() => {
    async function createBucketIfNeeded() {
      try {
        // Check if bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);
        
        if (!bucketExists) {
          // Create the bucket if it doesn't exist
          console.log(`Creating storage bucket: ${STORAGE_BUCKET}`);
          await supabase.storage.createBucket(STORAGE_BUCKET, {
            public: true,
            fileSizeLimit: 5242880, // 5MB
          });
        }
      } catch (error) {
        console.error('Error checking/creating storage bucket:', error);
      }
    }
    
    createBucketIfNeeded();
  }, []);

  async function onSubmit(data: z.infer<typeof vehicleSchema>) {
    try {
      setIsSubmitting(true)

      let imageUrl = vehicle?.image_url || null

      // Upload image if a new one was selected
      if (imageFile) {
        try {
          // First, ensure the bucket exists
          const { data: buckets } = await supabase.storage.listBuckets();
          const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);
          
          if (!bucketExists) {
            // Create the bucket if it doesn't exist
            await supabase.storage.createBucket(STORAGE_BUCKET, {
              public: true,
              fileSizeLimit: 5242880, // 5MB
            });
          }
          
          // Upload the file
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(`${Date.now()}-${imageFile.name}`, imageFile)

          if (uploadError) throw uploadError

          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(uploadData.path)

          imageUrl = urlData.publicUrl
        } catch (error) {
          console.error('Image upload error:', error);
          toast({
            title: t('vehicles.messages.imageUploadError'),
            description: error instanceof Error ? error.message : String(error),
            variant: "destructive",
          });
          // Continue with form submission even if image upload fails
        }
      }

      // Prepare vehicle data
      const vehicleData = {
        ...data,
        image_url: imageUrl,
      }

      let result;
      
      if (vehicle?.id) {
        // Update existing vehicle
        result = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', vehicle.id)
          .select()
          .single()
      } else {
        // Create new vehicle
        result = await supabase
          .from('vehicles')
          .insert(vehicleData)
          .select()
          .single()
      }

      const { error } = result
      if (error) throw error

      toast({
        title: vehicle?.id 
          ? t('vehicles.messages.updateSuccess') 
          : t('vehicles.messages.createSuccess'),
      })

      // Redirect to the vehicle details page or vehicles list
      if (vehicle?.id) {
        router.push(`/vehicles/${vehicle.id}`)
      } else {
        router.push('/vehicles')
      }
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: t('vehicles.messages.error'),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('vehicles.form.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.fields.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('vehicles.placeholders.name')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="plate_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('vehicles.fields.plateNumber')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('vehicles.placeholders.plateNumber')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('vehicles.fields.brand')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('vehicles.placeholders.brand')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('vehicles.fields.model')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('vehicles.placeholders.model')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('vehicles.form.additionalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('vehicles.fields.year')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('vehicles.placeholders.year')} 
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                            field.onChange(value)
                          }}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('vehicles.fields.vin')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('vehicles.placeholders.vin')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormLabel>{t('vehicles.fields.image')}</FormLabel>
                <div className="mt-2 space-y-4">
                  {imagePreview && (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt={form.getValues('name')}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('vehicles.fields.imageDescription')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('common.saving') : vehicle?.id ? t('common.update') : t('common.create')}
          </Button>
        </div>
      </form>
    </Form>
  )
}  