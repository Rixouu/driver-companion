import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export const metadata: Metadata = {
  title: "New Inspection",
  description: "Create a new vehicle inspection",
}

export default async function NewInspectionPage() {
  // Redirect to the create inspection page
  return redirect("/inspections/create")
} 