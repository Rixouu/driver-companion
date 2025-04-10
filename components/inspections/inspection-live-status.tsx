"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRealtimeData } from "@/hooks/use-realtime-data"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle, Clock, AlertTriangle, User, ArrowUpCircle } from "lucide-react"

interface Inspection {
  id: string
  status: string
  updated_at: string
  assigned_to?: string
  user_display_name?: string
  user_avatar_url?: string
  vehicle_id: string
  vehicle_name?: string
  template_name?: string
}

/**
 * Component that displays real-time updates for an inspection
 */
export function InspectionLiveStatus({ inspectionId }: { inspectionId: string }) {
  const { toast } = useToast()
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  // Use our real-time data hook to subscribe to inspection changes
  const { 
    data: inspection, 
    isLoading, 
    error 
  } = useRealtimeData<Inspection>({
    table: "inspections",
    filter: `id=eq.${inspectionId}`,
    initialFetch: true,
    onDataChange: (newData, oldData, event) => {
      // Show a toast notification when the inspection is updated
      if (event === "UPDATE" && oldData?.status !== newData.status) {
        toast({
          title: "Inspection Updated",
          description: `Status changed from ${oldData?.status || "unknown"} to ${newData.status}`,
        })
      }
      
      // Update the last update timestamp
      setLastUpdate(new Date())
    }
  })
  
  // Status badge color mapping
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: React.ReactNode }> = {
      "in_progress": { 
        color: "bg-blue-500 hover:bg-blue-600", 
        icon: <Clock className="h-3 w-3 mr-1" /> 
      },
      "completed": { 
        color: "bg-green-500 hover:bg-green-600", 
        icon: <CheckCircle className="h-3 w-3 mr-1" /> 
      },
      "pending": { 
        color: "bg-yellow-500 hover:bg-yellow-600", 
        icon: <AlertTriangle className="h-3 w-3 mr-1" /> 
      },
      "failed": { 
        color: "bg-red-500 hover:bg-red-600", 
        icon: <AlertTriangle className="h-3 w-3 mr-1" /> 
      },
    }
    
    const { color, icon } = statusMap[status] || { 
      color: "bg-gray-500 hover:bg-gray-600", 
      icon: <Clock className="h-3 w-3 mr-1" /> 
    }
    
    return (
      <Badge className={`${color} text-white flex items-center`}>
        {icon}
        {status.replace("_", " ")}
      </Badge>
    )
  }
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm">Loading inspection status...</CardTitle>
        </CardHeader>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardHeader>
          <CardTitle className="text-sm text-red-600">
            Error loading inspection status
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }
  
  if (!inspection) {
    return (
      <Card className="w-full border-yellow-200">
        <CardHeader>
          <CardTitle className="text-sm">Inspection not found</CardTitle>
        </CardHeader>
      </Card>
    )
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            Live Inspection Status
          </CardTitle>
          {getStatusBadge(inspection.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Template:</span>
            <span className="font-medium">{inspection.template_name || "Custom Inspection"}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Vehicle:</span>
            <span className="font-medium">{inspection.vehicle_name || inspection.vehicle_id}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Assigned to:</span>
            <div className="flex items-center">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={inspection.user_avatar_url} />
                <AvatarFallback>
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{inspection.user_display_name || "Unassigned"}</span>
            </div>
          </div>
          
          {lastUpdate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last update:</span>
              <div className="flex items-center text-green-600">
                <ArrowUpCircle className="h-3 w-3 mr-1" />
                <span className="font-medium">{formatDistanceToNow(lastUpdate, { addSuffix: true })}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 