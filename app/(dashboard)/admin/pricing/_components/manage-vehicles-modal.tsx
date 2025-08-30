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

interface VehicleInfo {
  id: string
  name: string
  brand: string
  model: string
  year: string
  status: string
  vehicle_category_id: string
}

interface PricingCategory {
  id: string
  name: string
  description?: string | null
}

interface ManageVehiclesModalProps {
  open: boolean
  onClose: () => void
  category: PricingCategory
  vehicles: VehicleInfo[]
  setVehicles: (vehicles: VehicleInfo[]) => void
  getVehiclesForCategory: (categoryId: string) => VehicleInfo[]
  refreshItems: () => void
}

export function ManageVehiclesModal({
  open,
  onClose,
  category,
  vehicles,
  setVehicles,
  getVehiclesForCategory,
  refreshItems
}: ManageVehiclesModalProps) {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  // Split vehicles into current category and available
  const vehiclesInCategory = getVehiclesForCategory(category.id)
  const availableVehicles = vehicles.filter(v => v.vehicle_category_id !== category.id)

  // Filter based on search
  const filteredVehiclesInCategory = vehiclesInCategory.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredAvailableVehicles = availableVehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleSelectAll = (vehicles: VehicleInfo[], select: boolean) => {
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
      // Insert into junction table instead of updating vehicles table
      const { error } = await supabase
        .from('pricing_category_vehicles')
        .insert(
          vehiclesToAdd.map(vehicleId => ({
            category_id: category.id,
            vehicle_id: vehicleId
          }))
        )

      if (error) throw error

      toast({
        title: t('common.success'),
        description: `Added ${vehiclesToAdd.length} vehicles to ${category.name}`
      })

      setSelectedVehicleIds(new Set())
      refreshItems()
      onClose()
    } catch (error: any) {
      console.error('Error adding vehicles to category:', error)
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to add vehicles to category',
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  const handleRemoveVehicles = async () => {
    const vehiclesToRemove = Array.from(selectedVehicleIds).filter(id =>
      vehiclesInCategory.some(v => v.id === id)
    )

    if (vehiclesToRemove.length === 0) return

    setIsSubmitting(true)
    try {
      // Delete from junction table instead of updating vehicles table
      const { error } = await supabase
        .from('pricing_category_vehicles')
        .delete()
        .eq('category_id', category.id)
        .in('vehicle_id', vehiclesToRemove)

      if (error) throw error

      toast({
        title: t('common.success'),
        description: `Removed ${vehiclesToRemove.length} vehicles from ${category.name}`
      })

      setSelectedVehicleIds(new Set())
      refreshItems()
      onClose()
    } catch (error: any) {
      console.error('Error removing vehicles from category:', error)
      toast({
        title: t('common.error'),
        description: error.message || 'Failed to remove vehicles from category',
        variant: "destructive"
      })
    }
    setIsSubmitting(false)
  }

  const VehicleList = ({ vehicles, title, emptyMessage, actionButton }: {
    vehicles: VehicleInfo[]
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
                  <div className="text-xs text-muted-foreground">{vehicle.brand} {vehicle.model}</div>
                  <div className="text-xs text-muted-foreground">Year: {vehicle.year}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )

  const selectedInCategory = Array.from(selectedVehicleIds).filter(id =>
    vehiclesInCategory.some(v => v.id === id)
  ).length

  const selectedAvailable = Array.from(selectedVehicleIds).filter(id =>
    availableVehicles.some(v => v.id === id)
  ).length

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Vehicles for {category.name}
          </DialogTitle>
          <DialogDescription>
            Link or unlink vehicles from this category.
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium">{category.name}</span>
          </div>
          <Badge variant="outline">
            {filteredVehiclesInCategory.length} vehicles in category
          </Badge>
          <Badge variant="outline">
            {filteredAvailableVehicles.length} available vehicles
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search vehicles by name, brand, model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Vehicles */}
          <VehicleList
            vehicles={filteredVehiclesInCategory}
            title={`Selected Vehicles (${filteredVehiclesInCategory.length} selected)`}
            emptyMessage="No vehicles in this category"
            actionButton={selectedInCategory > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveVehicles}
                disabled={isSubmitting}
                className="text-destructive hover:text-destructive"
              >
                <Minus className="h-4 w-4 mr-1" />
                Remove ({selectedInCategory})
              </Button>
            )}
          />

          {/* Available Vehicles */}
          <VehicleList
            vehicles={filteredAvailableVehicles}
            title="Available Vehicles"
            emptyMessage="No available vehicles"
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
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
