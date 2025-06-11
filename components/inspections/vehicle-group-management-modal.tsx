"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/context"
import { useToast } from "@/components/ui/use-toast"
import {
  Search,
  Car,
  Users,
  Check,
  X
} from "lucide-react"

interface Vehicle {
  id: string
  name: string
  plate_number: string
  brand?: string
  model?: string
  vehicle_group_id?: string | null
}

interface VehicleGroup {
  id: string
  name: string
  description?: string | null
  color?: string | null
  vehicle_count?: number
}

interface VehicleGroupManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: VehicleGroup | null
  onUpdate: () => void
}

export function VehicleGroupManagementModal({
  open,
  onOpenChange,
  group,
  onUpdate
}: VehicleGroupManagementModalProps) {
  const { t } = useI18n()
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load vehicles when modal opens
  useEffect(() => {
    if (open && group) {
      loadVehicles()
    }
  }, [open, group])

  const loadVehicles = async () => {
    if (!group) return
    
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/vehicle-groups/${group.id}/vehicles`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load vehicles')
      }

      const data = await response.json()
      
      if (data.availableVehicles && data.assignedVehicles) {
        setVehicles(data.availableVehicles)
        setSelectedVehicleIds(new Set(data.assignedVehicles.map((v: Vehicle) => v.id)))
      } else {
        // Fallback: assume data.vehicles is the old format
        const vehicles = data.vehicles || []
        setVehicles(vehicles.filter((v: Vehicle) => !v.vehicle_group_id || v.vehicle_group_id === group.id))
        setSelectedVehicleIds(new Set(vehicles.filter((v: Vehicle) => v.vehicle_group_id === group.id).map((v: Vehicle) => v.id)))
      }
    } catch (error) {
      console.error('Error loading vehicles:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load vehicles",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!group) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/vehicle-groups/${group.id}/vehicles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleIds: Array.from(selectedVehicleIds)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update vehicle assignments')
      }

      toast({
        title: t('common.success'),
        description: 'Vehicle assignments updated successfully'
      })
      
      onUpdate()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error updating vehicle assignments:', error)
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to update vehicle assignments',
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  const toggleVehicleSelection = (vehicleId: string) => {
    const newSelected = new Set(selectedVehicleIds)
    if (newSelected.has(vehicleId)) {
      newSelected.delete(vehicleId)
    } else {
      newSelected.add(vehicleId)
    }
    setSelectedVehicleIds(newSelected)
  }

  const selectAll = () => {
    setSelectedVehicleIds(new Set(vehicles.map(v => v.id)))
  }

  const deselectAll = () => {
    setSelectedVehicleIds(new Set())
  }

  // Filter vehicles based on search
  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (vehicle.brand && vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (vehicle.model && vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (!group) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Vehicles in {group.name}
          </DialogTitle>
          <DialogDescription>
            Select which vehicles should be assigned to this group
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
              <Car className="h-3 w-3 mr-1" />
              {selectedVehicleIds.size} selected
            </Badge>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
              {filteredVehicles.length} available
            </Badge>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Deselect All
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Vehicle List */}
        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? "No vehicles match your search" 
                  : "No vehicles available"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => toggleVehicleSelection(vehicle.id)}
                >
                  <Checkbox
                    checked={selectedVehicleIds.has(vehicle.id)}
                    onChange={() => toggleVehicleSelection(vehicle.id)}
                  />
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">{vehicle.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {vehicle.plate_number}
                    </div>
                    {vehicle.brand && vehicle.model && (
                      <div className="text-xs text-muted-foreground">
                        {vehicle.brand} {vehicle.model}
                      </div>
                    )}
                    {vehicle.vehicle_group_id && vehicle.vehicle_group_id !== group.id && (
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        Currently in another group
                      </div>
                    )}
                  </div>
                  {selectedVehicleIds.has(vehicle.id) && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 