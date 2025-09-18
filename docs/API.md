# 📡 API Documentation

## Overview

The Vehicle Inspection System provides a comprehensive REST API built with Next.js API routes and Supabase backend. All API endpoints are secured with authentication and follow RESTful conventions.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

All API endpoints require authentication using Supabase Auth tokens.

### Headers

```http
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

## Response Format

### Success Response

```json
{
  "data": <response_data>,
  "message": "Success",
  "status": 200
}
```

### Error Response

```json
{
  "error": "Error message",
  "status": 400,
  "details": "Additional error details"
}
```

## API Endpoints

### Authentication

#### POST /api/auth/signin
Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "role": "admin"
    },
    "access_token": "jwt-token",
    "refresh_token": "refresh-token"
  },
  "message": "Login successful"
}
```

#### POST /api/auth/signout
Sign out the current user.

**Response:**
```json
{
  "message": "Logout successful"
}
```

### Vehicles

#### GET /api/vehicles
Get list of vehicles with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (active, maintenance, inactive)
- `search` (string): Search by name or license plate

**Response:**
```json
{
  "data": {
    "vehicles": [
      {
        "id": "vehicle-id",
        "name": "Vehicle Name",
        "license_plate": "ABC-123",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

#### GET /api/vehicles/[id]
Get specific vehicle by ID.

**Response:**
```json
{
  "data": {
    "id": "vehicle-id",
    "name": "Vehicle Name",
    "license_plate": "ABC-123",
    "status": "active",
    "inspections": [
      {
        "id": "inspection-id",
        "type": "routine",
        "status": "completed",
        "date": "2024-01-15"
      }
    ],
    "maintenance": [
      {
        "id": "maintenance-id",
        "title": "Oil Change",
        "status": "completed",
        "due_date": "2024-01-15"
      }
    ],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /api/vehicles
Create a new vehicle.

**Request Body:**
```json
{
  "name": "New Vehicle",
  "license_plate": "XYZ-789",
  "status": "active"
}
```

**Response:**
```json
{
  "data": {
    "id": "new-vehicle-id",
    "name": "New Vehicle",
    "license_plate": "XYZ-789",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Vehicle created successfully"
}
```

#### PUT /api/vehicles/[id]
Update an existing vehicle.

**Request Body:**
```json
{
  "name": "Updated Vehicle",
  "license_plate": "UPD-123",
  "status": "active"
}
```

**Response:**
```json
{
  "data": {
    "id": "vehicle-id",
    "name": "Updated Vehicle",
    "license_plate": "UPD-123",
    "status": "active",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Vehicle updated successfully"
}
```

#### DELETE /api/vehicles/[id]
Delete a vehicle.

**Response:**
```json
{
  "message": "Vehicle deleted successfully"
}
```

### Inspections

#### GET /api/inspections
Get list of inspections with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `vehicle_id` (string): Filter by vehicle ID
- `status` (string): Filter by status (scheduled, in_progress, completed)
- `type` (string): Filter by type (routine, safety, maintenance)

**Response:**
```json
{
  "data": {
    "inspections": [
      {
        "id": "inspection-id",
        "vehicle_id": "vehicle-id",
        "inspector_id": "inspector-id",
        "type": "routine",
        "status": "completed",
        "date": "2024-01-15",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

#### POST /api/inspections
Create a new inspection.

**Request Body:**
```json
{
  "vehicle_id": "vehicle-id",
  "inspector_id": "inspector-id",
  "type": "routine",
  "date": "2024-01-15",
  "items": [
    {
      "section": "Engine",
      "item": "Oil Level",
      "status": "pass",
      "notes": "Oil level is adequate"
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "id": "inspection-id",
    "vehicle_id": "vehicle-id",
    "inspector_id": "inspector-id",
    "type": "routine",
    "status": "completed",
    "date": "2024-01-15",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Inspection created successfully"
}
```

### Bookings

#### GET /api/bookings
Get list of bookings with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (pending, confirmed, completed, cancelled)
- `date` (string): Filter by date (YYYY-MM-DD)
- `customer` (string): Search by customer name

**Response:**
```json
{
  "data": {
    "bookings": [
      {
        "id": "booking-id",
        "customer_name": "John Doe",
        "pickup_location": "Airport Terminal 1",
        "dropoff_location": "Hotel ABC",
        "date": "2024-01-15",
        "time": "10:00",
        "status": "confirmed",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

#### POST /api/bookings
Create a new booking.

**Request Body:**
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+1234567890",
  "pickup_location": "Airport Terminal 1",
  "dropoff_location": "Hotel ABC",
  "date": "2024-01-15",
  "time": "10:00",
  "vehicle_type": "sedan",
  "notes": "Special requirements"
}
```

**Response:**
```json
{
  "data": {
    "id": "booking-id",
    "customer_name": "John Doe",
    "pickup_location": "Airport Terminal 1",
    "dropoff_location": "Hotel ABC",
    "date": "2024-01-15",
    "time": "10:00",
    "status": "pending",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "message": "Booking created successfully"
}
```

### Dashboard

#### GET /api/dashboard/optimized-metrics
Get optimized dashboard metrics with caching.

**Response:**
```json
{
  "data": {
    "metrics": {
      "totalVehicles": 50,
      "activeVehicles": 45,
      "maintenanceTasks": 12,
      "inspections": 25,
      "vehiclesInMaintenance": 5,
      "scheduledInspections": 8,
      "inProgressInspections": 3,
      "completedInspections": 14,
      "pendingTasks": 4,
      "inProgressTasks": 2,
      "completedTasks": 6
    },
    "revenue": {
      "total": 125000,
      "monthly": 15000,
      "growth": 12.5
    },
    "charts": {
      "dailyRevenue": [...],
      "statusDistribution": [...],
      "monthlyRevenue": [...]
    }
  }
}
```

### Reporting

#### GET /api/reporting/comprehensive
Generate comprehensive reports.

**Query Parameters:**
- `type` (string): Report type (vehicles, inspections, maintenance, bookings)
- `start_date` (string): Start date (YYYY-MM-DD)
- `end_date` (string): End date (YYYY-MM-DD)
- `format` (string): Output format (json, csv, pdf)

**Response:**
```json
{
  "data": {
    "report": {
      "type": "vehicles",
      "period": "2024-01-01 to 2024-01-31",
      "summary": {
        "total": 50,
        "active": 45,
        "maintenance": 5
      },
      "details": [...]
    }
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Service temporarily unavailable |

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **Read endpoints**: 100 requests per minute
- **Write endpoints**: 20 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (starts from 1)
- `limit`: Items per page (max 100)

Pagination metadata is included in responses:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtering and Sorting

Most list endpoints support filtering and sorting:

### Filtering
Use query parameters to filter results:
```
GET /api/vehicles?status=active&search=ABC
```

### Sorting
Use `sort` parameter with field and direction:
```
GET /api/vehicles?sort=name:asc
GET /api/vehicles?sort=created_at:desc
```

## Webhooks

The system supports webhooks for real-time notifications:

### Webhook Events
- `vehicle.created`
- `vehicle.updated`
- `vehicle.deleted`
- `inspection.completed`
- `booking.confirmed`
- `maintenance.due`

### Webhook Payload
```json
{
  "event": "vehicle.created",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "id": "vehicle-id",
    "name": "New Vehicle",
    "status": "active"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
// Initialize API client
const apiClient = {
  baseURL: 'https://your-domain.com/api',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
}

// Get vehicles
const vehicles = await fetch(`${apiClient.baseURL}/vehicles`, {
  headers: apiClient.headers
}).then(res => res.json())

// Create vehicle
const newVehicle = await fetch(`${apiClient.baseURL}/vehicles`, {
  method: 'POST',
  headers: apiClient.headers,
  body: JSON.stringify({
    name: 'New Vehicle',
    license_plate: 'XYZ-789',
    status: 'active'
  })
}).then(res => res.json())
```

### cURL Examples

```bash
# Get vehicles
curl -X GET "https://your-domain.com/api/vehicles" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json"

# Create vehicle
curl -X POST "https://your-domain.com/api/vehicles" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Vehicle",
    "license_plate": "XYZ-789",
    "status": "active"
  }'
```

## Testing

API endpoints can be tested using the provided test suite:

```bash
# Run API tests
npm run test:api

# Run specific endpoint tests
npm run test:api -- --grep "vehicles"
```

## Changelog

### Version 1.0.0 (2024-01-30)
- Initial API release
- Vehicle management endpoints
- Inspection system endpoints
- Booking system endpoints
- Dashboard metrics endpoint
- Authentication system

---

*API Documentation - Last Updated: January 30, 2025*
*Version: 1.0*
*Status: Current*
