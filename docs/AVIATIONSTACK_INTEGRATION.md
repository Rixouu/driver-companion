# AviationStack Flight Search Integration

This document describes the integration of AviationStack API for flight search functionality in the booking creation form.

## Overview

The flight search feature allows users to search for flights by flight number and automatically populate terminal information. This enhances the user experience by providing real-time flight data and reducing manual data entry.

## Setup

### 1. Environment Configuration

Add the following environment variable to your `.env.local` file:

```bash
NEXT_PUBLIC_AVIATIONSTACK_API_KEY=your_aviationstack_api_key_here
```

**Note**: The `NEXT_PUBLIC_` prefix is required for client-side access in Next.js. This makes the API key available to browser-side components.

### 2. API Key Setup

1. Sign up for a free account at [AviationStack](https://aviationstack.com/)
2. Get your API key from the dashboard
3. Add the API key to your environment variables

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

- `GET /flights` - Search for flights by various parameters
- Supports search by:
  - Flight number (e.g., "JL123")
  - Airline code
  - Route (departure/arrival airports)
  - Date

## Error Handling

The integration includes comprehensive error handling:

- API key validation
- Network error handling
- Rate limiting awareness
- Graceful degradation when API is unavailable

## Development Notes

- The API service uses a singleton pattern for efficiency
- Search is debounced to prevent excessive API calls
- Results are cached during the session
- The component is fully responsive and accessible

## Testing

To test the integration:

1. Ensure your API key is configured
2. Start the development server
3. Navigate to the booking creation form
4. Try searching for a flight number (e.g., "JL123")
5. Verify that results appear in the dropdown
6. Test selecting a flight and verify terminal auto-population

## Troubleshooting

### Common Issues

1. **No search results**: Check if the API key is valid and has remaining requests
2. **Network errors**: Verify internet connection and API availability
3. **TypeScript errors**: Ensure all types are properly imported

### Debug Mode

Enable debug logging by checking the browser console for detailed error messages.

## Future Enhancements

- Flight status tracking
- Airport code validation
- Route-based search
- Flight schedule integration
- Real-time flight updates
