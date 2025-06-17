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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('vehicles.form.imageUpload')}</CardTitle>
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
        
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()} 
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
            {isSubmitting ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : vehicle?.id ? (
              t('common.saveChanges')
            ) : (
              t('common.create')
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}  