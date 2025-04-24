"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, List, Grid3X3, Search, User } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDrivers } from "@/lib/services/drivers"
import { DriverCard } from "@/components/drivers/driver-card"
import { DriverListItem } from "@/components/drivers/driver-list-item"
import { DriverStatusFilter } from "@/components/drivers/driver-status-filter"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import type { Driver } from "@/types"

export default function DriversPage() {
  const { t } = useI18n()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    async function loadDrivers() {
      try {
        setIsLoading(true)
        const data = await getDrivers()
        setDrivers(data)
        setFilteredDrivers(data)
      } catch (error) {
        console.error("Error loading drivers:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDrivers()
  }, [])

  useEffect(() => {
    let result = [...drivers]

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(driver => driver.status === statusFilter)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        driver =>
          driver.first_name.toLowerCase().includes(query) ||
          driver.last_name.toLowerCase().includes(query) ||
          driver.email.toLowerCase().includes(query) ||
          driver.license_number?.toLowerCase().includes(query)
      )
    }

    setFilteredDrivers(result)
  }, [drivers, statusFilter, searchQuery])

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={t("drivers.title")}
        description={t("drivers.description")}
        icon={<User className="h-6 w-6" />}
      >
        <Button size="sm" asChild>
          <Link href="/drivers/new" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            {t("drivers.actions.addDriver")}
          </Link>
        </Button>
      </PageHeader>

      <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("drivers.search")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DriverStatusFilter
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>

        <Tabs
          defaultValue={viewMode}
          className="w-full sm:w-auto"
          onValueChange={(value) => setViewMode(value as "list" | "grid")}
        >
          <TabsList>
            <TabsTrigger value="grid" className="flex items-center">
              <Grid3X3 className="h-4 w-4 mr-2" />
              {t("common.grid")}
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center">
              <List className="h-4 w-4 mr-2" />
              {t("common.list")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        viewMode === "grid" ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-lg border divide-y">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredDrivers.length === 0 ? (
        <EmptyState
          icon={<User className="h-10 w-10" />}
          title={t("drivers.empty.title")}
          description={
            searchQuery
              ? t("drivers.empty.searchResults")
              : t("drivers.empty.description")
          }
          action={
            <Button asChild>
              <Link href="/drivers/new">
                <Plus className="mr-2 h-4 w-4" />
                {t("drivers.actions.addDriver")}
              </Link>
            </Button>
          }
        />
      ) : viewMode === "grid" ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map(driver => (
            <DriverCard key={driver.id} driver={driver} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border divide-y">
          {filteredDrivers.map(driver => (
            <DriverListItem key={driver.id} driver={driver} />
          ))}
        </div>
      )}
    </div>
  )
} 