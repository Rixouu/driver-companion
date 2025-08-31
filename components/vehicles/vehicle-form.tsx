"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/use-toast"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/context"
import { vehicleSchema, type VehicleFormData } from "@/lib/validations/vehicle"
import { useSupabase } from "@/components/providers/supabase-provider"
import { Car } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import type { Database } from '@/types/supabase';
import { useVehiclePricingCategories } from "@/lib/hooks/useVehiclePricingCategories"

interface VehicleFormProps {
  vehicle?: Partial<VehicleFormData> & { id?: string };
}

const STORAGE_BUCKET = 'vehicles-images';

const ImageUpload = dynamic(() => import('@/components/ui/image-upload').then(mod => mod.ImageUpload), {
  ssr: false,
  loading: () => {
    return <div className="h-[150px] w-full flex items-center justify-center bg-muted rounded-md text-sm text-muted-foreground">Loading...</div>
  }
});

export function VehicleForm({ vehicle }: VehicleFormProps) {
  const { t } = useI18n()
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const supabase = useSupabase();

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: vehicle?.name || "",
      plate_number: vehicle?.plate_number || "",
      brand: vehicle?.brand || "",
      model: vehicle?.model || "",
      year: vehicle?.year || undefined,
      vin: vehicle?.vin || "",
      passenger_capacity: vehicle?.passenger_capacity ?? undefined,
      luggage_capacity: vehicle?.luggage_capacity ?? undefined,
      status: vehicle?.status || "active",
      image_url: vehicle?.image_url || null,
    },
  })

  useEffect(() => {
    if (vehicle) {
      form.reset({
        name: vehicle.name || "",
        plate_number: vehicle.plate_number || "",
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        year: vehicle.year || undefined,
        vin: vehicle.vin || "",
        passenger_capacity: vehicle.passenger_capacity ?? undefined,
        luggage_capacity: vehicle.luggage_capacity ?? undefined,
        status: vehicle.status || "active",
        image_url: vehicle.image_url || null,
      });
    }
  }, [vehicle, form.reset]);

  useEffect(() => {
    async function createBucketIfNeeded() {
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);
        
        if (!bucketExists) {
          console.log(`Creating storage bucket: ${STORAGE_BUCKET}`);
          await supabase.storage.createBucket(STORAGE_BUCKET, {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024, // 5MB
          });
        }
      } catch (error) {
        console.error('Error checking/creating storage bucket:', error);
      }
    }
    
    createBucketIfNeeded();
  }, [supabase]);

  async function onSubmit(data: VehicleFormData) {
    if (!user) {
      toast({
        title: t('common.error'),
        description: t('common.loginRequired'),
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      let finalImageUrl = data.image_url;

      if (imageFile) {
        try {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(`${user.id}/${Date.now()}-${imageFile.name}`, imageFile, {
              cacheControl: '3600',
              upsert: false,
            })

          if (uploadError) throw uploadError

          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(uploadData.path)

          finalImageUrl = urlData.publicUrl
        } catch (error) {
          console.error('Image upload error:', error);
          toast({
            title: t('vehicles.messages.imageUploadError'),
            description: error instanceof Error ? error.message : String(error),
            variant: "destructive",
          });
        }
      }

      type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
      type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

      const vehicleDbData = {
        name: data.name,
        plate_number: data.plate_number,
        brand: data.brand || "",
        model: data.model || "",
        year: data.year ? String(data.year) : "",
        vin: data.vin || "",
        passenger_capacity: data.passenger_capacity ?? null,
        luggage_capacity: data.luggage_capacity ?? null,
        status: data.status || 'active',
        image_url: finalImageUrl || null,
      };

      let result;
      
      if (vehicle?.id) {
        const updatePayload: VehicleUpdate = {};
        if (data.name !== undefined) updatePayload.name = data.name;
        if (data.plate_number !== undefined) updatePayload.plate_number = data.plate_number;
        if (data.brand !== undefined) updatePayload.brand = data.brand || "";
        if (data.model !== undefined) updatePayload.model = data.model || "";
        if (data.year !== undefined) updatePayload.year = String(data.year) ;
        if (data.vin !== undefined) updatePayload.vin = data.vin || "";
        if (data.status !== undefined) updatePayload.status = data.status;
        if (finalImageUrl !== undefined) updatePayload.image_url = finalImageUrl || null;
        if (data.passenger_capacity !== undefined) updatePayload.passenger_capacity = data.passenger_capacity ?? null;
        if (data.luggage_capacity !== undefined) updatePayload.luggage_capacity = data.luggage_capacity ?? null;
        
        if (Object.keys(updatePayload).length === 0) {
            toast({ title: t('common.noChanges') });
            setIsSubmitting(false);
            return;
        }

        result = await supabase
          .from('vehicles')
          .update(updatePayload)
          .eq('id', vehicle.id)
          .select()
          .single()
      } else {
        const insertPayload: VehicleInsert = {
            name: vehicleDbData.name,
            plate_number: vehicleDbData.plate_number,
            brand: vehicleDbData.brand,
            model: vehicleDbData.model,
            year: vehicleDbData.year,
            vin: vehicleDbData.vin,
            user_id: user.id,
            image_url: vehicleDbData.image_url,
            passenger_capacity: vehicleDbData.passenger_capacity,
            luggage_capacity: vehicleDbData.luggage_capacity,
            status: vehicleDbData.status,
            vehicle_category_id: "default", // Set to a default category ID - this should be handled properly in production
        };
        result = await supabase
          .from('vehicles')
          .insert(insertPayload)
          .select()
          .single()
      }

      const { error, data: dbVehicle } = result;
      if (error) throw error

      toast({
        title: vehicle?.id 
          ? t('vehicles.messages.updateSuccess') 
          : t('vehicles.messages.createSuccess'),
      })

      router.push(dbVehicle?.id ? `/vehicles/${dbVehicle.id}` : '/vehicles')
      router.refresh()
    } catch (error) {
      console.error('Error submitting form:', error)
      toast({
        title: t('vehicles.messages.error'),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Form Container with Subtle Background */}
        <div className="rounded-lg bg-muted/30 p-6 space-y-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Basic Information - Takes 2 columns on desktop */}
            <div className="lg:col-span-2 space-y-8">
              {/* Vehicle Identification Section */}
              <Card className="border-0 shadow-sm bg-background/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{t('vehicles.form.basicInfo')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('vehicles.form.basicInfoDescription')}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Vehicle Name and License Plate - Same row on desktop */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('vehicles.fields.name')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('vehicles.fields.namePlaceholder')} {...field} />
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
                            <Input placeholder={t('vehicles.fields.plateNumberPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Brand and Model - Same row on desktop */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="brand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('vehicles.fields.brand')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('vehicles.fields.brandPlaceholder')} {...field} value={field.value || ''} />
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
                            <Input placeholder={t('vehicles.fields.modelPlaceholder')} {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Year and VIN - Same row on desktop */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('vehicles.fields.year')}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder={t('vehicles.fields.yearPlaceholder')} {...field} value={field.value || undefined} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
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
                            <Input placeholder={t('vehicles.fields.vinPlaceholder')} {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Specifications Section */}
              <Card className="border-0 shadow-sm bg-background/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{t('vehicles.form.specifications')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('vehicles.form.specificationsDescription')}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status and Capacity Group - 3 columns on desktop */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('vehicles.fields.status')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('vehicles.fields.statusPlaceholder')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">{t('vehicles.status.active')}</SelectItem>
                              <SelectItem value="maintenance">{t('vehicles.status.maintenance')}</SelectItem>
                              <SelectItem value="inactive">{t('vehicles.status.inactive')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="passenger_capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('vehicles.fields.passengerCapacity')}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder={t('vehicles.fields.passengerCapacityPlaceholder')} {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="luggage_capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('vehicles.fields.luggageCapacity')}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder={t('vehicles.fields.luggageCapacityPlaceholder')} {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vehicle Image - Takes 1 column on desktop */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-sm bg-background/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{t('vehicles.form.imageUpload')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('vehicles.form.imageUploadDescription')}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUpload
                            initialValue={field.value}
                            onChange={(file) => {
                              setImageFile(file);
                              if (!file) {
                                form.setValue('image_url', null);
                              }
                            }}
                            buttonText={t('vehicles.form.uploadImageButton')}
                            sizeLimit={t('vehicles.form.uploadImageSizeLimit')}
                            aspectRatio="video"
                          />
                        </FormControl>
                        <FormDescription>
                          {t('vehicles.fields.imageDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>All changes will be saved when you submit the form</span>
          </div>
          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()} 
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px] shadow-lg hover:shadow-xl transition-all duration-200">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : vehicle?.id ? (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('common.saveChanges')}
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {t('common.create')}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}

// Pricing Categories Editor removed - now managed in vehicle details page  