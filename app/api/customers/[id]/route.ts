import { NextRequest, NextResponse } from 'next/server'
import { getCustomerById, updateCustomer, deleteCustomer } from '@/lib/api/customers-service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    const customer = await getCustomerById(id)
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error in GET /api/customers/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const customer = await updateCustomer(id, body)
    
    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error in PUT /api/customers/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    await deleteCustomer(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/customers/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}
