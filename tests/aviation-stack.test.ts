import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AviationStackService } from '@/lib/aviation-stack'

// Mock fetch
global.fetch = vi.fn()

describe('AviationStackService', () => {
  let service: AviationStackService
  let originalEnv: string | undefined

  beforeEach(() => {
    // Store original env value
    originalEnv = process.env.NEXT_PUBLIC_AVIATIONSTACK_API_KEY
    
    // Set test API key
    process.env.NEXT_PUBLIC_AVIATIONSTACK_API_KEY = 'test-api-key'
    
    service = new AviationStackService()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original env value
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_AVIATIONSTACK_API_KEY = originalEnv
    } else {
      delete process.env.NEXT_PUBLIC_AVIATIONSTACK_API_KEY
    }
  })

  it('should initialize with API key from environment', () => {
    const newService = new AviationStackService()
    expect(newService).toBeDefined()
  })

  it('should throw error when API key is not configured', async () => {
    delete process.env.NEXT_PUBLIC_AVIATIONSTACK_API_KEY
    const newService = new AviationStackService()
    
    await expect(newService.searchFlights({ flight_number: 'JL123' }))
      .rejects.toThrow('AviationStack API key is not configured')
  })

  it('should make API request with correct parameters', async () => {
    const mockResponse = {
      data: [
        {
          flight: { number: 'JL123', iata: 'JL123', icao: 'JAL123' },
          airline: { name: 'Japan Airlines', iata: 'JL', icao: 'JAL' },
          aircraft: { registration: 'JA123', iata: 'B738', icao: 'B738', icao24: '123456' },
          departure: {
            airport: 'Tokyo Haneda',
            timezone: 'Asia/Tokyo',
            iata: 'HND',
            icao: 'RJTT',
            terminal: '1',
            scheduled: '2024-01-01T10:00:00+00:00',
            estimated: '2024-01-01T10:00:00+00:00'
          },
          arrival: {
            airport: 'Osaka Kansai',
            timezone: 'Asia/Tokyo',
            iata: 'KIX',
            icao: 'RJBB',
            terminal: '1',
            scheduled: '2024-01-01T11:30:00+00:00',
            estimated: '2024-01-01T11:30:00+00:00'
          },
          flight_status: 'scheduled'
        }
      ],
      pagination: { limit: 10, offset: 0, count: 1, total: 1 }
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    const results = await service.searchFlightsByNumber('JL123')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('api.aviationstack.com/v1/flights')
    )
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('access_key=test-api-key')
    )
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('flight_number=JL123')
    )

    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({
      flightNumber: 'JL123',
      airline: 'Japan Airlines',
      departure: {
        airport: 'Tokyo Haneda',
        terminal: '1',
        scheduled: '2024-01-01T10:00:00+00:00'
      },
      arrival: {
        airport: 'Osaka Kansai',
        terminal: '1',
        scheduled: '2024-01-01T11:30:00+00:00'
      },
      status: 'scheduled',
      aircraft: 'B738'
    })
  })

  it('should handle API errors gracefully', async () => {
    const errorResponse = {
      error: {
        code: 'invalid_api_key',
        message: 'Invalid API key'
      }
    }

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(errorResponse)
    })

    await expect(service.searchFlightsByNumber('JL123')).rejects.toThrow(
      'AviationStack API error: Invalid API key'
    )
  })

  it('should handle network errors', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    await expect(service.searchFlightsByNumber('JL123')).rejects.toThrow('Network error')
  })
})
