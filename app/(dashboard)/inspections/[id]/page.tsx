import { Metadata } from "next"
import { notFound } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { PlayCircle, ArrowLeft } from "lucide-react"

interface InspectionDetailsPageProps {
  params: {
    id: string
  }
}

interface InspectionItem {
  id: string
  category: string
  item: string
  status: string
  notes: string | null
}

interface ItemsByCategory {
  [key: string]: InspectionItem[]
}

interface Inspection {
  id: string
  status: string
  schedule_type: string
  due_date: string
  notes?: string
  vehicle: {
    name: string
    plate_number: string
  }
  inspection_items: InspectionItem[]
}

export const metadata: Metadata = {
  title: "Inspection Details",
  description: "View inspection details",
}

export default async function InspectionDetailsPage({ params }: InspectionDetailsPageProps) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: inspection } = await supabase
    .from('inspections')
    .select(`
      *,
      vehicle:vehicles (
        id,
        name,
        plate_number,
        brand,
        model
      ),
      inspection_items (
        id,
        category,
        item,
        status,
        notes
      )
    `)
    .eq('id', params.id)
    .single()

  if (!inspection) {
    return notFound()
  }

  const itemsByCategory = (inspection.inspection_items || []).reduce((acc: ItemsByCategory, item: InspectionItem) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as ItemsByCategory)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-fit -ml-2 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/inspections" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to inspections</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {inspection.vehicle.name} Inspection
              </h1>
              <p className="text-muted-foreground">
                {inspection.schedule_type.replace('_', ' ')} inspection scheduled for {formatDate(inspection.due_date)}
              </p>
            </div>

            {(inspection.status === 'scheduled' || inspection.status === 'in_progress') && (
              <Button asChild className="w-full sm:w-auto">
                <Link href={`/inspections/${inspection.id}/perform`}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {inspection.status === 'in_progress' ? 'Continue Inspection' : 'Start Inspection'}
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="font-medium">Vehicle</span>
                  <span>{inspection.vehicle.name} ({inspection.vehicle.plate_number})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Type</span>
                  <span className="capitalize">{inspection.schedule_type?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Due Date</span>
                  <span>{formatDate(inspection.due_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status</span>
                  <Badge
                    variant={
                      inspection.status === "completed"
                        ? "success"
                        : inspection.status === "in_progress"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {inspection.status}
                  </Badge>
                </div>
              </div>

              {inspection.notes && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{inspection.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {itemsByCategory && (Object.entries(itemsByCategory) as [string, InspectionItem[]][]).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.item}</span>
                        <Badge 
                          variant={item.status === "pass" ? "success" : "destructive"}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      {item.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 