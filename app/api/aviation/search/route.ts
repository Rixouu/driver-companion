import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const flightNumber = searchParams.get('flight_number')
  
  if (!flightNumber) {
    return NextResponse.json({ error: 'Flight number is required' }, { status: 400 })
  }

  const apiKey = process.env.AVIATIONSTACK_API_KEY || process.env.NEXT_PUBLIC_AVIATIONSTACK_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: 'AviationStack API key is not configured' }, { status: 500 })
  }

  try {
    // First, try exact flight number search
    let url = new URL('http://api.aviationstack.com/v1/flights')
    url.searchParams.append('access_key', apiKey)
    url.searchParams.append('flight_number', flightNumber)
    url.searchParams.append('limit', '10')

    console.log('🔍 Making AviationStack API request:', url.toString())

    let response = await fetch(url.toString())
    let data = await response.json()
    
    // If no results, try to extract airline code and search by airline
    if (data.data.length === 0 && flightNumber.length >= 2) {
      const airlineCode = flightNumber.substring(0, 2).toUpperCase()
      console.log('🔄 No exact match, trying airline search:', airlineCode)
      
      url = new URL('http://api.aviationstack.com/v1/flights')
      url.searchParams.append('access_key', apiKey)
      url.searchParams.append('airline_iata', airlineCode)
      url.searchParams.append('limit', '5')
      
      response = await fetch(url.toString())
      data = await response.json()
    }
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ AviationStack API error:', errorData)
      return NextResponse.json({ error: errorData.error?.message || 'API request failed' }, { status: response.status })
    }

    console.log('✅ AviationStack API response:', data)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ AviationStack API request failed:', error)
    return NextResponse.json({ error: 'Failed to fetch flight data' }, { status: 500 })
  }
}
