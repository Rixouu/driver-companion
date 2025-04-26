import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function BookingDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="sm:col-span-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/5 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/5"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`sm:col-span-${i === 0 ? '2' : '1'}`}>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 