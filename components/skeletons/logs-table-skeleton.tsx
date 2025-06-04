"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface LogsTableSkeletonProps {
  title?: string;
  rowCount?: number;
}

export function LogsTableSkeleton({ title = "Loading logs...", rowCount = 3 }: LogsTableSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-3/4" />
        </CardTitle>
        <Skeleton className="h-4 w-1/2 mt-1" /> {/* For description or actions */}
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {Array.from({ length: rowCount }).map((_, index) => (
          <div key={index} className="flex items-center justify-between p-2 border rounded-md">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24 md:w-32" />
              <Skeleton className="h-3 w-32 md:w-48" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md" /> {/* For action button */}
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 