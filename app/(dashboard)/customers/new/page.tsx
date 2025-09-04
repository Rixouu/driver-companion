import { Metadata } from "next"
import { Suspense } from "react"
import { getDictionary } from "@/lib/i18n/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getCustomerSegments } from "@/lib/api/customers-service"
import { CustomerForm } from "@/components/customers/customer-form"
import LoadingSpinner from "@/components/shared/loading-spinner"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "New Customer",
    description: "Add a new customer to your system",
  }
}

export default async function NewCustomerPage() {
  const { t } = await getDictionary()
  const supabase = await getSupabaseServerClient()
  
  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to add customers</p>
        </div>
      </div>
    )
  }

  try {
    const segments = await getCustomerSegments()

    return (
      <div className="space-y-6">
        <PageHeader
          title="New Customer"
          description="Add a new customer to your system"
          breadcrumb={[
            { label: 'Customers', href: '/customers' },
            { label: 'New Customer' }
          ]}
        />

        <Suspense fallback={<LoadingSpinner />}>
          <CustomerForm segments={segments} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Error loading new customer page:', error)
    
    return (
      <div className="space-y-6">
        <PageHeader
          title="New Customer"
          description="Add a new customer to your system"
          breadcrumb={[
            { label: 'Customers', href: '/customers' },
            { label: 'New Customer' }
          ]}
        />

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">Unable to load form</h3>
            <p className="text-muted-foreground">There was an error loading the customer form. Please try again.</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
