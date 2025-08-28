import { NextRequest, NextResponse } from 'next/server'
import { getCustomers, createCustomer } from '@/lib/api/customers-service'
import { CustomerListFilters } from '@/types/customers'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters: CustomerListFilters = {
      segment_id: searchParams.get('segment_id') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: (searchParams.get('sort_by') as any) || 'created_at',
      sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    }

    const result = await getCustomers({ filters })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { name, email, phone, address, notes, segment_id } = body
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const customer = await createCustomer({
      name,
      email,
      phone,
      address,
      notes,
      segment_id
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/customers:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
