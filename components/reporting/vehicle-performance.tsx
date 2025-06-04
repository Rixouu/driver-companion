import { useEffect, useState } from "react"
// import { supabase } from "@/lib/supabase"; // No longer needed for fetching
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { DateRange } from "react-day-picker"
import { addMonths, addDays, format, startOfDay, endOfDay } from "date-fns"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, SortAsc, SortDesc } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n/context"
import { VehiclePerformanceDataPoint } from "@/app/(dashboard)/reporting/page"; // Import shared type

// Exchange rate: 1 USD = approximately 150 JPY (as of 2023) - This might be needed if currency conversion is done client-side for display
const USD_TO_JPY_RATE = 150;

// interface VehiclePerformanceData { // Use VehiclePerformanceDataPoint from server page
//   id: string
//   name: string
//   brand: string
//   utilization: number
//   distance: number
//   fuelUsed: number
//   efficiency: number
//   costPerKm: number
// }

interface VehiclePerformanceProps {
  dateRange: DateRange | undefined // Keep for potential client-side interactions if any
  initialData?: VehiclePerformanceDataPoint[] // New prop for server-fetched data
}

// interface MileageEntry { // Not needed if data is processed on server
//   reading: number | string
//   date: string
// }

export function VehiclePerformance({ dateRange, initialData }: VehiclePerformanceProps) {
  const { t, language } = useI18n()
  const [vehicles, setVehicles] = useState<VehiclePerformanceDataPoint[]>(initialData || [])
  const [filteredVehicles, setFilteredVehicles] = useState<VehiclePerformanceDataPoint[]>(initialData || [])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [brandFilter, setBrandFilter] = useState<string>("all")
  const [availableBrands, setAvailableBrands] = useState<string[]>([])

  useEffect(() => {
    // Set vehicles from prop and derive available brands
    const currentData = initialData || [];
    setVehicles(currentData);
    setFilteredVehicles(currentData); // Initialize filteredVehicles as well
    if (currentData.length > 0) {
      const brands = [...new Set(currentData.map(vehicle => vehicle.brand))].sort();
      setAvailableBrands(brands);
    } else {
      setAvailableBrands([]);
    }
  }, [initialData]);

  // Apply filters and sorting whenever the source data or filter criteria change
  useEffect(() => {
    let result = [...vehicles]
    
    // Apply brand filter
    if (brandFilter !== "all") {
      result = result.filter(vehicle => vehicle.brand === brandFilter)
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(vehicle => 
        vehicle.name.toLowerCase().includes(query) || 
        vehicle.brand.toLowerCase().includes(query)
      )
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "brand":
          comparison = a.brand.localeCompare(b.brand)
          break
        case "utilization":
          comparison = a.utilization - b.utilization
          break
        case "distance":
          comparison = a.distance - b.distance
          break
        case "fuelUsed":
          comparison = a.fuelUsed - b.fuelUsed
          break
        case "efficiency":
          comparison = a.efficiency - b.efficiency
          break
        case "costPerKm":
          comparison = a.costPerKm - b.costPerKm
          break
        default:
          comparison = 0
      }
      
      return sortDirection === "asc" ? comparison : -comparison
    })
    
    setFilteredVehicles(result)
  }, [vehicles, searchQuery, sortField, sortDirection, brandFilter])

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc")
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      toggleSortDirection()
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get the currency symbol based on language
  const currencySymbol = language === 'ja' ? '¥' : '$';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('reporting.sections.vehiclePerformance.search')}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('reporting.sections.vehiclePerformance.filterByBrand')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('reporting.sections.vehiclePerformance.allBrands')}</SelectItem>
              {availableBrands.map(brand => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleSortDirection}
            title={`Sort ${sortDirection === "asc" ? "Ascending" : "Descending"}`}
          >
            {sortDirection === "asc" ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Desktop Table View - Hidden on Mobile */}
      <div className="hidden sm:block overflow-x-auto">
        <div className="min-w-[700px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                  {t('reporting.sections.vehiclePerformance.vehicle')} {sortField === "name" && (
                    sortDirection === "asc" ? "↑" : "↓"
                  )}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("utilization")}>
                  {t('reporting.sections.vehiclePerformance.utilization')} {sortField === "utilization" && (
                    sortDirection === "asc" ? "↑" : "↓"
                  )}
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("distance")}>
                  {t('reporting.sections.vehiclePerformance.distance')} {sortField === "distance" && (
                    sortDirection === "asc" ? "↑" : "↓"
                  )}
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("fuelUsed")}>
                  {t('reporting.sections.vehiclePerformance.fuelUsed')} {sortField === "fuelUsed" && (
                    sortDirection === "asc" ? "↑" : "↓"
                  )}
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("efficiency")}>
                  {t('reporting.sections.vehiclePerformance.efficiency')} {sortField === "efficiency" && (
                    sortDirection === "asc" ? "↑" : "↓"
                  )}
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("costPerKm")}>
                  {t('reporting.sections.vehiclePerformance.costPerKm')} {sortField === "costPerKm" && (
                    sortDirection === "asc" ? "↑" : "↓"
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">
                      {vehicle.name}
                      <span className="text-muted-foreground ml-1">
                        ({vehicle.brand})
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={vehicle.utilization} className="w-[60px]" />
                        <span className="text-muted-foreground">
                          {Math.round(vehicle.utilization)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(vehicle.distance).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.round(vehicle.fuelUsed).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {vehicle.efficiency.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      {currencySymbol}{vehicle.costPerKm.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {t('reporting.sections.vehiclePerformance.noVehiclesFound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {filteredVehicles.length > 0 ? (
          filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{vehicle.name}</CardTitle>
                <CardDescription>{vehicle.brand}</CardDescription>
              </CardHeader>
              <CardContent className="pb-3 pt-0">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t('reporting.sections.vehiclePerformance.utilization')}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={vehicle.utilization} className="w-[60px]" />
                      <span className="text-sm font-medium">
                        {Math.round(vehicle.utilization)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t('reporting.sections.vehiclePerformance.distance')}</p>
                    <p className="text-sm font-medium">{Math.round(vehicle.distance).toLocaleString()} km</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t('reporting.sections.vehiclePerformance.fuelUsed')}</p>
                    <p className="text-sm font-medium">{Math.round(vehicle.fuelUsed).toLocaleString()} L</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{t('reporting.sections.vehiclePerformance.efficiency')}</p>
                    <p className="text-sm font-medium">{vehicle.efficiency.toFixed(1)} km/L</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground">{t('reporting.sections.vehiclePerformance.costPerKm')}</p>
                    <p className="text-sm font-medium">{currencySymbol}{vehicle.costPerKm.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            {t('reporting.sections.vehiclePerformance.noVehiclesFound')}
          </div>
        )}
      </div>
    </div>
  )
} 