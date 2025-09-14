# AeroDataBox Flight Search Integration

This document describes the integration of AeroDataBox API for flight search functionality in the booking creation form, replacing the previous AviationStack integration.

## Overview

The flight search feature allows users to search for flights by flight number and automatically populate terminal information. This enhances the user experience by providing real-time flight data and reducing manual data entry.

## Setup

### 1. Environment Configuration

Add the following environment variable to your `.env.local` file:

```bash
NEXT_PUBLIC_AERODATABOX_API_KEY=your_aerodatabox_api_key_here
```

**Note**: The `NEXT_PUBLIC_` prefix is required for client-side access in Next.js. This makes the API key available to browser-side components.

### 2. API Key Setup

1. Sign up for a free account at [RapidAPI AeroDataBox](https://rapidapi.com/aedbx-aedbx/api/aerodatabox)
2. Subscribe to the AeroDataBox API plan
3. Get your API key from the RapidAPI dashboard
4. Add the API key to your environment variables

## Features

### Flight Search Component

- **Real-time search**: Search flights as you type (debounced)
- **Autocomplete**: Dropdown with flight results
- **Auto-populate**: Automatically fills terminal information
- **Smart pickup scheduling**: Auto-populates pickup date and time (30 minutes after flight arrival)
- **Fallback**: Manual terminal input as backup
- **Error handling**: Graceful error handling for API failures

### API Service

- **Type-safe**: Full TypeScript support
- **Error handling**: Comprehensive error handling
- **Caching**: Built-in request optimization
- **Flexible**: Support for various search parameters

## Usage

The flight search is integrated into the Route Information tab of the booking creation form:

1. Navigate to the booking creation form
2. Go to the Route Information tab
3. Use the "Flight Search" field to search for flights
4. Select a flight from the dropdown
5. **Terminal information** will be auto-populated
6. **Pickup date and time** will be automatically set (30 minutes after flight arrival)

## API Endpoints Used

- `GET /flights/number/{flightNumber}` - Search for flights by flight number
- Additional parameters: `withAircraftImage=false`, `withLocation=false`

## Migration from AviationStack

The migration from AviationStack to AeroDataBox includes:

1. **Service Layer**: Updated `lib/aerodatabox.ts` to replace `lib/aviation-stack.ts`
2. **API Route**: Modified `app/api/aviation/search/route.ts` to use AeroDataBox endpoints
3. **Types**: Added AeroDataBox-specific types while maintaining backward compatibility
4. **Component**: Updated `components/bookings/flight-search.tsx` to use the new service

## Response Format

AeroDataBox returns flight data in the following format:

```json
{
  "data": [
    {
      "flight": {
        "number": "DL47",
        "iata": "DL47",
        "icao": "DAL47"
      },
      "airline": {
        "name": "Delta Air Lines",
        "iata": "DL",
        "icao": "DAL"
      },
      "departure": {
        "airport": "Tokyo Haneda Airport",
        "iata": "HND",
        "icao": "RJTT",
        "terminal": "3",
        "scheduled": "2024-01-15T10:30:00Z"
      },
      "arrival": {
        "airport": "Detroit Metropolitan Wayne County Airport",
        "iata": "DTW",
        "icao": "KDTW",
        "terminal": "A",
        "scheduled": "2024-01-15T14:45:00Z"
      },
      "flight_status": "scheduled"
    }
  ]
}
```

## Error Handling

The integration includes comprehensive error handling for:

- Invalid API keys
- Network failures
- API rate limiting
- Invalid flight numbers
- Empty responses

## Rate Limits

AeroDataBox API has rate limits based on your subscription plan. Check the RapidAPI dashboard for your specific limits and consider implementing caching for production use.
