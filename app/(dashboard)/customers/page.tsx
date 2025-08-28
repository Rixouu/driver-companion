import { Metadata } from "next"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Users } from "lucide-react"
import { getDictionary } from "@/lib/i18n/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getCustomers, getCustomerSegments } from "@/lib/api/customers-service"
import { CustomerListFilters } from "@/types/customers"
import { CustomersPageContent } from "@/components/customers/customers-page-content"
import LoadingSpinner from "@/components/shared/loading-spinner"
import { PageHeader } from "@/components/page-header"

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { t } = await getDictionary()
    
    return {
      title: t('navigation.customers') || "Customers",
      description: "Manage customer relationships and analytics",
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Customers",
      description: "Manage customer relationships and analytics",
    }
  }
}

const ITEMS_PER_PAGE = 20

interface CustomersPageProps {
  searchParams: Promise<{ 
    page?: string
    search?: string
    segment_id?: string
    sort_by?: string
    sort_order?: string
  }>
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const { t } = await getDictionary()
  const supabase = await getSupabaseServerClient()
  
  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view customers</p>
        </div>
      </div>
    )
  }

  // Resolve search params
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams?.page || '1')
  const search = resolvedSearchParams?.search
  const segment_id = resolvedSearchParams?.segment_id
  const sort_by = (resolvedSearchParams?.sort_by as any) || 'created_at'
  const sort_order = (resolvedSearchParams?.sort_order as 'asc' | 'desc') || 'desc'

  // Build filters
  const filters: CustomerListFilters = {
    page,
    limit: ITEMS_PER_PAGE,
    search,
    segment_id,
    sort_by,
    sort_order
  }

  try {
    // Fetch customers and segments in parallel
    const [customersResult, segments] = await Promise.all([
      getCustomers({ filters }),
      getCustomerSegments()
    ])

    return (
      <div className="space-y-6">
        <PageHeader
          title={t('navigation.customers') || "Customers"}
          description="Manage customer relationships, segments, and analytics"
        >
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Link>
          </Button>
        </PageHeader>

        <Suspense fallback={<LoadingSpinner />}>
          <CustomersPageContent
            initialCustomers={customersResult.customers}
            segments={segments}
            totalCount={customersResult.total_count}
            totalPages={customersResult.total_pages}
            currentPage={customersResult.page}
            filters={filters}
          />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Error fetching customers:', error)
    
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('navigation.customers') || "Customers"}
          description="Manage customer relationships, segments, and analytics"
        >
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Link>
          </Button>
        </PageHeader>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <Users className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">Unable to load customers</h3>
            <p className="text-muted-foreground">There was an error loading the customer data. Please try again.</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
