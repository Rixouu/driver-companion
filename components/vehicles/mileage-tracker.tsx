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
  ResponsiveContainer,
} from "recharts"
import { format, subDays } from "date-fns"
import { Plus } from "lucide-react"
import { MileageAlerts } from "./mileage-alerts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { MileageGoals } from "./mileage-goals"
import { BarChart, Bar } from "recharts"
import { MaintenanceCostAnalysis } from "./maintenance-cost-analysis"

interface MileageRecord {
  id: string
  date: Date
  reading: number
  notes?: string
  distance?: number
  averageSpeed?: number
  fuelEfficiency?: number
}

interface MileageTrackerProps {
  vehicleId: string
}

export function MileageTracker({ vehicleId }: MileageTrackerProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isAddingRecord, setIsAddingRecord] = useState(false)
  const [newReading, setNewReading] = useState({
    reading: 0,
    notes: "",
  })

  // TODO: Replace with actual API call
  const mileageRecords: MileageRecord[] = [
    {
      id: "1",
      date: new Date(),
      reading: 12500,
      notes: "Regular update",
    },
    {
      id: "2",
      date: subDays(new Date(), 7),
      reading: 12000,
      notes: "After maintenance",
    },
    {
      id: "3",
      date: subDays(new Date(), 14),
      reading: 11500,
      notes: "Weekly check",
    },
  ]

  function calculateDailyAverage(records: MileageRecord[]): number {
    if (records.length < 2) return 0
    const latest = records[0]
    const oldest = records[records.length - 1]
    const daysDiff = (latest.date.getTime() - oldest.date.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff > 0 ? (latest.reading - oldest.reading) / daysDiff : 0
  }

  function calculateMonthlyAverage(dailyAverage: number): number {
    return dailyAverage * 30
  }

  // Calculate statistics
  const dailyAverage = calculateDailyAverage(mileageRecords)
  const stats = {
    current: mileageRecords[0]?.reading || 0,
    daily: dailyAverage,
    monthly: calculateMonthlyAverage(dailyAverage),
    lastUpdate: mileageRecords[0]?.date || new Date(),
  }

  const handleAddReading = async () => {
    if (!newReading.reading) {
      toast({
        title: t("errors.error"),
        description: t("vehicles.management.mileage.errors.invalidReading"),
        variant: "destructive",
      })
      return
    }

    if (newReading.reading <= stats.current) {
      toast({
        title: t("errors.error"),
        description: t("vehicles.management.mileage.errors.readingTooLow"),
        variant: "destructive",
      })
      return
    }

    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast({
      title: t("common.success"),
      description: t("vehicles.management.mileage.updated"),
    })

    setIsAddingRecord(false)
    setNewReading({ reading: 0, notes: "" })
  }

  const calculateDistances = (records: MileageRecord[]): MileageRecord[] => {
    return records.map((record, index, array) => {
      if (index === array.length - 1) return record
      const nextRecord = array[index + 1]
      return {
        ...record,
        distance: record.reading - nextRecord.reading,
      }
    })
  }

  const recordsWithDistances = calculateDistances(mileageRecords)

  return (
    <div className="space-y-6">
      <MileageAlerts 
        vehicleId={vehicleId} 
        currentMileage={stats.current} 
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            {t("vehicles.management.mileage.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="history">
            {t("vehicles.management.mileage.tabs.history")}
          </TabsTrigger>
          <TabsTrigger value="analysis">
            {t("vehicles.management.mileage.tabs.analysis")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("vehicles.management.mileage.title")}</CardTitle>
              <Dialog open={isAddingRecord} onOpenChange={setIsAddingRecord}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("vehicles.management.mileage.update")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("vehicles.management.mileage.update")}</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>{t("vehicles.management.mileage.reading")}</Label>
                      <Input
                        type="number"
                        value={newReading.reading}
                        onChange={(e) => setNewReading({
                          ...newReading,
                          reading: parseInt(e.target.value)
                        })}
                        min={stats.current}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("vehicles.management.mileage.notes")}</Label>
                      <Input
                        value={newReading.notes}
                        onChange={(e) => setNewReading({
                          ...newReading,
                          notes: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingRecord(false)}>
                      {t("common.cancel")}
                    </Button>
                    <Button onClick={handleAddReading}>
                      {t("common.save")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("vehicles.management.mileage.current")}
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.current.toLocaleString()} km
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("vehicles.management.mileage.lastUpdate")}: {format(stats.lastUpdate, "PPP")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("vehicles.management.mileage.daily")}
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.daily.toFixed(1)} km
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("vehicles.management.mileage.monthly")}
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.monthly.toFixed(0)} km
                  </p>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mileageRecords}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), "MMM d")}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => format(new Date(date), "PPP")}
                      formatter={(value) => [`${value} km`, t("vehicles.management.mileage.reading")]}
                    />
                    <Line
                      type="monotone"
                      dataKey="reading"
                      stroke="#0ea5e9"
                      name={t("vehicles.management.mileage.reading")}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>{t("vehicles.management.mileage.history")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead>{t("vehicles.management.mileage.reading")}</TableHead>
                    <TableHead>{t("vehicles.management.mileage.distance")}</TableHead>
                    <TableHead>{t("vehicles.management.mileage.notes")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordsWithDistances.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(record.date, "PPP")}</TableCell>
                      <TableCell>{record.reading.toLocaleString()} km</TableCell>
                      <TableCell>
                        {record.distance 
                          ? `${record.distance.toLocaleString()} km`
                          : "-"
                        }
                      </TableCell>
                      <TableCell>{record.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="grid gap-6">
            <MileageGoals 
              vehicleId={vehicleId}
              currentMileage={stats.current}
              dailyAverage={stats.daily}
            />

            <Card>
              <CardHeader>
                <CardTitle>{t("vehicles.management.mileage.analysis")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("vehicles.management.mileage.totalDistance")}
                      </p>
                      <p className="text-2xl font-bold">
                        {(stats.current - mileageRecords[mileageRecords.length - 1].reading).toLocaleString()} km
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("vehicles.management.mileage.averagePerTrip")}
                      </p>
                      <p className="text-2xl font-bold">
                        {(recordsWithDistances
                          .reduce((sum, record) => sum + (record.distance || 0), 0) / 
                          (recordsWithDistances.length - 1)).toFixed(1)} km
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("vehicles.management.mileage.projectedMonthly")}
                      </p>
                      <p className="text-2xl font-bold">
                        {(stats.monthly * 1.1).toFixed(0)} km
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">
                      {t("vehicles.management.mileage.weeklyComparison")}
                    </h4>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={recordsWithDistances.slice(0, 7)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(date) => format(new Date(date), "EEE")}
                          />
                          <YAxis />
                          <Tooltip
                            labelFormatter={(date) => format(new Date(date), "PPP")}
                            formatter={(value) => [`${value} km`, t("vehicles.management.mileage.distance")]}
                          />
                          <Bar
                            dataKey="distance"
                            fill="#0ea5e9"
                            name={t("vehicles.management.mileage.distance")}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            {t("vehicles.management.mileage.weeklyAverage")}
                          </p>
                          <p className="text-2xl font-bold">
                            {(stats.daily * 7).toFixed(0)} km
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            {t("vehicles.management.mileage.yearlyProjection")}
                          </p>
                          <p className="text-2xl font-bold">
                            {(stats.daily * 365).toFixed(0)} km
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            {t("vehicles.management.mileage.highestDaily")}
                          </p>
                          <p className="text-2xl font-bold">
                            {Math.max(...recordsWithDistances
                              .map(r => r.distance || 0)
                            ).toFixed(0)} km
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            {t("vehicles.management.mileage.averageSpeed")}
                          </p>
                          <p className="text-2xl font-bold">
                            {(stats.daily / 24).toFixed(1)} km/h
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            <MaintenanceCostAnalysis 
              vehicleId={vehicleId}
              totalMileage={stats.current}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 