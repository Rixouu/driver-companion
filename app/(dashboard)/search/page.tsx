import { Suspense } from "react"
import { SearchResultsContent } from "@/components/search/search-results-content"
import { PageBreadcrumb } from "@/components/layout/page-breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams

  return (
    <div className="space-y-6">
      <PageBreadcrumb />
      
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Search Results
            {q && (
              <span className="text-muted-foreground ml-2">
                for "{q}"
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            Find vehicles, drivers, bookings, quotations, and more across your fleet
          </p>
        </div>

        <Suspense fallback={<SearchResultsSkeleton />}>
          <SearchResultsContent query={q} />
        </Suspense>
      </div>
    </div>
  )
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
