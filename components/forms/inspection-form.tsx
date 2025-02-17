"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { inspectionSchema, type InspectionFormData } from "@/lib/validations/inspection"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { InspectionItem } from "@/components/inspections/form/inspection-item"
import { useState } from "react"
import { CameraModal } from "@/components/inspections/camera/camera-modal"

interface InspectionFormProps {
  initialData?: Partial<InspectionFormData>
  onSubmit: (data: InspectionFormData) => Promise<void>
}

export function InspectionForm({ initialData, onSubmit }: InspectionFormProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)

  const form = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: initialData || {
      items: {},
      notes: "",
    },
  })

  const handlePhotoCapture = (photoUrl: string) => {
    if (!activeItemId) return

    const currentPhotos = form.getValues(`items.${activeItemId}.photos`) || []
    form.setValue(`items.${activeItemId}.photos`, [...currentPhotos, photoUrl ] as never) 
    setIsCameraOpen(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Form fields */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "common.saving" : "common.save"}
        </Button>
      </form>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handlePhotoCapture}
      />
    </Form>
  )
} 