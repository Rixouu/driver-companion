import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const metadata: Metadata = {
  title: "New Inspection",
  description: "Create a new vehicle inspection",
}

export default async function NewInspectionPage() {
  // For new inspections, we'll redirect to the vehicle selection page
  // This is because the InspectionForm requires a vehicle ID and type
  return redirect("/vehicles")
} 