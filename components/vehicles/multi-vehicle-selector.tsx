"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabase/client"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Car, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/i18n/context"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Vehicle {
  id: string
  name: string
  plate_number: string
  brand?: string
  model?: string
  image_url?: string
  driver_id?: string | null
}

interface MultiVehicleSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
  excludedVehicleIds?: string[]
  showAvailableOnly?: boolean
  maxHeight?: number
}

export function MultiVehicleSelector({
  value,
  onChange,
  excludedVehicleIds = [],
  showAvailableOnly = false,
  maxHeight = 400
}: MultiVehicleSelectorProps) {
  const { t } = useI18n()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadVehicles() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("vehicles")
          .select("*")
          .order("name", { ascending: true })

        if (error) throw error

        // Filter out excluded vehicles and apply showAvailableOnly filter
        let filteredData = (data as Vehicle[]) || []
        
        if (excludedVehicleIds.length > 0) {
          filteredData = filteredData.filter(
            (vehicle) => !excludedVehicleIds.includes(vehicle.id)
          )
        }
        
        if (showAvailableOnly) {
          filteredData = filteredData.filter(
            (vehicle) => !vehicle.driver_id
          )
        }

        setVehicles(filteredData)
        setFilteredVehicles(filteredData)
      } catch (error) {
        console.error("Error loading vehicles:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadVehicles()
  }, [excludedVehicleIds, showAvailableOnly])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVehicles(vehicles)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = vehicles.filter(
      (vehicle) =>
        vehicle.name.toLowerCase().includes(query) ||
        vehicle.plate_number.toLowerCase().includes(query) ||
        vehicle.brand?.toLowerCase().includes(query) ||
        vehicle.model?.toLowerCase().includes(query)
    )

    setFilteredVehicles(filtered)
  }, [searchQuery, vehicles])

  const handleToggleVehicle = (vehicleId: string) => {
    onChange(
      value.includes(vehicleId)
        ? value.filter(id => id !== vehicleId)
        : [...value, vehicleId]
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("vehicles.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-md">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-6 border rounded-md">
          <Car className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-1">
            {searchQuery
              ? t("vehicles.noVehicles")
              : t("vehicles.noAvailable")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? t("common.noResults")
              : t("vehicles.noAvailableDescription")}
          </p>
        </div>
      ) : (
        <ScrollArea className="pr-4" style={{ maxHeight: `${maxHeight}px` }}>
          <div className="space-y-3">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className={`flex items-center gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer ${
                  value.includes(vehicle.id) ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => handleToggleVehicle(vehicle.id)}
              >
                <Checkbox 
                  checked={value.includes(vehicle.id)} 
                  onCheckedChange={() => handleToggleVehicle(vehicle.id)}
                  id={vehicle.id}
                />
                {vehicle.image_url ? (
                  <div className="relative h-12 w-12 rounded-md overflow-hidden">
                    <Image
                      src={vehicle.image_url}
                      alt={vehicle.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                    <Car className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Label htmlFor={vehicle.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{vehicle.name}</div>
                  <div className="text-sm text-muted-foreground space-x-1">
                    <span>{vehicle.plate_number}</span>
                    {vehicle.brand && (
                      <>
                        <span>•</span>
                        <span>{vehicle.brand}</span>
                      </>
                    )}
                    {vehicle.model && (
                      <>
                        <span>•</span>
                        <span>{vehicle.model}</span>
                      </>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
} 