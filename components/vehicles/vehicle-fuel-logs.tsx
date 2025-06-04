"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { columns } from "../fuel/columns"
import { VehicleLogsTable } from "./vehicle-logs-table"
import { useI18n } from "@/lib/i18n/context"
import { useState, useEffect } from "react"
import type { FuelLog } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { useQuery } from "@tanstack/react-query"
import { AppError, handleClientError } from "@/lib/errors/error-handler"

interface VehicleFuelLogsProps {
  vehicleId: string
}

interface FuelApiResponse {
  data: FuelLog[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

const fetchFuelLogs = async (vehicleId: string, page: number, pageSize: number): Promise<FuelApiResponse> => {
  const response = await fetch(`/api/vehicles/${vehicleId}/fuel?page=${page}&pageSize=${pageSize}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to fetch fuel logs" }));
    throw new AppError(
        errorData.message || "Server error fetching fuel logs", 
        response.status
    );
  }
  return response.json();
};

export function VehicleFuelLogs({ vehicleId }: VehicleFuelLogsProps) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const queryKey = ["fuelLogs", vehicleId, page, pageSize] as const;

  const { 
    data: apiResponse, 
    isLoading, 
    isError,
    error
  } = useQuery<FuelApiResponse, AppError, FuelApiResponse, typeof queryKey>({
    queryKey: queryKey,
    queryFn: () => fetchFuelLogs(vehicleId, page, pageSize),
    placeholderData: (previousData) => previousData,
    select: (data) => data,
  });

  useEffect(() => {
    if (isError && error) {
      handleClientError(error, `VehicleFuelLogs fetch Error: ${error.message}`);
      toast({
        title: t("common.error.genericTitle"),
        description: error.message || t("fuel.messages.loadErrorDesc"),
        variant: "destructive",
      });
    }
  }, [isError, error, t]);
  
  const logs = (apiResponse as FuelApiResponse | undefined)?.data || [];
  const paginationData = (apiResponse as FuelApiResponse | undefined)?.pagination;
  const isFetching = isLoading && (!apiResponse || (page !== paginationData?.page || pageSize !== paginationData?.pageSize));

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle>{t("fuel.title")}</CardTitle>
          <CardDescription>{t("fuel.description")}</CardDescription>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link
            href={`/vehicles/${vehicleId}/fuel/new`}
            className="flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>{t("fuel.new.title")}</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isFetching ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : isError && !apiResponse ? (
           <div className="h-32 flex items-center justify-center text-destructive">
             {error?.message || t("fuel.messages.loadErrorDesc")}
           </div>
        ) : (
          <VehicleLogsTable<FuelLog>
            columns={columns}
            data={logs}
            searchKey="date"
            pagination={{
              pageIndex: paginationData ? paginationData.page -1 : 0,
              pageSize: paginationData ? paginationData.pageSize : pageSize,
              pageCount: paginationData ? paginationData.totalPages : 0,
              totalCount: paginationData ? paginationData.totalCount : 0,
              setPage: (newPageIndex) => setPage(newPageIndex + 1),
              setPageSize: setPageSize,
            }}
            isFetching={isFetching && !!apiResponse}
          />
        )}
      </CardContent>
    </Card>
  );
} 