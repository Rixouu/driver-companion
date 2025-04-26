import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function BookingDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="client">Client</TabsTrigger>
          <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="route">Route</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="sm:col-span-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Only render the "general" tab skeleton to keep things simple */}
      </Tabs>
    </div>
  )
} 