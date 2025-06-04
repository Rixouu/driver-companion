"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DriverCard } from "@/components/drivers/driver-card";
import { DriverListItem } from "@/components/drivers/driver-list-item";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
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
  const [searchQuery, setSearchQuery] = useState(initialSearchQueryFromParams);
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams?.get("status") || "all",
  );
  const debouncedSearch = useDebounce(searchQuery, 500);

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

  useEffect(() => {
    let result = [...drivers];
    if (statusFilter !== "all") {
      result = result.filter(
        (driver) => (driver.availability_status || driver.status || "available") === statusFilter,
      );
    }
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
  }, [drivers, statusFilter, debouncedSearch]);

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

  const handleStatusFilterChange = (status: string) => {
    if (status === statusFilter) return;
    setStatusFilter(status);
    updateUrlParams({ status: status, page: "1" });
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("drivers.title")}</h1>
          <p className="text-muted-foreground">
            {t("drivers.description")}
          </p>
        </div>
        <Link href="/drivers/new">
          <Button className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            {t("drivers.actions.addDriver")}
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
         <SearchFilterBar
          onSearchChange={handleSearchQueryChange}
          searchPlaceholder={t("drivers.search")}
          totalItems={filteredDrivers.length}
          startIndex={filteredDrivers.length > 0 ? Math.min(startIndex + 1, filteredDrivers.length) : 0}
          endIndex={Math.min(startIndex + ITEMS_PER_PAGE, filteredDrivers.length)}
          onBrandFilterChange={handleStatusFilterChange}
          brandOptions={availabilityStatuses}
          showBrandFilter={true}
          selectedBrand={statusFilter}
          showModelFilter={false}
          onModelFilterChange={() => {}}
          selectedModel="all"
        />

        <div className="flex items-center justify-end">
          <div className="touch-manipulation">
            <ViewToggle view={viewMode} onViewChange={handleViewChange} />
          </div>
        </div>
      </div>

      {filteredDrivers.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
          title={t("drivers.emptyState.title")}
          description={t("drivers.emptyState.description")}
          action={
            <Link href="/drivers/new">
              <Button>{t("drivers.actions.addDriver")}</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div
            className={
              viewMode === "grid"
                ? "driver-grid-view grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-4"
            }
          >
            {paginatedDrivers.map((driver) =>
              viewMode === "grid" ? (
                <DriverCard key={driver.id} driver={driver} />
              ) : (
                <DriverListItem key={driver.id} driver={driver} />
              ),
            )}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || (page >= currentPage -1 && page <= currentPage + 1))
                  .map((page, index, arr) => (
                    <React.Fragment key={page}>
                      {index > 0 && arr[index-1] + 1 < page && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    </React.Fragment>
                  ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) handlePageChange(currentPage + 1);
                    }}
                    aria-disabled={currentPage === totalPages}
                     className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
} 