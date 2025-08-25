"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { CalendarIcon, User, Phone, FileText, MapPin, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { useI18n } from "@/lib/i18n/context"
import { driverSchema, type DriverFormValues } from "@/lib/validations/driver"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils/styles"
import type { Driver } from "@/types"

interface DriverFormProps {
  initialData?: Driver
  onSubmit: (data: DriverFormValues) => void
  isSubmitting?: boolean
}

export function DriverForm({ initialData, onSubmit, isSubmitting = false }: DriverFormProps) {
  const { t } = useI18n()
  const [isLicenseExpiryOpen, setIsLicenseExpiryOpen] = useState(false)

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      line_id: initialData?.line_id || "",
      license_number: initialData?.license_number || "",
      license_expiry: initialData?.license_expiry || "",
      address: initialData?.address || "",
      emergency_contact: initialData?.emergency_contact || "",
      notes: initialData?.notes || "",
    },
  })

  function handleSubmit(data: DriverFormValues) {
    onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Personal Information Group */}
        <div className="bg-muted/30 rounded-lg p-6 border border-border/50 hover:bg-muted/40 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <p className="text-sm text-muted-foreground">Basic personal details and contact information</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground mb-2 block">
                    {t("drivers.fields.firstName")}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t("drivers.placeholders.firstName")} 
                      className="h-10 bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("drivers.fields.lastName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("drivers.placeholders.lastName")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("drivers.fields.email")}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t("drivers.placeholders.email")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("drivers.fields.phone")}</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder={t("drivers.placeholders.phone")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="line_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("drivers.fields.lineId")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("drivers.placeholders.lineId")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergency_contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("drivers.fields.emergencyContact")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("drivers.placeholders.emergencyContact")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Professional Information Group */}
        <div className="bg-muted/30 rounded-lg p-6 border border-border/50 hover:bg-muted/40 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Professional Information</h3>
              <p className="text-sm text-muted-foreground">License details and professional credentials</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="license_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("drivers.fields.licenseNumber")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("drivers.placeholders.licenseNumber")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="license_expiry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("drivers.fields.licenseExpiry")}</FormLabel>
                  <Popover open={isLicenseExpiryOpen} onOpenChange={setIsLicenseExpiryOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-10 pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>{t("drivers.placeholders.licenseExpiry")}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          field.onChange(date ? date.toISOString() : "")
                          setIsLicenseExpiryOpen(false)
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Location & Additional Details Group */}
        <div className="bg-muted/30 rounded-lg p-6 border border-border/50 hover:bg-muted/40 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Location & Additional Details</h3>
              <p className="text-sm text-muted-foreground">Address information and additional notes</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("drivers.fields.address")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("drivers.placeholders.address")} 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("drivers.fields.notes")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("drivers.placeholders.notes")} 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>All changes will be saved when you submit the form</span>
          </div>
          <Button type="submit" className="min-w-[140px] shadow-lg hover:shadow-xl transition-all duration-200" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t("drivers.actions.updateDriver")}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
} 