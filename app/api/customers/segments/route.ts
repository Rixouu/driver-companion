import { NextResponse } from 'next/server'
import { getCustomerSegments } from '@/lib/api/customers-service'

export async function GET() {
  try {
    const segments = await getCustomerSegments()
    return NextResponse.json(segments)
  } catch (error) {
    console.error('Error in GET /api/customers/segments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer segments' },
      { status: 500 }
    )
  }
}
