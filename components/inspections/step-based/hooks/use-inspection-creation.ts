"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/lib/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import type { InspectionType } from "@/types/inspections"

interface Vehicle {
  id: string
  name: string
  plate_number: string
  brand?: string
  model?: string
  image_url?: string | null
  year?: string
}

interface UseInspectionCreationProps {
  selectedVehicle: Vehicle | null
  selectedType: InspectionType | null
  inspectionId: string | null
  sections: any[]
  inspectionDate: Date | undefined
  isAutoStartingRef: React.MutableRefObject<boolean>
}

export function useInspectionCreation({
  selectedVehicle,
  selectedType,
  inspectionId,
  sections,
  inspectionDate,
  isAutoStartingRef
}: UseInspectionCreationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const handleStartInspection = async () => {
    if (!selectedVehicle) {
      toast({
        title: "Please select a vehicle",
        variant: "destructive",
      })
      return
    }
    
    // Ensure we have a template type selected
    if (!selectedType) {
      toast({
        title: "Please select an inspection type",
        variant: "destructive",
      })
      return
    }
    
    // When creating a brand-new inspection we can proceed immediately and let
    // the perform page load the template. Only enforce the sections-loaded
    // check when we are editing / resuming an existing inspection.
    if (inspectionId && sections.length === 0) {
      toast({
        title: "Template not loaded",
        description: "Please wait for the template to load or try selecting a different template",
        variant: "destructive",
      })
      return
    }

    // Always create a new inspection if we don't have an inspectionId
    if (!inspectionId) {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to create an inspection",
          variant: "destructive",
        })
        return
      }

      console.log(
        `[INSPECTION_CREATE] User ${user.id} is creating a new inspection. Vehicle: ${selectedVehicle.name}, Type: ${selectedType}`
      )
      setIsSubmitting(true)
      try {
        const supabaseClient = createClient()
        // Auto-find driver ID based on user email
        const { data: driverData, error: driverError } = await supabaseClient
          .from('drivers')
          .select('id')
          .eq('email', user.email!)
          .single()

        if (driverError || !driverData) {
          toast({
            title: "Driver Not Found",
            description: "Your email is not associated with a driver account. Please contact an administrator.",
            variant: "destructive",
          });
          return;
        }

        // Show confirmation toast with driver info (only if not auto-starting)
        if (!isAutoStartingRef.current) {
          toast({
            title: "Driver Confirmed",
            description: `Inspection will be performed by: ${user.email}`,
            variant: "default",
          });
        }

        const { data: newInspection, error } = await supabaseClient
          .from("inspections")
          .insert({
            vehicle_id: selectedVehicle.id,
            type: selectedType,
            status: "in_progress",
            created_by: user.id,
            inspector_id: driverData.id, // Use auto-found driver ID
            date: (inspectionDate || new Date()).toISOString(),
          })
          .select("id")
          .single()

        if (error) {
          console.error("[INSPECTION_CREATE] Error creating new inspection:", error)
          throw error
        }

        console.log(
          `[INSPECTION_CREATE] New inspection created (ID: ${newInspection.id}). Redirecting to perform page.`
        )
        // Only show toast if not auto-starting (to avoid duplicate notifications)
        if (!isAutoStartingRef.current) {
          toast({ title: "Inspection Created", description: "Starting..." })
        }
        router.push(`/inspections/${newInspection.id}/perform`)
        return
      } catch (error: any) {
        console.error("[INSPECTION_CREATE] Error creating inspection:", error)
        toast({
          title: "Failed to Start Inspection",
          description: error.message || "Could not create the inspection. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
      return
    }
    
    // If we have an inspectionId, we're editing an existing inspection
    console.log("[INSPECTION_PERFORM] Starting/continuing inspection. Moving to first section.")
    return { shouldMoveToNextStep: true }
  }

  return {
    isSubmitting,
    handleStartInspection
  }
}
