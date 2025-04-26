import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function BookingsPageSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="flex justify-end mt-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 