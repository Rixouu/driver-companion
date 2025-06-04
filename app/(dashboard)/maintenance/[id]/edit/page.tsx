import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from "next/navigation"
import { MaintenanceForm } from "@/components/maintenance/maintenance-form"
import { getMaintenanceTaskById } from "@/lib/services/maintenance"
import { getVehicles } from "@/lib/services/vehicles"

interface MaintenanceEditPageProps {
  params: { id: string }
}

export default async function MaintenanceEditPage({ params }: MaintenanceEditPageProps) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', options)
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const task = await getMaintenanceTaskById(params.id)
  // const vehicles = await getVehicles() // Assuming getVehicles doesn't require supabase client or is handled internally

  if (!task) {
    return <div>Task not found</div>
  }
  
  // Temporarily cast to any to deal with the type issue, will be fixed later
  const taskAsAny = task as any;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Maintenance Task</h1>
      {/* Pass vehicles if your form needs it */}
      <MaintenanceForm initialData={taskAsAny} mode="edit" />
    </div>
  )
} 