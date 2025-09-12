// AviationStack API Types
export interface AviationStackFlight {
  flight: {
    number: string
    iata: string
    icao: string
  }
  airline: {
    name: string
    iata: string
    icao: string
  }
  aircraft: {
    registration: string
    iata: string
    icao: string
    icao24: string
  }
  departure: {
    airport: string
    timezone: string
    iata: string
    icao: string
    terminal?: string
    gate?: string
    delay?: number
    scheduled: string
    estimated: string
    actual?: string
  }
  arrival: {
    airport: string
    timezone: string
    iata: string
    icao: string
    terminal?: string
    gate?: string
    baggage?: string
    delay?: number
    scheduled: string
    estimated: string
    actual?: string
  }
  flight_status: string
}

export interface AviationStackResponse {
  pagination: {
    limit: number
    offset: number
    count: number
    total: number
  }
  data: AviationStackFlight[]
}

export interface FlightSearchParams {
  flight_number?: string
  flight_iata?: string
  flight_icao?: string
  airline_iata?: string
  airline_icao?: string
  departure_iata?: string
  departure_icao?: string
  arrival_iata?: string
  arrival_icao?: string
  flight_date?: string
  flight_status?: string
  limit?: number
  offset?: number
}

export interface FlightSearchResult {
  flightNumber: string
  airline: string
  departure: {
    airport: string
    terminal?: string
    scheduled: string
  }
  arrival: {
    airport: string
    terminal?: string
    scheduled: string
  }
  status: string
  aircraft?: string
  pickupDate?: string
  pickupTime?: string
}

export interface FlightSearchError {
  error: {
    code: string
    message: string
  }
}
