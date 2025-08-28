import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { CustomerForm } from '@/components/customers/customer-form'
import { getCustomerById } from '@/lib/api/customers-service'
import { getCustomerSegments } from '@/lib/api/customers-service'


interface EditCustomerPageProps {
  params: {
    id: string
  }
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params
  const [customer, segments] = await Promise.all([
    getCustomerById(id),
    getCustomerSegments()
  ])

  if (!customer) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Customer"
        description="Update customer information and segment assignment"
      />
      
      <CustomerForm 
        initialData={customer} 
        segments={segments}
        isEditing={true}
      />
    </div>
  )
}
