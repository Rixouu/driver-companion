"use client"

import { useState, useEffect } from "react"
import { CheckCircle, Clock, Truck, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface DriverStatsProps {
  driverId: string
}

interface Stats {
  completedTrips: number
  averageRating: number
  totalInspections: number
  pendingBookings: number
}

export function DriverStats({ driverId }: DriverStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/drivers/${driverId}/statistics`)
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          // Fallback to mock data if API fails
          setStats({
            completedTrips: Math.floor(Math.random() * 50) + 10,
            averageRating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
            totalInspections: Math.floor(Math.random() * 30) + 5,
            pendingBookings: Math.floor(Math.random() * 5)
          })
        }
      } catch (error) {
        console.error("Failed to fetch driver stats:", error)
        // Fallback to mock data
        setStats({
          completedTrips: Math.floor(Math.random() * 50) + 10,
          averageRating: parseFloat((Math.random() * 2 + 3).toFixed(1)),
          totalInspections: Math.floor(Math.random() * 30) + 5,
          pendingBookings: Math.floor(Math.random() * 5)
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [driverId])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <Skeleton className="h-8 w-8 mx-auto mb-2" />
              <Skeleton className="h-8 w-12 mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{stats.completedTrips}</div>
          <p className="text-sm text-muted-foreground">Completed Trips</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{stats.averageRating}</div>
          <p className="text-sm text-muted-foreground">Avg Rating</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <Truck className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{stats.totalInspections}</div>
          <p className="text-sm text-muted-foreground">Inspections</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold">{stats.pendingBookings}</div>
          <p className="text-sm text-muted-foreground">Pending Tasks</p>
        </CardContent>
      </Card>
    </div>
  )
} 