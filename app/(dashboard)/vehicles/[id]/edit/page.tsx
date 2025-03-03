import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { VehicleForm } from "@/components/vehicles/vehicle-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getDictionary } from "@/lib/i18n/server"

interface EditVehiclePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EditVehiclePageProps): Promise<Metadata> {
  const dictionary = await getDictionary()
  
  return {
    title: dictionary.vehicles.edit.title,
    description: dictionary.vehicles.edit.description,
  }
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
  const supabase = createServerComponentClient({ cookies })
  const dictionary = await getDictionary()
  
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!vehicle) {
    return notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
              asChild
            >
              <Link href={`/vehicles/${params.id}`} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{dictionary.common.backTo.replace('{page}', dictionary.vehicles.details || 'vehicle details')}</span>
                <span className="sm:hidden">{dictionary.common.back}</span>
              </Link>
            </Button>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {dictionary.vehicles.edit.title}
            </h1>
            <p className="text-muted-foreground">
              {dictionary.vehicles.edit.description}
            </p>
          </div>
        </div>

        <VehicleForm vehicle={vehicle} />
      </div>
    </div>
  )
} 