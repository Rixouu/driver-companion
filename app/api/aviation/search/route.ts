import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const flightNumber = searchParams.get('flight_number')
  
  if (!flightNumber) {
    return NextResponse.json({ error: 'Flight number is required' }, { status: 400 })
  }

  const apiKey = process.env.AERODATABOX_API_KEY || process.env.NEXT_PUBLIC_AERODATABOX_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: 'AeroDataBox API key is not configured' }, { status: 500 })
  }

  try {
    // AeroDataBox API endpoint for flight status (nearest day)
    const url = new URL('https://aerodatabox.p.rapidapi.com/flights/number/' + flightNumber)
    url.searchParams.append('withAircraftImage', 'false')
    url.searchParams.append('withLocation', 'false')

    console.log('🔍 Making AeroDataBox API request:', url.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
      }
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ AeroDataBox API error:', data)
      return NextResponse.json({ error: data.message || 'API request failed' }, { status: response.status })
    }

    console.log('✅ AeroDataBox API response:', data)
    
    // Transform AeroDataBox response to match expected format
    const flights = Array.isArray(data) ? data : [data]
    
    const transformedFlights = flights.map(flight => ({
      flight: {
        number: flight.number,
        iata: flight.number,
        icao: flight.number
      },
      airline: {
        name: flight.airline.name,
        iata: flight.airline.iata,
        icao: flight.airline.icao
      },
      aircraft: flight.aircraft ? {
        registration: flight.aircraft.reg || '',
        model: flight.aircraft.model || '',
        iata: flight.aircraft.iata || '',
        icao: flight.aircraft.icao || ''
      } : undefined,
      departure: {
        airport: flight.departure.airport.name,
        timezone: flight.departure.airport.timeZone,
        iata: flight.departure.airport.iata,
        icao: flight.departure.airport.icao,
        terminal: flight.departure.terminal,
        gate: flight.departure.gate,
        scheduled: flight.departure.scheduledTime.utc,
        estimated: flight.departure.revisedTime?.utc,
        actual: flight.departure.actualTime?.utc
      },
      arrival: {
        airport: flight.arrival.airport.name,
        timezone: flight.arrival.airport.timeZone,
        iata: flight.arrival.airport.iata,
        icao: flight.arrival.airport.icao,
        terminal: flight.arrival.terminal,
        gate: flight.arrival.gate,
        scheduled: flight.arrival.scheduledTime.utc,
        estimated: flight.arrival.predictedTime?.utc,
        actual: flight.arrival.actualTime?.utc
      },
      flight_status: flight.status.toLowerCase()
    }))
    
    const transformedData = {
      data: transformedFlights
    }
    
    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('❌ AeroDataBox API request failed:', error)
    return NextResponse.json({ error: 'Failed to fetch flight data' }, { status: 500 })
  }
}
