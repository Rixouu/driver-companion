"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useI18n } from "@/lib/i18n/context"
import { createClient } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import {
  Search,
  Car,
  Users,
  Plus,
  Minus
} from "lucide-react"

interface Vehicle {
  id: string
  name: string
  plate_number: string
  brand?: string
  model?: string
  vehicle_group_id?: string | null
  vehicle_group?: {
    id: string
    name: string
    color?: string | null
  } | null
}

interface VehicleGroup {
  id: string
  name: string
  description?: string | null
  color?: string | null
  vehicle_count?: number
}

interface ManageVehiclesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicleGroup: VehicleGroup | null
  allVehicles: Vehicle[]
  onVehiclesUpdated: () => void
}

export function ManageVehiclesModal({
  open,
  onOpenChange,
  vehicleGroup,
  allVehicles,
  onVehiclesUpdated
}: ManageVehiclesModalProps) {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  if (!vehicleGroup) return null

  // Split vehicles into current group and available
  const vehiclesInGroup = allVehicles.filter(v => v.vehicle_group_id === vehicleGroup.id)
  const availableVehicles = allVehicles.filter(v => v.vehicle_group_id !== vehicleGroup.id)

  // Filter based on search
  const filteredVehiclesInGroup = vehiclesInGroup.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.plate_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredAvailableVehicles = availableVehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.plate_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleVehicleSelection = (vehicleId: string, checked: boolean) => {
    const newSelected = new Set(selectedVehicleIds)
    if (checked) {
      newSelected.add(vehicleId)
    } else {
      newSelected.delete(vehicleId)
    }
    setSelectedVehicleIds(newSelected)
  }

  const handleSelectAll = (vehicles: Vehicle[], select: boolean) => {
    const newSelected = new Set(selectedVehicleIds)
    vehicles.forEach(vehicle => {
      if (select) {
        newSelected.add(vehicle.id)
      } else {
        newSelected.delete(vehicle.id)
      }
    })
    setSelectedVehicleIds(newSelected)
  }

  const handleAddVehicles = async () => {
    const vehiclesToAdd = Array.from(selectedVehicleIds).filter(id =>
      availableVehicles.some(v => v.id === id)
    )

    if (vehiclesToAdd.length === 0) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ vehicle_group_id: vehicleGroup.id })
        .in('id', vehiclesToAdd)

      if (error) throw error

      toast({
        title: t('common.success'),
        description: t('inspectionTemplates.messages.vehiclesAdded', { count: vehiclesToAdd.length })
      })

      setSelectedVehicleIds(new Set())
      onVehiclesUpdated()
    } catch (error: any) {
      console.error('Error adding vehicles to group:', error)
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to add vehicles to group',
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  const handleRemoveVehicles = async () => {
    const vehiclesToRemove = Array.from(selectedVehicleIds).filter(id =>
      vehiclesInGroup.some(v => v.id === id)
    )

    if (vehiclesToRemove.length === 0) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ vehicle_group_id: null })
        .in('id', vehiclesToRemove)

      if (error) throw error

      toast({
        title: t('common.success'),
        description: t('inspectionTemplates.messages.vehiclesRemoved', { count: vehiclesToRemove.length })
      })

      setSelectedVehicleIds(new Set())
      onVehiclesUpdated()
    } catch (error: any) {
      console.error('Error removing vehicles from group:', error)
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to remove vehicles from group',
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  const VehicleList = ({ vehicles, title, emptyMessage, actionButton }: {
    vehicles: Vehicle[]
    title: string
    emptyMessage: string
    actionButton?: React.ReactNode
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{title}</h4>
        <div className="flex items-center gap-2">
          {vehicles.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(vehicles, true)}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectAll(vehicles, false)}
              >
                Deselect All
              </Button>
            </>
          )}
          {actionButton}
        </div>
      </div>

      <ScrollArea className="h-48 border rounded-lg">
        {vehicles.length === 0 ? (
          <div className="text-center py-8">
            <Car className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedVehicleIds.has(vehicle.id)}
                  onCheckedChange={(checked) => handleVehicleSelection(vehicle.id, checked as boolean)}
                />
                <Car className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium text-sm">{vehicle.name}</div>
                  <div className="text-xs text-muted-foreground">{vehicle.plate_number}</div>
                  {vehicle.brand && vehicle.model && (
                    <div className="text-xs text-muted-foreground">
                      {vehicle.brand} {vehicle.model}
                    </div>
                  )}
                  {vehicle.vehicle_group && vehicle.vehicle_group.id !== vehicleGroup.id && (
                    <div className="flex items-center gap-1 mt-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: vehicle.vehicle_group.color || '#666' }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {vehicle.vehicle_group.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )

  const selectedInGroup = Array.from(selectedVehicleIds).filter(id =>
    vehiclesInGroup.some(v => v.id === id)
  ).length

  const selectedAvailable = Array.from(selectedVehicleIds).filter(id =>
    availableVehicles.some(v => v.id === id)
  ).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('inspectionTemplates.dialogs.manageVehicles.title', { groupName: vehicleGroup.name })}
          </DialogTitle>
          <DialogDescription>
            {t('inspectionTemplates.dialogs.manageVehicles.description')}
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 border-background"
              style={{ backgroundColor: vehicleGroup.color || '#666' }}
            />
            <span className="font-medium">{vehicleGroup.name}</span>
          </div>
          <Badge variant="outline">
            {filteredVehiclesInGroup.length} vehicles in group
          </Badge>
          <Badge variant="outline">
            {filteredAvailableVehicles.length} available vehicles
          </Badge>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Vehicles */}
          <VehicleList
            vehicles={filteredVehiclesInGroup}
            title={t('inspectionTemplates.dialogs.manageVehicles.currentVehicles', { count: filteredVehiclesInGroup.length })}
            emptyMessage={t('inspectionTemplates.dialogs.manageVehicles.noCurrentVehicles')}
            actionButton={selectedInGroup > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveVehicles}
                disabled={isSubmitting}
                className="text-destructive hover:text-destructive"
              >
                <Minus className="h-4 w-4 mr-1" />
                Remove ({selectedInGroup})
              </Button>
            )}
          />

          {/* Available Vehicles */}
          <VehicleList
            vehicles={filteredAvailableVehicles}
            title={t('inspectionTemplates.dialogs.manageVehicles.availableVehicles')}
            emptyMessage={t('inspectionTemplates.dialogs.manageVehicles.noAvailableVehicles')}
            actionButton={selectedAvailable > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddVehicles}
                disabled={isSubmitting}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add ({selectedAvailable})
              </Button>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 