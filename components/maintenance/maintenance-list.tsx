"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { ViewToggle } from "@/components/ui/view-toggle"
import Link from "next/link"
import { useDebounce } from "@/hooks/use-debounce"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import type { MaintenanceTask, DbVehicle } from "@/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface MaintenanceListProps {
  tasks: MaintenanceTask[]
  vehicles?: DbVehicle[]
  currentPage?: number
  totalPages?: number
}

const ITEMS_PER_PAGE = 6

export function MaintenanceList({ tasks = [], vehicles = [], currentPage = 1, totalPages = 1 }: MaintenanceListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState<"list" | "grid">("grid")
  const debouncedSearch = useDebounce(search, 500)
  const { t, language } = useI18n()
  const [tasksWithVehicles, setTasksWithVehicles] = useState(tasks)

  useEffect(() => {
    async function loadVehicleData() {
      try {
        const updatedTasks = await Promise.all(
          tasks.map(async (task) => {
            if (task.vehicle?.id) {
              const { data: vehicleData, error: vehicleError } = await supabase
                .from('vehicles')
                .select('*')
                .eq('id', task.vehicle.id)
                .single()

              if (vehicleError) throw vehicleError

              return {
                ...task,
                vehicle: vehicleData
              }
            }
            return task
          })
        )
        // Sort tasks by due date (most recent first)
        const sortedTasks = updatedTasks.sort((a, b) => 
          new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
        )
        setTasksWithVehicles(sortedTasks)
      } catch (error) {
        console.error('Error loading vehicle data:', error)
      }
    }

    loadVehicleData()
  }, [tasks])

  const filteredTasks = tasksWithVehicles.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter
    const matchesSearch = !debouncedSearch || 
      task.title.toLowerCase().includes(debouncedSearch.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  // Calculate pagination
  const totalFilteredPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const formatScheduledDate = (date: string) => {
    return t("maintenance.details.scheduledFor", {
      date: formatDate(date)
    })
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    router.push(`/maintenance?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("maintenance.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <div className="sm:hidden">
              <Select
                value={filter}
                onValueChange={setFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("common.filter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="scheduled">{t("maintenance.status.scheduled")}</SelectItem>
                  <SelectItem value="in_progress">{t("maintenance.status.in_progress")}</SelectItem>
                  <SelectItem value="completed">{t("maintenance.status.completed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="hidden sm:flex flex-wrap gap-2">
              <Button 
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                {t("common.all")}
              </Button>
              <Button 
                variant={filter === 'scheduled' ? 'default' : 'outline'}
                onClick={() => setFilter('scheduled')}
              >
                {t("maintenance.status.scheduled")}
              </Button>
              <Button 
                variant={filter === 'in_progress' ? 'default' : 'outline'}
                onClick={() => setFilter('in_progress')}
              >
                {t("maintenance.status.in_progress")}
              </Button>
              <Button 
                variant={filter === 'completed' ? 'default' : 'outline'}
                onClick={() => setFilter('completed')}
              >
                {t("maintenance.status.completed")}
              </Button>
            </div>
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {paginatedTasks.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">
          {t("maintenance.noTasks")}
        </p>
      ) : (
        <>
          {view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedTasks.map((task) => (
                <Card key={task.id}>
                  <Link href={`/maintenance/${task.id}`}>
                    <div className="relative aspect-video w-full">
                      {task.vehicle?.image_url ? (
                        <Image
                          src={task.vehicle.image_url}
                          alt={task.vehicle?.name || ""}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <p className="text-muted-foreground">{t('maintenance.details.vehicleInfo.noImage')}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">{task.title}</h3>
                        {task.vehicle && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{task.vehicle.name}</p>
                            <p className="text-sm text-muted-foreground">{task.vehicle.plate_number}</p>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {formatScheduledDate(task.due_date)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={getStatusVariant(task.status)}>
                          {t(`maintenance.status.${task.status}`)}
                        </Badge>
                        <Badge variant="outline">
                          {t(`maintenance.priority.${task.priority}`)}
                        </Badge>
                      </div>
                      <Button variant="secondary" className="w-full" asChild>
                        <Link href={`/maintenance/${task.id}`}>
                          {t("common.viewDetails")}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Table View - Hidden on Mobile */}
              <div className="hidden sm:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("maintenance.fields.title")}</TableHead>
                      <TableHead>{t("vehicles.fields.name")}</TableHead>
                      <TableHead>{t("maintenance.fields.dueDate")}</TableHead>
                      <TableHead>{t("maintenance.priority.title")}</TableHead>
                      <TableHead>{t("maintenance.fields.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTasks.map((task) => (
                      <TableRow 
                        key={task.id}
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => router.push(`/maintenance/${task.id}`)}
                      >
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>
                          {task.vehicle?.name}
                          {task.vehicle?.plate_number && (
                            <span className="text-muted-foreground ml-2">
                              ({task.vehicle.plate_number})
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(task.due_date)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {t(`maintenance.priority.${task.priority}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(task.status)}>
                            {t(`maintenance.status.${task.status}`)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-4 sm:hidden">
                {paginatedTasks.map((task) => (
                  <Card 
                    key={task.id} 
                    className="overflow-hidden cursor-pointer"
                    onClick={() => router.push(`/maintenance/${task.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{task.title}</CardTitle>
                      {task.vehicle && (
                        <CardDescription>
                          {task.vehicle.name}
                          {task.vehicle.plate_number && ` (${task.vehicle.plate_number})`}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-3 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{t("maintenance.fields.dueDate")}</p>
                          <p className="text-sm font-medium">{formatDate(task.due_date)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">{t("maintenance.priority.title")}</p>
                          <Badge variant="outline" className="mt-1">
                            {t(`maintenance.priority.${task.priority}`)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-between items-center">
                      <Badge variant={getStatusVariant(task.status)}>
                        {t(`maintenance.status.${task.status}`)}
                      </Badge>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}

          <Pagination>
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={() => handlePageChange(currentPage - 1)}
                  />
                </PaginationItem>
              )}
              {[...Array(totalFilteredPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    href="#"
                    onClick={() => handlePageChange(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              {currentPage < totalFilteredPages && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() => handlePageChange(currentPage + 1)}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </>
      )}
    </div>
  )
}

function getStatusVariant(status: string) {
  switch (status) {
    case "completed":
      return "success"
    case "in_progress":
      return "warning"
    case "scheduled":
      return "secondary"
    default:
      return "default"
  }
} 