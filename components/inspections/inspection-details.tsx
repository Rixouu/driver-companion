"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase/client"
import { format } from "date-fns"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { Check, X } from "lucide-react"
import { InspectionDetails as InspectionDetailsType, InspectionResult } from "@/types/inspections"
import { Image as NextImage } from "@/components/shared/image"

interface InspectionDetailsProps {
  inspectionId: string
}

export function InspectionDetails({ inspectionId }: InspectionDetailsProps) {
  const [inspection, setInspection] = useState<InspectionDetailsType | null>(null)
  const [results, setResults] = useState<InspectionResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!inspectionId) return
    fetchInspectionDetails()
  }, [inspectionId])

  const fetchInspectionDetails = async () => {
    try {
      console.log('Fetching inspection details for ID:', inspectionId)

      // Fetch inspection details using the view
      const { data: inspectionData, error: inspectionError } = await supabase
        .from('inspection_details')
        .select('*')
        .eq('id', inspectionId)
        .single()

      if (inspectionError) {
        console.error('Inspection fetch error:', inspectionError)
        throw inspectionError
      }

      setInspection(inspectionData)

      // Fetch inspection results
      const { data: resultsData, error: resultsError } = await supabase
        .from('inspection_results')
        .select(`
          id,
          status,
          notes,
          item:inspection_items(
            id,
            category,
            item
          ),
          photos:inspection_photos(
            id,
            photo_url
          )
        `)
        .eq('inspection_id', inspectionId)

      if (resultsError) {
        console.error('Results fetch error:', resultsError)
        throw resultsError
      }

      console.log('Fetched results:', resultsData)

      setResults(resultsData as unknown as InspectionResult[])
    } catch (error: any) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load inspection details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!inspection) {
    return <div>Inspection not found</div>
  }

  // Group results by category
  const resultsByCategory = results.reduce((acc, result) => {
    const category = result.item.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(result)
    return acc
  }, {} as Record<string, InspectionResult[]>)

  return (
    <div className="space-y-6">
      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium">Vehicle</p>
            <p className="text-sm text-muted-foreground">
              {inspection.vehicle_name} ({inspection.plate_number})
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Model</p>
            <p className="text-sm text-muted-foreground">
              {inspection.model} {inspection.year}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Inspection Information */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium">Date</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(inspection.date), 'PPP')}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Status</p>
            <Badge variant={inspection.status === 'completed' ? 'success' : 'secondary'}>
              {inspection.status}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium">Inspector</p>
            <p className="text-sm text-muted-foreground">
              {inspection.inspector_name || 'Not assigned'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Inspection Results */}
      {Object.keys(resultsByCategory).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Inspection Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={Object.keys(resultsByCategory)[0]}>
              <TabsList className="grid grid-cols-5 w-full">
                {Object.keys(resultsByCategory).map(category => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(resultsByCategory).map(([category, items]) => (
                <TabsContent key={category} value={category}>
                  <div className="space-y-4">
                    {items.map(result => (
                      <div key={result.id} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.item.item}</span>
                          <Badge variant={result.status === 'pass' ? 'success' : 'destructive'}>
                            {result.status === 'pass' ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Badge>
                        </div>
                        
                        {result.notes && (
                          <div className="text-sm text-muted-foreground">
                            {result.notes}
                          </div>
                        )}

                        {result.photos && result.photos.length > 0 && (
                          <div className="grid grid-cols-4 gap-2">
                            {result.photos.map((photo, index) => (
                              <div key={photo.id} className="relative aspect-square">
                                <NextImage
                                  src={photo.photo_url}
                                  alt={`Photo ${index + 1}`}
                                  fill
                                  className="object-cover rounded-md"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            No inspection results found
          </CardContent>
        </Card>
      )}
    </div>
  )
} 