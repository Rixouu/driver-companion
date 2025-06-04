'use server'

import { getInspectionTemplates, type InspectionCategory } from "@/lib/services/inspections"
import type { InspectionType } from "@/types/inspections"

export async function fetchInspectionTemplatesAction(
  type: InspectionType
): Promise<InspectionCategory[]> {
  try {
    // getInspectionTemplates already uses createServiceClient which is server-side
    const templates = await getInspectionTemplates(type)
    // Ensure the returned data is serializable (plain objects/arrays)
    // The current getInspectionTemplates seems to return data that should be serializable.
    return templates
  } catch (error) {
    console.error("[Server Action] Error fetching inspection templates:", error)
    // Depending on how you want to handle errors on the client:
    // return []; // or throw a more specific error
    throw new Error(`Failed to fetch inspection templates for type: ${type}`)
  }
} 