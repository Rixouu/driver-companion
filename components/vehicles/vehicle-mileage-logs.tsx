"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { columns } from "../mileage/columns"
import { VehicleLogsTable } from "./vehicle-logs-table"
import { useI18n } from "@/lib/i18n/context"
import { useState, useEffect } from "react"
import type { MileageLog } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { useQuery } from "@tanstack/react-query"
import { AppError, handleClientError } from "@/lib/errors/error-handler"

interface VehicleMileageLogsProps {
  vehicleId: string
}

interface MileageApiResponse {
  data: MileageLog[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

const fetchMileageLogs = async (vehicleId: string, page: number, pageSize: number): Promise<MileageApiResponse> => {
  const response = await fetch(`/api/vehicles/${vehicleId}/mileage?page=${page}&pageSize=${pageSize}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Failed to fetch mileage logs" }));
    throw new AppError(
        errorData.message || "Server error fetching mileage logs", 
        response.status
    );
  }
  return response.json();
};

export function VehicleMileageLogs({ vehicleId }: VehicleMileageLogsProps) {
  const { t } = useI18n()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const queryKey = ["mileageLogs", vehicleId, page, pageSize] as const;

  const { 
    data: apiResponse, 
    isLoading, 
    isError,
    error 
  } = useQuery<MileageApiResponse, AppError, MileageApiResponse, typeof queryKey>({
    queryKey: queryKey,
    queryFn: () => fetchMileageLogs(vehicleId, page, pageSize),
    placeholderData: (previousData) => previousData,
    select: (data) => data,
  });
  
  useEffect(() => {
    if (isError && error) {
      handleClientError(error, `VehicleMileageLogs fetch Error: ${error.message}`);
      toast({
        title: t("common.error.genericTitle"),
        description: error.message || t("mileage.messages.loadErrorDesc"),
        variant: "destructive",
      });
    }
  }, [isError, error, t]);
  
  const logs = (apiResponse as MileageApiResponse | undefined)?.data || []
  const paginationData = (apiResponse as MileageApiResponse | undefined)?.pagination

  const isFetching = isLoading && (!apiResponse || (page !== paginationData?.page || pageSize !== paginationData?.pageSize))

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle>{t("mileage.title")}</CardTitle>
          <CardDescription>{t("mileage.description")}</CardDescription>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link
            href={{ pathname: `/vehicles/${vehicleId}/mileage/new` }}
            className="flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>{t("mileage.new.title")}</span>
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
             {error?.message || t("mileage.messages.loadErrorDesc")}
           </div>
        ) : (
          <VehicleLogsTable<MileageLog>
            columns={columns}
            data={logs}
            searchKey="date"
            pagination={{
              pageIndex: paginationData ? paginationData.page - 1 : 0,
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