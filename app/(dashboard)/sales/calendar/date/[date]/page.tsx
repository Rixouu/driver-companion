import { Suspense } from 'react'
import { DateEventsPage } from '@/components/sales/date-events-page'
import { PageHeader } from '@/components/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface DateEventsPageProps {
  params: Promise<{
    date: string
  }>
}

export default async function DateEventsPageRoute({ params }: DateEventsPageProps) {
  const { date } = await params
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Date Events"
        description={`All events for ${date}`}
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/sales/calendar">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Link>
        </Button>
      </PageHeader>
      
      <Suspense fallback={<DateEventsSkeleton />}>
        <DateEventsPage date={date} />
      </Suspense>
    </div>
  )
}

function DateEventsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  )
}
