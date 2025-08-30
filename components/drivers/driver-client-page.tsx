"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DriverCard } from "@/components/drivers/driver-card";
import { DriverListItem } from "@/components/drivers/driver-list-item";
import { DriverList } from "@/components/drivers/driver-list-new";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { DriverFilter, DriverFilterOptions } from "./driver-filter";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/lib/hooks/use-debounce";
import type { Driver } from "@/types/drivers";
import { useI18n } from "@/lib/i18n/context";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ITEMS_PER_PAGE = 6;

interface DriverClientPageProps {
  initialDrivers: Driver[];
}

export function DriverClientPage({ initialDrivers }: DriverClientPageProps) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>(initialDrivers);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const initialSearchQueryFromParams = searchParams?.get("search") || "";
  const [filters, setFilters] = useState<DriverFilterOptions>({
    searchQuery: initialSearchQueryFromParams,
    statusFilter: searchParams?.get("status") || "all",
    availabilityFilter: searchParams?.get("availability") || "all",
    licenseFilter: searchParams?.get("license") || "all",
    sortBy: "name",
    sortOrder: "asc"
  });
  const debouncedSearch = useDebounce(filters.searchQuery, 500);

  const currentPage = searchParams?.get("page")
    ? parseInt(searchParams.get("page") as string, 10)
    : 1;

  const availabilityStatuses = useMemo(() => [
    { value: "all", label: t("common.all") },
    { value: "available", label: t("drivers.availability.statuses.available") },
    { value: "unavailable", label: t("drivers.availability.statuses.unavailable") },
    { value: "leave", label: t("drivers.availability.statuses.leave") },
    { value: "training", label: t("drivers.availability.statuses.training") },
  ], [t]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedView = localStorage.getItem("driverViewMode");
      if (storedView === "list" || storedView === "grid") {
        setViewMode(storedView);
      }
    }
    const style = document.createElement("style");
    style.textContent = `
      @media (max-width: 640px) {
        .driver-grid-view {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    setDrivers(initialDrivers);
    setFilteredDrivers(initialDrivers);
  }, [initialDrivers]);

  // Sync filters with URL params
  useEffect(() => {
    const searchFromParams = searchParams?.get("search") || "";
    const availabilityFromParams = searchParams?.get("availability") || "all";
    
    setFilters(prev => ({
      ...prev,
      searchQuery: searchFromParams,
      availabilityFilter: availabilityFromParams
    }));
  }, [searchParams]);

  useEffect(() => {
    let result = [...drivers];
    
    // Filter by availability status
    if (filters.availabilityFilter !== "all") {
      result = result.filter(
        (driver) => (driver.availability_status || driver.status || "available") === filters.availabilityFilter,
      );
    }
    
    // Filter by license status
    if (filters.licenseFilter !== "all") {
      const now = new Date();
      result = result.filter((driver) => {
        if (!driver.license_expiry) return filters.licenseFilter === 'valid';
        
        const expiryDate = new Date(driver.license_expiry);
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        switch (filters.licenseFilter) {
          case 'valid':
            return expiryDate > now;
          case 'expired':
            return expiryDate <= now;
          case 'expiring_soon':
            return expiryDate > now && expiryDate <= thirtyDaysFromNow;
          default:
            return true;
        }
      });
    }
    
    // Filter by search query
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (driver) =>
          driver.first_name?.toLowerCase().includes(query) ||
          driver.last_name?.toLowerCase().includes(query) ||
          driver.email?.toLowerCase().includes(query) ||
          driver.license_number?.toLowerCase().includes(query),
      );
    }
    
    setFilteredDrivers(result);
  }, [drivers, filters.availabilityFilter, filters.licenseFilter, debouncedSearch]);

  useEffect(() => {
    const handleResize = () => {
      const isMobileNow = window.innerWidth < 640;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = Math.ceil(filteredDrivers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedDrivers = filteredDrivers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const updateUrlParams = useCallback((paramsToUpdate: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.replace(`/drivers?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);
  
  const handlePageChange = (page: number) => {
    if (page === currentPage) return;
    updateUrlParams({ page: page.toString() });
  };

  const handleFiltersChange = (newFilters: DriverFilterOptions) => {
    setFilters(newFilters);
    // Update URL params based on new filters
    const paramsToUpdate: Record<string, string | null> = {};
    
    if (newFilters.availabilityFilter !== 'all') {
      paramsToUpdate.availability = newFilters.availabilityFilter;
    } else {
      paramsToUpdate.availability = null;
    }
    
    if (newFilters.searchQuery) {
      paramsToUpdate.search = newFilters.searchQuery;
    } else {
      paramsToUpdate.search = null;
    }
    
    updateUrlParams({ ...paramsToUpdate, page: "1" });
  };
  
  useEffect(() => {
    const currentSearchInUrl = searchParams?.get("search") || "";
    if (debouncedSearch !== currentSearchInUrl) {
      updateUrlParams({ search: debouncedSearch || null, page: "1" });
    }
  }, [debouncedSearch, searchParams, updateUrlParams]);

  const handleViewChange = (value: "list" | "grid") => {
    setViewMode(value);
    try {
      localStorage.setItem("driverViewMode", value);
    } catch (e) {
      console.error(t("drivers.messages.couldNotSaveViewPreference"), e);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className={`grid ${viewMode === "grid" ? "grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}`}>
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-left sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("drivers.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("drivers.description")}
          </p>
        </div>
        <Link href="/drivers/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t("drivers.actions.addDriver")}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <DriverFilter
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalDrivers={filteredDrivers.length}
          availabilityOptions={availabilityStatuses}
        />

      {filteredDrivers.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
          title={t("drivers.emptyState.title")}
          description={t("drivers.emptyState.description")}
          action={
            <Link href="/drivers/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">{t("drivers.actions.addDriver")}</Button>
            </Link>
          }
        />
      ) : (
        <DriverList
          drivers={filteredDrivers}
          currentPage={currentPage}
          totalPages={totalPages}
          isLoading={isLoading}
          initialFilters={filters}
          availabilityOptions={availabilityStatuses}
        />
      )}
      </div>
    </div>
  );
} 