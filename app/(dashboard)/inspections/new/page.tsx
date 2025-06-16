import { Metadata } from "next"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/index"
import { StepBasedInspectionForm } from "@/components/inspections/step-based-inspection-form"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import Link from "next/link"
import { getDictionary } from "@/lib/i18n/server"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Create Inspection",
  description: "Create a new vehicle inspection",
}

export default async function NewInspectionPage() {
  // Initialize Supabase server client using cookies for auth
  const cookieStore = await cookies()
  const supabase = createServerClient(cookieStore)
  const { t } = await getDictionary()

  // Fetch all vehicles for selection with their groups
  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select(`
      id,
      name,
      plate_number,
      brand,
      model,
      image_url,
      year,
      vehicle_group_id,
      vehicle_groups (
        id,
        name,
        color
      )
    `)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error loading vehicles for new inspection:", error)
    // Render a simple fallback
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold mb-4">Unable to load vehicles</h1>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    )
  }

  const vehiclesData = (vehicles || []) as any // casting to match Vehicle[] type expectations

  return (
    <div className="p-4 md:p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">{t('navigation.dashboard')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/inspections">{t('navigation.inspections')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('inspections.createNewInspection')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="my-6">
        <h1 className="text-2xl font-bold tracking-tight">{t('inspections.createNewInspection')}</h1>
        <p className="text-muted-foreground">{t('inspections.createNewInspectionDescription')}</p>
      </div>
      <StepBasedInspectionForm
        vehicles={vehiclesData}
      />
    </div>
  )
} 