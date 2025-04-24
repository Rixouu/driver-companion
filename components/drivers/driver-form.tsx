"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { useI18n } from "@/lib/i18n/context"
import { driverSchema, type DriverFormValues } from "@/lib/validations/driver"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
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
      license_number: initialData?.license_number || "",
      license_expiry: initialData?.license_expiry || "",
      status: initialData?.status || "active",
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("drivers.fields.firstName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("drivers.placeholders.firstName")} {...field} />
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
                  <Input placeholder={t("drivers.placeholders.phone")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
              <FormItem className="flex flex-col">
                <FormLabel>{t("drivers.fields.licenseExpiry")}</FormLabel>
                <Popover open={isLicenseExpiryOpen} onOpenChange={setIsLicenseExpiryOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
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

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>{t("drivers.fields.status")}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="active" id="active" />
                    <Label htmlFor="active">{t("drivers.status.active")}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inactive" id="inactive" />
                    <Label htmlFor="inactive">{t("drivers.status.inactive")}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="on_leave" id="on_leave" />
                    <Label htmlFor="on_leave">{t("drivers.status.on_leave")}</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
          {isSubmitting
            ? t("common.submitting")
            : initialData
            ? t("drivers.actions.updateDriver")
            : t("drivers.actions.addDriver")}
        </Button>
      </form>
    </Form>
  )
} 