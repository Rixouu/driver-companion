import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getDictionary } from "@/lib/i18n/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getCustomerById } from "@/lib/api/customers-service"
import { CustomerDetailsContent } from "@/components/customers/customer-details-content"
import LoadingSpinner from "@/components/shared/loading-spinner"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

interface CustomerDetailsPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CustomerDetailsPageProps): Promise<Metadata> {
  const { id } = await params
  const customer = await getCustomerById(id)
  
  return {
    title: customer ? `${customer.name || customer.email} - Customer Details` : "Customer Details",
    description: customer ? `View details and analytics for ${customer.name || customer.email}` : "Customer details and analytics",
  }
}

export default async function CustomerDetailsPage({ params }: CustomerDetailsPageProps) {
  const { id } = await params
  const { t } = await getDictionary()
  const supabase = await getSupabaseServerClient()
  
  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to view customer details</p>
        </div>
      </div>
    )
  }

  try {
    const customer = await getCustomerById(id)

    if (!customer) {
      notFound()
    }

    return (
      <div className="space-y-6">
        <PageHeader
          title={customer.name || customer.email}
          description={`Customer since ${new Date(customer.created_at).toLocaleDateString()}`}
        >
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/customers/${id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Customer
            </Link>
          </Button>
        </PageHeader>

        <Suspense fallback={<LoadingSpinner />}>
          <CustomerDetailsContent customer={customer} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Error fetching customer details:', error)
    
    return (
      <div className="space-y-6">
        <PageHeader
          title="Customer Details"
          description="Unable to load customer information"
        />

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">Unable to load customer</h3>
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
