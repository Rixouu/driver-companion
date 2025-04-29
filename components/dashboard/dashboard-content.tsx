"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "@/lib/i18n/context"
import { formatDate } from "@/lib/utils/formatting"
import {
  Car,
  Wrench,
  ClipboardCheck,
  Gauge,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  Calendar,
  History,
  Play,
  ArrowRight,
  BarChart3,
  Bell,
  CheckSquare,
  Fuel,
  RotateCw,
  Sparkles,
  ThumbsUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { DbVehicle, DbInspection, DbMaintenanceTask } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { fadeIn, sliderVariants, withDelay } from "@/lib/utils/animations"

interface DashboardContentProps {
  stats: {
    totalVehicles: number
    activeVehicles: number
    maintenanceTasks: number
    inspections: number
    vehiclesInMaintenance: number
    scheduledInspections: number
    inProgressInspections: number
    completedInspections: number
    pendingTasks: number
    inProgressTasks: number
    completedTasks: number
  }
  recentInspections: DbInspection[]
  upcomingInspections: DbInspection[]
  recentMaintenance: DbMaintenanceTask[]
  upcomingMaintenance: DbMaintenanceTask[]
  inProgressItems: {
    inspections: DbInspection[]
    maintenance: DbMaintenanceTask[]
  }
  vehicles: DbVehicle[]
}

export function DashboardContent({
  stats,
  recentInspections,
  upcomingInspections,
  recentMaintenance,
  upcomingMaintenance,
  inProgressItems,
  vehicles
}: DashboardContentProps) {
  const { t } = useI18n()
  const [checklistCompleted, setChecklistCompleted] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [currentVehicleIndex, setCurrentVehicleIndex] = useState(0)
  const [vehicleStats, setVehicleStats] = useState({
    fuelLevel: 75,
    mileage: 24350,
    weeklyChange: 125
  })

  // Generate random stats for each vehicle when changing
  useEffect(() => {
    if (vehicles.length > 0) {
      // In a real app, these would come from the database
      // Here we're just generating random values for demonstration
      setVehicleStats({
        fuelLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
        mileage: 20000 + (currentVehicleIndex * 1000) + Math.floor(Math.random() * 5000),
        weeklyChange: 100 + Math.floor(Math.random() * 150)
      })
    }
  }, [currentVehicleIndex, vehicles.length])

  // Format mileage with commas
  const formatMileage = (value: number) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Function to handle checkbox changes
  const handleCheckboxChange = (id: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Function to handle checklist completion
  const handleCompleteChecklist = () => {
    setChecklistCompleted(true)
    // In a real app, you would save this to the database
  }

  // Vehicle navigation functions
  const nextVehicle = () => {
    if (vehicles.length > 0) {
      setCurrentVehicleIndex((currentVehicleIndex + 1) % vehicles.length)
    }
  }

  // Function to navigate to previous vehicle
  const prevVehicle = () => {
    if (vehicles.length > 0) {
      setCurrentVehicleIndex((currentVehicleIndex - 1 + vehicles.length) % vehicles.length)
    }
  }

  // Check if all items are checked
  const allItemsChecked = Object.values(checkedItems).filter(Boolean).length >= 5

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.description")}
        </p>
      </div>
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.quickActions.title")}</CardTitle>
          <CardDescription>{t("dashboard.quickActions.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/vehicles/new" className="col-span-1">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <Car className="h-6 w-6" />
                <span className="text-center">{t("dashboard.quickActions.addVehicle")}</span>
              </Button>
            </Link>
            <Link href="/maintenance/schedule" className="col-span-1">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <Wrench className="h-6 w-6" />
                <span className="text-center">{t("dashboard.quickActions.scheduleMaintenance")}</span>
              </Button>
            </Link>
            <Link href="/inspections/create" className="col-span-1">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <ClipboardCheck className="h-6 w-6" />
                <span className="text-center">{t("dashboard.quickActions.scheduleInspection")}</span>
              </Button>
            </Link>
            <Link href="/reporting" className="col-span-1">
              <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2">
                <BarChart3 className="h-6 w-6" />
                <span className="text-center">{t("dashboard.quickActions.viewReports")}</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      {/* Main Dashboard Content - Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Vehicle Stats - LEFT SIDE */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              {t("dashboard.vehicleStats.title")}
            </CardTitle>
            <CardDescription>{t("dashboard.vehicleStats.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <EmptyState icon={Car} message={t("vehicles.noVehicles")} />
            ) : (
              <div className="space-y-4">
                {/* Featured Vehicle with Navigation Arrows */}
                <div className="relative">
                  {vehicles.length > 1 && (
                    <>
                      <button 
                        onClick={prevVehicle}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-primary hover:text-primary-foreground p-2 rounded-full shadow-md transition-all duration-200 backdrop-blur"
                        aria-label="Previous vehicle"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={nextVehicle}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-primary hover:text-primary-foreground p-2 rounded-full shadow-md transition-all duration-200 backdrop-blur"
                        aria-label="Next vehicle"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={currentVehicleIndex}
                      variants={sliderVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="w-full"
                    >
                      <Link
                        href={`/vehicles/${vehicles[currentVehicleIndex]?.id}`}
                        key={vehicles[currentVehicleIndex]?.id}>
                        <div className="rounded-lg border overflow-hidden hover:bg-accent transition-colors">
                          <div className="aspect-video relative bg-muted">
                            {vehicles[currentVehicleIndex]?.image_url ? (
                              <Image
                                src={vehicles[currentVehicleIndex].image_url}
                                alt={vehicles[currentVehicleIndex].name}
                                fill
                                priority
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Car className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-lg">{vehicles[currentVehicleIndex]?.name}</h3>
                              {vehicles.length > 1 && (
                                <span className="text-xs text-muted-foreground">
                                  {currentVehicleIndex + 1} / {vehicles.length}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {vehicles[currentVehicleIndex]?.brand} {vehicles[currentVehicleIndex]?.model} • {vehicles[currentVehicleIndex]?.year}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <motion.div 
                                className="flex flex-col"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                              >
                                <div className="flex items-center gap-2">
                                  <Fuel className="h-4 w-4 text-amber-500" />
                                  <span className="text-sm font-medium">{t("dashboard.vehicleStats.fuelLevel")}</span>
                                </div>
                                <Progress value={vehicleStats.fuelLevel} className="h-2 mt-2" />
                                <span className="text-xs text-muted-foreground mt-1">{vehicleStats.fuelLevel}%</span>
                              </motion.div>
                              
                              <motion.div 
                                className="flex flex-col"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                              >
                                <div className="flex items-center gap-2">
                                  <RotateCw className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm font-medium">{t("dashboard.vehicleStats.mileage")}</span>
                                </div>
                                <span className="text-sm mt-2">{formatMileage(vehicleStats.mileage)} km</span>
                                <span className="text-xs text-muted-foreground">+{vehicleStats.weeklyChange} km this week</span>
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Checklist - RIGHT SIDE */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              {t("dashboard.dailyChecklist.title")}
            </CardTitle>
            <CardDescription>{t("dashboard.dailyChecklist.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {checklistCompleted ? (
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <ThumbsUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold">{t("dashboard.dailyChecklist.completed.title")}</h3>
                <p className="text-muted-foreground">{t("dashboard.dailyChecklist.completed.message")}</p>
                <div className="pt-4">
                  <Button variant="outline" onClick={() => setChecklistCompleted(false)}>
                    <RotateCw className="mr-2 h-4 w-4" />
                    {t("dashboard.dailyChecklist.completed.reset")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Checklist Items - with increased spacing */}
                <div className="space-y-5">
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <Checkbox 
                      id="check-1" 
                      checked={checkedItems["check-1"]} 
                      onCheckedChange={() => handleCheckboxChange("check-1")}
                    />
                    <label htmlFor="check-1" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t("dashboard.dailyChecklist.items.checkTires")}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <Checkbox 
                      id="check-2" 
                      checked={checkedItems["check-2"]} 
                      onCheckedChange={() => handleCheckboxChange("check-2")}
                    />
                    <label htmlFor="check-2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t("dashboard.dailyChecklist.items.checkLights")}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <Checkbox 
                      id="check-3" 
                      checked={checkedItems["check-3"]} 
                      onCheckedChange={() => handleCheckboxChange("check-3")}
                    />
                    <label htmlFor="check-3" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t("dashboard.dailyChecklist.items.checkFluids")}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <Checkbox 
                      id="check-4" 
                      checked={checkedItems["check-4"]} 
                      onCheckedChange={() => handleCheckboxChange("check-4")}
                    />
                    <label htmlFor="check-4" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t("dashboard.dailyChecklist.items.checkBrakes")}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md">
                    <Checkbox 
                      id="check-5" 
                      checked={checkedItems["check-5"]} 
                      onCheckedChange={() => handleCheckboxChange("check-5")}
                    />
                    <label htmlFor="check-5" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t("dashboard.dailyChecklist.items.visualInspection")}
                    </label>
                  </div>
                </div>
                
                {/* Upcoming Maintenance Reminders */}
                {(upcomingMaintenance.length > 0 || upcomingInspections.length > 0) && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {t("dashboard.dailyChecklist.upcomingReminders")}
                    </h4>
                    <div className="space-y-2">
                      {upcomingMaintenance.slice(0, 1).map((task) => (
                        <Link key={task.id} href={`/maintenance/${task.id}`}>
                          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md text-sm hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                            <div className="flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-amber-600" />
                              <span className="font-medium">{task.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {task.vehicle?.name} • {t('maintenance.details.scheduledFor', { date: formatDate(task.due_date) })}
                            </p>
                          </div>
                        </Link>
                      ))}
                      {upcomingInspections.slice(0, 1).map((inspection) => (
                        <Link key={inspection.id} href={`/inspections/${inspection.id}`}>
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                            <div className="flex items-center gap-2">
                              <ClipboardCheck className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{inspection.type || t('inspections.defaultType')}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {inspection.vehicle?.name} • {t('inspections.details.scheduledFor', { date: formatDate(inspection.date) })}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-2">
                  <Button 
                    variant={allItemsChecked ? "default" : "outline"} 
                    className="w-full"
                    disabled={!allItemsChecked}
                    onClick={handleCompleteChecklist}
                  >
                    {allItemsChecked ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {t("dashboard.dailyChecklist.completeChecklist")}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {t("dashboard.dailyChecklist.checkAllItems")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            {t("dashboard.activityFeed.title")}
          </CardTitle>
          <CardDescription>{t("dashboard.activityFeed.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recent">
                <History className="mr-2 h-4 w-4" />
                {t("common.status.recent")}
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                <Calendar className="mr-2 h-4 w-4" />
                {t("common.status.upcoming")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-4">
              {recentMaintenance.length === 0 && recentInspections.length === 0 ? (
                <EmptyState icon={History} message={t("dashboard.activityFeed.noRecent")} />
              ) : (
                <div className="space-y-4">
                  {recentMaintenance.slice(0, 3).map((task) => (
                    <MaintenanceTaskCard key={task.id} task={task} />
                  ))}
                  {recentInspections.slice(0, 3).map((inspection) => (
                    <InspectionCard key={inspection.id} inspection={inspection} />
                  ))}
                </div>
              )}
              {(recentMaintenance.length > 0 || recentInspections.length > 0) && (
                <div className="flex justify-center mt-4">
                  <Link
                    href={recentMaintenance.length > recentInspections.length ? "/maintenance" : "/inspections"}>
                    <Button variant="outline">
                      {t("dashboard.activityFeed.viewAll")}
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingMaintenance.length === 0 && upcomingInspections.length === 0 ? (
                <EmptyState icon={Calendar} message={t("dashboard.activityFeed.noUpcoming")} />
              ) : (
                <div className="space-y-4">
                  {upcomingMaintenance.slice(0, 3).map((task) => (
                    <MaintenanceTaskCard key={task.id} task={task} />
                  ))}
                  {upcomingInspections.slice(0, 3).map((inspection) => (
                    <InspectionCard key={inspection.id} inspection={inspection} />
                  ))}
                </div>
              )}
              {(upcomingMaintenance.length > 0 || upcomingInspections.length > 0) && (
                <div className="flex justify-center mt-4">
                  <Link
                    href={upcomingMaintenance.length > upcomingInspections.length ? "/maintenance" : "/inspections"}>
                    <Button variant="outline">
                      {t("dashboard.activityFeed.viewAll")}
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="text-center py-6">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function MaintenanceTaskCard({ task }: { task: DbMaintenanceTask }) {
  const { t } = useI18n()
  return (
    <Link href={`/maintenance/${task.id}`}>
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            <p className="font-medium">{task.title}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {task.vehicle?.name} • {task.status === 'completed' ? t('common.status.completed') : t('maintenance.details.scheduledFor', { date: formatDate(task.due_date) })}
          </p>
        </div>
        <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'secondary'}>
          {t(`maintenance.status.${task.status}`)}
        </Badge>
      </div>
    </Link>
  );
}

function InspectionCard({ inspection }: { inspection: DbInspection }) {
  const { t } = useI18n()
  return (
    <Link href={`/inspections/${inspection.id}`}>
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <p className="font-medium">{inspection.type || t('inspections.defaultType')}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {inspection.vehicle?.name} • {inspection.status === 'completed' ? t('common.status.completed') : t('inspections.details.scheduledFor', { date: formatDate(inspection.date) })}
          </p>
        </div>
        <Badge variant={inspection.status === 'completed' ? 'success' : inspection.status === 'in_progress' ? 'warning' : 'secondary'}>
          {t(`inspections.status.${inspection.status}`)}
        </Badge>
      </div>
    </Link>
  );
} 