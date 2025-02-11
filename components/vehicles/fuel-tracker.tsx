"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/components/providers/language-provider"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"
import { Plus } from "lucide-react"
import { format } from "date-fns"

interface FuelRecord {
  id: string
  date: Date
  liters: number
  cost: number
  mileage: number
  efficiency?: number // km/L
}

interface FuelTrackerProps {
  vehicleId: string
}

export function FuelTracker({ vehicleId }: FuelTrackerProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isAddingRecord, setIsAddingRecord] = useState(false)
  const [newRecord, setNewRecord] = useState({
    liters: 0,
    cost: 0,
    mileage: 0,
  })

  // TODO: Replace with actual API call
  const fuelRecords: FuelRecord[] = [
    {
      id: "1",
      date: new Date(),
      liters: 40,
      cost: 60,
      mileage: 12500,
      efficiency: 12.5
    },
    {
      id: "2",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      liters: 45,
      cost: 67.5,
      mileage: 12000,
      efficiency: 11.8
    },
  ]

  const handleAddRecord = async () => {
    if (!newRecord.liters || !newRecord.cost || !newRecord.mileage) {
      toast({
        title: t("errors.error"),
        description: t("vehicles.management.fuel.errors.missingFields"),
        variant: "destructive",
      })
      return
    }

    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast({
      title: t("common.success"),
      description: t("vehicles.management.fuel.recordAdded"),
    })

    setIsAddingRecord(false)
    setNewRecord({
      liters: 0,
      cost: 0,
      mileage: 0,
    })
  }

  const totalCost = fuelRecords.reduce((sum, record) => sum + record.cost, 0)
  const averageEfficiency = fuelRecords.reduce((sum, record) => sum + (record.efficiency || 0), 0) / fuelRecords.length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("vehicles.management.fuel.consumption")}</CardTitle>
          <Dialog open={isAddingRecord} onOpenChange={setIsAddingRecord}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("vehicles.management.fuel.addRecord")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("vehicles.management.fuel.addRecord")}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>{t("vehicles.management.fuel.liters")}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newRecord.liters}
                    onChange={(e) => setNewRecord({
                      ...newRecord,
                      liters: parseFloat(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("vehicles.management.fuel.cost")}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newRecord.cost}
                    onChange={(e) => setNewRecord({
                      ...newRecord,
                      cost: parseFloat(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("vehicles.management.fuel.mileage")}</Label>
                  <Input
                    type="number"
                    value={newRecord.mileage}
                    onChange={(e) => setNewRecord({
                      ...newRecord,
                      mileage: parseInt(e.target.value)
                    })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingRecord(false)}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleAddRecord}>
                  {t("common.save")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("vehicles.management.fuel.totalCost")}
              </p>
              <p className="text-2xl font-bold">
                ${totalCost.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("vehicles.management.fuel.averageEfficiency")}
              </p>
              <p className="text-2xl font-bold">
                {averageEfficiency.toFixed(1)} km/L
              </p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fuelRecords}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), "MMM d")}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="efficiency"
                  stroke="#0ea5e9"
                  name={t("vehicles.management.fuel.efficiency")}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cost"
                  stroke="#f43f5e"
                  name={t("vehicles.management.fuel.cost")}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 