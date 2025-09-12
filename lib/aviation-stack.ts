import { 
  AviationStackResponse, 
  FlightSearchParams, 
  FlightSearchResult, 
  FlightSearchError 
} from '@/types/aviation'

const AVIATIONSTACK_BASE_URL = 'http://api.aviationstack.com/v1'

export class AviationStackService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_AVIATIONSTACK_API_KEY || process.env.AVIATIONSTACK_API_KEY || ''
    if (!this.apiKey) {
      console.warn('AVIATIONSTACK_API_KEY is not configured')
    }
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    // Use server-side API route to avoid CORS issues
    const url = new URL('/api/aviation/search', window.location.origin)
    
    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.append(key, value)
      }
    })


    try {
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API error: ${errorData.error || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  async searchFlights(params: FlightSearchParams): Promise<FlightSearchResult[]> {
    try {
      const response = await this.makeRequest<AviationStackResponse>('', {
        flight_number: params.flight_number || '',
        flight_iata: params.flight_iata || '',
        flight_icao: params.flight_icao || '',
        airline_iata: params.airline_iata || '',
        airline_icao: params.airline_icao || '',
        departure_iata: params.departure_iata || '',
        departure_icao: params.departure_icao || '',
        arrival_iata: params.arrival_iata || '',
        arrival_icao: params.arrival_icao || '',
        flight_date: params.flight_date || '',
        flight_status: params.flight_status || '',
        limit: params.limit?.toString() || '10',
        offset: params.offset?.toString() || '0'
      })

      return response.data.map(flight => ({
        flightNumber: flight.flight.number,
        airline: flight.airline.name,
        departure: {
          airport: flight.departure.airport,
          terminal: flight.departure.terminal,
          scheduled: flight.departure.scheduled
        },
        arrival: {
          airport: flight.arrival.airport,
          terminal: flight.arrival.terminal,
          scheduled: flight.arrival.scheduled
        },
        status: flight.flight_status,
        aircraft: flight.aircraft?.icao
      }))
    } catch (error) {
      console.error('Flight search failed:', error)
      throw error
    }
  }

  async searchFlightsByNumber(flightNumber: string, date?: string): Promise<FlightSearchResult[]> {
    return this.searchFlights({
      flight_number: flightNumber,
      flight_date: date,
      limit: 10
    })
  }

  async searchFlightsByAirline(airlineCode: string, date?: string): Promise<FlightSearchResult[]> {
    return this.searchFlights({
      airline_iata: airlineCode,
      flight_date: date,
      limit: 10
    })
  }

  async searchFlightsByRoute(departureCode: string, arrivalCode: string, date?: string): Promise<FlightSearchResult[]> {
    return this.searchFlights({
      departure_iata: departureCode,
      arrival_iata: arrivalCode,
      flight_date: date,
      limit: 10
    })
  }
}

// Export a singleton instance
export const aviationStackService = new AviationStackService()
