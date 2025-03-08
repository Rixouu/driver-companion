import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Car } from "lucide-react"

interface VehiclePerformance {
  id: string
  name: string
  brand: string
  utilization: number
  distance: number
  fuel_used: number
  efficiency: number
  cost_per_km: number
}

export function VehiclePerformanceTable() {
  const [vehicles, setVehicles] = useState<VehiclePerformance[]>([])

  useEffect(() => {
    async function fetchVehiclePerformance() {
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select(`
          id,
          name,
          brand,
          maintenance_tasks (
            cost
          ),
          fuel_logs (
            fuel_amount,
            fuel_cost
          ),
          mileage_logs (
            distance
          )
        `)

      if (vehiclesError) {
        console.error('Error fetching vehicle performance:', vehiclesError)
        return
      }

      const performanceData = vehiclesData.map(vehicle => {
        const totalDistance = vehicle.mileage_logs?.reduce((sum, log) => sum + (log.distance || 0), 0) || 0
        const totalFuel = vehicle.fuel_logs?.reduce((sum, log) => sum + (log.fuel_amount || 0), 0) || 0
        const totalCost = (vehicle.maintenance_tasks?.reduce((sum, task) => sum + (task.cost || 0), 0) || 0) +
          (vehicle.fuel_logs?.reduce((sum, log) => sum + (log.fuel_cost || 0), 0) || 0)
        
        const efficiency = totalFuel > 0 ? totalDistance / totalFuel : 0
        const costPerKm = totalDistance > 0 ? totalCost / totalDistance : 0
        
        // Calculate utilization (simplified - could be enhanced with more detailed logic)
        const utilization = Math.random() * 30 + 60 // Placeholder: 60-90% range

        return {
          id: vehicle.id,
          name: vehicle.name,
          brand: vehicle.brand,
          utilization,
          distance: totalDistance,
          fuel_used: totalFuel,
          efficiency,
          cost_per_km: costPerKm
        }
      })

      setVehicles(performanceData)
    }

    fetchVehiclePerformance()
  }, [])

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-zinc-400 border-b border-zinc-800">
            <th className="text-left py-3 px-4">Vehicle</th>
            <th className="text-left py-3 px-4">Utilization</th>
            <th className="text-left py-3 px-4">Distance</th>
            <th className="text-left py-3 px-4">Fuel Used</th>
            <th className="text-left py-3 px-4">Efficiency</th>
            <th className="text-left py-3 px-4">Cost/km</th>
            <th className="text-left py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map(vehicle => (
            <tr key={vehicle.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium">{vehicle.name}</div>
                    <div className="text-sm text-zinc-400">{vehicle.brand}</div>
                  </div>
                </div>
              </td>
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${vehicle.utilization}%` }}
                    />
                  </div>
                  <span>{Math.round(vehicle.utilization)}%</span>
                </div>
              </td>
              <td className="py-4 px-4">{Math.round(vehicle.distance).toLocaleString()} km</td>
              <td className="py-4 px-4">{Math.round(vehicle.fuel_used).toLocaleString()} L</td>
              <td className="py-4 px-4">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  vehicle.efficiency > 8 ? 'bg-green-500/20 text-green-500' :
                  vehicle.efficiency > 6 ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {vehicle.efficiency.toFixed(1)} km/L
                </span>
              </td>
              <td className="py-4 px-4">${vehicle.cost_per_km.toFixed(2)}</td>
              <td className="py-4 px-4">
                <button className="text-zinc-400 hover:text-white">•••</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 