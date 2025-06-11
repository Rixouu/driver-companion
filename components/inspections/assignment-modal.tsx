"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"
import {
  Plus,
  Search,
  Users,
  Car,
  Edit,
  Trash2,
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

interface TemplateAssignment {
  id: string
  template_type: string
  vehicle_id?: string | null
  vehicle_group_id?: string | null
  is_active: boolean | null
  vehicle?: Vehicle | null
  vehicle_group?: VehicleGroup | null
}

interface AssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateType: string
  vehicles: Vehicle[]
  vehicleGroups: VehicleGroup[]
  assignments: TemplateAssignment[]
  onToggleAssignment: (templateType: string, vehicleId?: string, vehicleGroupId?: string) => void
  onAddVehicleGroup: () => void
  onEditVehicleGroup: (group: VehicleGroup) => void
  onDeleteVehicleGroup: (group: VehicleGroup) => void
  onManageGroupVehicles: (group: VehicleGroup) => void
}

export function AssignmentModal({
  open,
  onOpenChange,
  templateType,
  vehicles,
  vehicleGroups,
  assignments,
  onToggleAssignment,
  onAddVehicleGroup,
  onEditVehicleGroup,
  onDeleteVehicleGroup,
  onManageGroupVehicles
}: AssignmentModalProps) {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("groups")

  // Get assignments for this template
  const templateAssignments = assignments.filter(a => a.template_type === templateType)
  const assignedVehicleIds = new Set(templateAssignments.filter(a => a.vehicle_id).map(a => a.vehicle_id!))
  const assignedGroupIds = new Set(templateAssignments.filter(a => a.vehicle_group_id).map(a => a.vehicle_group_id!))

  // Filter data based on search
  const filteredVehicleGroups = vehicleGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.plate_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Reset search when tab changes
  useEffect(() => {
    setSearchQuery("")
  }, [activeTab])

  const assignedVehiclesCount = assignedVehicleIds.size
  const assignedGroupsCount = assignedGroupIds.size
  const totalAssignedVehicles = assignedVehiclesCount + vehicleGroups
    .filter(group => assignedGroupIds.has(group.id))
    .reduce((acc, group) => acc + (group.vehicle_count || 0), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('inspectionTemplates.assignment.title')} - {templateType}
          </DialogTitle>
          <DialogDescription>
            {t('inspectionTemplates.assignment.description')}
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950">
              <Users className="h-3 w-3 mr-1" />
              {assignedGroupsCount} {t('inspectionTemplates.template.groups')}
            </Badge>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
              <Car className="h-3 w-3 mr-1" />
              {assignedVehiclesCount} {t('inspectionTemplates.assignment.individualVehicles')}
            </Badge>
            <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950">
              {totalAssignedVehicles} Total Vehicles
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('inspectionTemplates.assignment.vehicleGroups')}
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              {t('inspectionTemplates.assignment.individualVehicles')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {filteredVehicleGroups.length} groups available
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddVehicleGroup}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('inspectionTemplates.assignment.addGroup')}
              </Button>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              {filteredVehicleGroups.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery 
                      ? "No groups match your search" 
                      : t('inspectionTemplates.assignment.noGroupsAvailable')
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredVehicleGroups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-background"
                          style={{ backgroundColor: group.color || '#666' }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{group.name}</div>
                          {group.description && (
                            <div className="text-xs text-muted-foreground">
                              {group.description}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {t('inspectionTemplates.groups.vehicleCount', { count: group.vehicle_count || 0 })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={assignedGroupIds.has(group.id)}
                          onCheckedChange={() => onToggleAssignment(templateType, undefined, group.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onManageGroupVehicles(group)}
                          title="Manage vehicles in group"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditVehicleGroup(group)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteVehicleGroup(group)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">
              {filteredVehicles.length} vehicles available
            </div>

            <ScrollArea className="h-[300px] pr-4">
              {filteredVehicles.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery 
                      ? "No vehicles match your search" 
                      : t('inspectionTemplates.assignment.noVehiclesAvailable')
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
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
                          {vehicle.vehicle_group && (
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
                      <Switch
                        checked={assignedVehicleIds.has(vehicle.id)}
                        onCheckedChange={() => onToggleAssignment(templateType, vehicle.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 