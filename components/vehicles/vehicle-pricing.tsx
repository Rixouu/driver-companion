"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { DbVehicle } from "@/types"
import { useI18n } from "@/lib/i18n/context"
import { toast } from "@/components/ui/use-toast"
import { Package, Clock, DollarSign, Filter, Search, X, Edit, Trash, Plus } from "lucide-react"

interface VehiclePricingProps {
  vehicle: DbVehicle
}

interface PricingItem {
  id: string
  service_type_name: string
  duration_hours: number
  price: number
  currency: string
  is_active: boolean
  vehicle_id: string
  category_id?: string
  service_type_id?: string
}

export function VehiclePricing({ vehicle }: VehiclePricingProps) {
  const { t } = useI18n()
  const [pricingData, setPricingData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedServiceType, setSelectedServiceType] = useState<string>('all')
  const [selectedDuration, setSelectedDuration] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<PricingItem | null>(null)
  const [editingItem, setEditingItem] = useState<Partial<PricingItem>>({})

  useEffect(() => {
    let isMounted = true
    
    async function loadPricingData() {
      if (!vehicle.id) return
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/vehicles/${vehicle.id}/pricing`)
        if (!isMounted) return
        
        if (response.ok) {
          const data = await response.json()
          setPricingData(data)
        }
      } catch (error) {
        console.error('Failed to load pricing data:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPricingData()
    
    return () => {
      isMounted = false
    }
  }, [vehicle.id])

  // Filter pricing data based on selections - optimized for performance
  const filteredPricingData = useMemo(() => {
    if (!pricingData?.grouped_items) return {}
    
    // Early return if no filters are active
    if (selectedServiceType === 'all' && selectedDuration === 'all' && selectedStatus === 'all' && !searchTerm) {
      return pricingData.grouped_items
    }
    
    // Filter the data that's already grouped by service type
    const filteredGroups: Record<string, any[]> = {}
    
    Object.entries(pricingData.grouped_items).forEach(([serviceType, items]) => {
      const itemsArray = items as any[]
      const filteredItems: any[] = []
      
      for (const item of itemsArray) {
        // Apply filters
        if (selectedServiceType !== 'all' && item.service_type_name !== selectedServiceType) {
          continue
        }
        
        if (selectedDuration !== 'all' && item.duration_hours !== parseInt(selectedDuration)) {
          continue
        }
        
        if (selectedStatus !== 'all') {
          if (selectedStatus === 'active' && !item.is_active) continue
          if (selectedStatus === 'inactive' && item.is_active) continue
        }
        
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          const serviceLower = item.service_type_name?.toLowerCase() || ''
          if (!serviceLower.includes(searchLower)) {
            continue
          }
        }
        
        filteredItems.push(item)
      }
      
      // Only include service types that have filtered items
      if (filteredItems.length > 0) {
        // Sort items within each service type by duration
        filteredItems.sort((a, b) => (a.duration_hours || 0) - (b.duration_hours || 0))
        filteredGroups[serviceType] = filteredItems
      }
    })
    
    return filteredGroups
  }, [pricingData, selectedServiceType, selectedDuration, selectedStatus, searchTerm])

  // Get unique service types and durations for filters - optimized
  const uniqueServiceTypes = useMemo(() => {
    if (!pricingData?.grouped_items) return []
    // The keys are now service type names
    return Object.keys(pricingData.grouped_items).sort()
  }, [pricingData])

  const uniqueDurations = useMemo(() => {
    if (!pricingData?.grouped_items) return []
    const durations = new Set<number>()
    Object.values(pricingData.grouped_items).forEach((items: any) => {
      for (const item of items) {
        if (item.duration_hours) durations.add(item.duration_hours)
      }
    })
    return Array.from(durations).sort((a, b) => a - b)
  }, [pricingData])

  const hasActiveFilters = useMemo(() => 
    selectedServiceType !== 'all' || selectedDuration !== 'all' || selectedStatus !== 'all' || searchTerm
  , [selectedServiceType, selectedDuration, selectedStatus, searchTerm])

  // Modal handlers - optimized with useCallback
  const handleAddPricing = useCallback((serviceType: string) => {
    setEditingItem({
      service_type_name: serviceType,
      duration_hours: 1,
      price: 0,
      currency: 'JPY',
      is_active: true,
      vehicle_id: vehicle.id
    })
    setIsAddModalOpen(true)
  }, [vehicle.id])

  const handleEditPricing = useCallback((item: PricingItem) => {
    setCurrentItem(item)
    setEditingItem({ ...item })
    setIsEditModalOpen(true)
  }, [])

  const handleDeletePricing = useCallback((item: PricingItem) => {
    setCurrentItem(item)
    setIsDeleteModalOpen(true)
  }, [])

  const handleToggleStatus = (item: PricingItem) => {
    setCurrentItem(item)
    setIsStatusModalOpen(true)
  }

  const handleSaveItem = async () => {
    try {
      if (isEditModalOpen && currentItem) {
        // Update existing item
        const response = await fetch(`/api/pricing-items/${currentItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingItem)
        })
        
        if (response.ok) {
          toast({ 
            title: "Success", 
            description: "Pricing item updated successfully", 
            variant: "default" 
          })
          setIsEditModalOpen(false)
        } else {
          throw new Error('Failed to update pricing item')
        }
      } else {
        // Create new item
        const response = await fetch('/api/pricing-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingItem)
        })
        
        if (response.ok) {
          toast({ 
            title: "Success", 
            description: "Pricing item created successfully", 
            variant: "default" 
          })
          setIsAddModalOpen(false)
        } else {
          throw new Error('Failed to create pricing item')
        }
      }
      
      // Refresh pricing data
      const updatedResponse = await fetch(`/api/vehicles/${vehicle.id}/pricing`)
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json()
        setPricingData(updatedData)
      }
      
      // Reset form
      setEditingItem({})
      setCurrentItem(null)
    } catch (error) {
      console.error('Error saving pricing item:', error)
      toast({ 
        title: "Error", 
        description: "Failed to save pricing item", 
        variant: "destructive" 
      })
    }
  }

  const handleDeleteConfirmed = async () => {
    if (!currentItem) return
    
    try {
      const response = await fetch(`/api/pricing-items/${currentItem.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        toast({ 
          title: "Success", 
          description: "Pricing item deleted successfully", 
          variant: "default" 
        })
        
        // Refresh pricing data
        const updatedResponse = await fetch(`/api/vehicles/${vehicle.id}/pricing`)
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json()
          setPricingData(updatedData)
        }
      } else {
        throw new Error('Failed to delete pricing item')
      }
    } catch (error) {
      console.error('Error deleting pricing item:', error)
      toast({ 
        title: "Error", 
        description: "Failed to delete pricing item", 
        variant: "destructive" 
      })
    } finally {
      setIsDeleteModalOpen(false)
      setCurrentItem(null)
    }
  }

  const handleStatusToggleConfirmed = async () => {
    if (!currentItem) return
    
    try {
      const newStatus = !currentItem.is_active
      const action = newStatus ? 'activate' : 'deactivate'
      
      const response = await fetch(`/api/pricing-items/${currentItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      })
      
      if (response.ok) {
        toast({ 
          title: "Success", 
          description: `Pricing item ${action}d successfully`, 
          variant: "default" 
        })
        
        // Refresh pricing data
        const updatedResponse = await fetch(`/api/vehicles/${vehicle.id}/pricing`)
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json()
          setPricingData(updatedData)
        }
      } else {
        throw new Error(`Failed to ${action} pricing item`)
      }
    } catch (error) {
      console.error('Error toggling pricing item status:', error)
      toast({ 
        title: "Error", 
        description: "Failed to update pricing item status", 
        variant: "destructive" 
      })
    } finally {
      setIsStatusModalOpen(false)
      setCurrentItem(null)
    }
  }

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
          <CardTitle className="text-base sm:text-lg">Pricing</CardTitle>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          {/* Skeleton loading for better perceived performance */}
          <div className="space-y-6">
            {/* Filter controls skeleton */}
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-muted rounded animate-pulse"></div>
              <div className="h-10 bg-muted rounded animate-pulse"></div>
            </div>
            
            {/* Service type groups skeleton */}
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
                  <div className="h-8 bg-muted rounded w-20 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="p-4 border border-border/50 rounded-lg bg-card animate-pulse">
                      <div className="space-y-3">
                        <div className="h-4 bg-muted rounded w-24"></div>
                        <div className="h-6 bg-muted rounded w-20"></div>
                        <div className="h-4 bg-muted rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!pricingData || !pricingData.grouped_items || Object.keys(pricingData.grouped_items).length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
          <div className="space-y-4">
            <div>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                Pricing
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Vehicle pricing configuration and rates
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 sm:pt-6">
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium text-lg">No pricing information available</p>
            <p className="text-sm text-muted-foreground mt-1">No pricing data available for this vehicle.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-6 bg-muted/20">
          <div className="space-y-4">
            <div>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
                Pricing
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Vehicle pricing configuration and rates
              </p>
            </div>
            
            {/* Filter and Search Controls */}
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Service Type Filter */}
              <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                <SelectTrigger className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Service Types</SelectItem>
                  {uniqueServiceTypes.map((type: string) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Duration Filter */}
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Durations</SelectItem>
                  {uniqueDurations.map((duration: number) => (
                    <SelectItem key={duration} value={String(duration)}>
                      {duration}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Additional Filters Row */}
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search service types..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedServiceType('all')
                    setSelectedDuration('all')
                    setSelectedStatus('all')
                    setSearchTerm('')
                  }}
                  className="px-3"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-4 sm:pt-6">
          {/* Filter Results Info */}
          {hasActiveFilters && (
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>
                  Showing filtered results from {Object.keys(filteredPricingData).length} service type groups
                </span>
              </div>
            </div>
          )}

          {/* Pricing Groups by Service Type */}
          <div className="space-y-8">
            {Object.entries(filteredPricingData).map(([serviceType, items]) => {
              const itemsArray = items as any[];
              return (
                <div key={serviceType} className="space-y-6">
                  {/* Service Type Header */}
                  <div className="space-y-4 pb-4 border-b border-border/50">
                    {/* Service Type Title and Badge */}
                    <div className="flex items-center space-x-2">
                      <Package className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">
                        {serviceType}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
                      >
                        {itemsArray.length} pricing option{itemsArray.length === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    
                    {/* Add Button - Full Width on Mobile */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddPricing(serviceType)}
                      className="w-full md:w-auto flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add {serviceType}
                    </Button>
                  </div>

                  {/* Service Items Grid */}
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {itemsArray.map((item: any, index: number) => (
                      <div key={index} className="p-4 sm:p-5 rounded-lg border border-border/50 bg-card hover:bg-muted/30 hover:border-border transition-colors">
                        {/* Duration Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">
                                {item.duration_hours}h
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {serviceType}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditPricing(item)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeletePricing(item)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Price Display */}
                        <div className="flex items-center gap-2 mb-4">
                          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                          <span className="text-xl sm:text-2xl font-bold text-foreground">
                            ¥{item.price?.toLocaleString() || '0'}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                          <Badge 
                            variant={item.is_active ? "default" : "secondary"}
                            className={item.is_active 
                              ? "bg-green-600 text-white border-green-700" 
                              : "bg-gray-600 text-white border-gray-700"
                            }
                          >
                            {item.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(item)}
                            className="text-xs w-full sm:w-auto"
                          >
                            {item.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          setEditingItem({})
          setCurrentItem(null)
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditModalOpen ? "Edit Pricing Item" : "Add New Pricing Item"}
            </DialogTitle>
            <DialogDescription>
              {isEditModalOpen 
                ? `Update pricing for ${currentItem?.service_type_name} - ${currentItem?.duration_hours}h`
                : "Create a new pricing item for this service type"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="service_type_name">Service Type</Label>
              <Input
                id="service_type_name"
                value={editingItem.service_type_name || ""}
                onChange={(e) => setEditingItem({ ...editingItem, service_type_name: e.target.value })}
                placeholder="Service type name"
              />
            </div>
            
            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration_hours">Duration (hours)</Label>
              <Select
                value={String(editingItem.duration_hours || 1)}
                onValueChange={(value) => setEditingItem({ ...editingItem, duration_hours: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="8">8 hours</SelectItem>
                  <SelectItem value="10">10 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">1 day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price (JPY)</Label>
              <Input
                id="price"
                type="number"
                value={editingItem.price || 0}
                onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            
            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={editingItem.is_active ?? true}
                onCheckedChange={(checked) => setEditingItem({ ...editingItem, is_active: checked === true })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddModalOpen(false)
              setIsEditModalOpen(false)
              setEditingItem({})
              setCurrentItem(null)
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem}>
              {isEditModalOpen ? "Update Item" : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pricing Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this pricing item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirmed}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Toggle Confirmation Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentItem?.is_active ? 'Deactivate' : 'Activate'} Pricing Item
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {currentItem?.is_active ? 'deactivate' : 'activate'} this pricing item?
              {currentItem?.is_active 
                ? ' Deactivated items will not be available for selection.'
                : ' Activated items will be available for selection in quotations and bookings.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusToggleConfirmed}>
              {currentItem?.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
