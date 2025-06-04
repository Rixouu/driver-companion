import { NextResponse } from 'next/server'
import { getInspectionTemplates } from '@/lib/services/inspections'
import type { InspectionType } from '@/types/inspections'

export async function GET(
  request: Request,
  { params }: { params: { type: InspectionType } }
) {
  try {
    if (!params || !params.type) {
      return NextResponse.json({ error: 'Type parameter is required and params must be defined' }, { status: 400 })
    }
    const { type } = params

    const templates = await getInspectionTemplates(type)
    return NextResponse.json(templates)
  } catch (error) {
    console.error(`Error fetching inspection templates for type ${params.type}:`, error)
    // It's good practice to not expose internal error details to the client
    // Instead, log them on the server and return a generic error message.
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return NextResponse.json({ error: 'Failed to fetch inspection templates', details: errorMessage }, { status: 500 })
  }
} 