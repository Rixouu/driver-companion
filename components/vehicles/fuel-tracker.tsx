"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { FuelEntry } from "@/types/vehicles"

interface FuelTrackerProps {
  vehicleId: string
  fuelHistory: FuelEntry[]
  onAddEntry: (entry: Omit<FuelEntry, "id" | "vehicle_id">) => Promise<void>
}

export function FuelTracker({
  vehicleId,
  fuelHistory,
  onAddEntry,
}: FuelTrackerProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await onAddEntry({
        date: new Date().toISOString(),
        liters: Number(formData.get("liters")),
        cost: Number(formData.get("cost")),
        mileage: Number(formData.get("mileage")),
      })

      toast({
        title: "vehicles.fuel.success",
        description: "vehicles.fuel.successDescription",
      })
      setIsOpen(false)
    } catch (error) {
      toast({
        title: "vehicles.fuel.error",
        description: "vehicles.fuel.errorDescription",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{"vehicles.fuel.title"}</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              {"vehicles.fuel.addEntry"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{"vehicles.fuel.addEntry"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="liters">{"vehicles.fuel.liters"}</Label>
                <Input
                  id="liters"
                  name="liters"
                  type="number"
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">{"vehicles.fuel.cost"}</Label>
                <Input
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mileage">{"vehicles.fuel.mileage"}</Label>
                <Input
                  id="mileage"
                  name="mileage"
                  type="number"
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "common.saving" : "common.save"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fuelHistory}>
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="liters"
                stroke="#2563eb"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 