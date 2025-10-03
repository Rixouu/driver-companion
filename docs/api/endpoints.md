# 🔌 API Endpoints Reference

Complete reference for all API endpoints in the Vehicle Inspection System.

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
  "status": 200,
  "timestamp": "2024-01-30T10:00:00Z"
}
```

### Error Response
```json
{
  "error": "Error message",
  "status": 400,
  "details": "Additional error details",
  "timestamp": "2024-01-30T10:00:00Z"
}
```

---

## 🚗 Vehicles

### GET /api/vehicles
Get list of vehicles with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (active, maintenance, inactive)
- `search` (string): Search by name or license plate

**Response:**
```json
{
  "data": [
    {
      "id": "vehicle-id",
      "name": "Vehicle Name",
      "license_plate": "ABC-123",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### GET /api/vehicles/[id]
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
    ]
  }
}
```

### POST /api/vehicles
Create a new vehicle.

**Request Body:**
```json
{
  "name": "New Vehicle",
  "license_plate": "XYZ-789",
  "status": "active",
  "make": "Toyota",
  "model": "Camry",
  "year": 2023
}
```

### PUT /api/vehicles/[id]
Update an existing vehicle.

### DELETE /api/vehicles/[id]
Delete a vehicle.

---

## 📋 Inspections

### GET /api/inspections
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
  "data": [
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
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### POST /api/inspections
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

### GET /api/inspections/[id]
Get specific inspection by ID.

### PUT /api/inspections/[id]
Update an existing inspection.

### DELETE /api/inspections/[id]
Delete an inspection.

---

## 📅 Bookings

### GET /api/bookings
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
  "data": [
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
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### POST /api/bookings
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

### GET /api/bookings/[id]
Get specific booking by ID.

### PUT /api/bookings/[id]
Update an existing booking.

### DELETE /api/bookings/[id]
Delete a booking.

---

## 💰 Quotations

### GET /api/quotations
Get list of quotations with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (draft, sent, approved, rejected, converted)
- `search` (string): Search by customer name or title

**Response:**
```json
{
  "data": [
    {
      "id": "quotation-id",
      "quote_number": "QUO-001",
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "title": "Airport Transfer Service",
      "total_amount": 15000,
      "currency": "JPY",
      "status": "sent",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### POST /api/quotations
Create a new quotation.

**Request Body:**
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "title": "Airport Transfer Service",
  "service_type": "airport_transfer",
  "vehicle_type": "sedan",
  "duration_hours": 2,
  "amount": 15000,
  "currency": "JPY"
}
```

### GET /api/quotations/[id]
Get specific quotation by ID.

### PUT /api/quotations/[id]
Update an existing quotation.

### DELETE /api/quotations/[id]
Delete a quotation.

### POST /api/quotations/[id]/send-email
Send quotation email to customer.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "language": "en"
}
```

### POST /api/quotations/[id]/approve
Approve a quotation.

### POST /api/quotations/[id]/reject
Reject a quotation.

### POST /api/quotations/[id]/convert
Convert quotation to booking.

---

## 👥 Customers

### GET /api/customers
Get list of customers with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search by name or email
- `segment` (string): Filter by customer segment

**Response:**
```json
{
  "data": [
    {
      "id": "customer-id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "segment": "regular",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### POST /api/customers
Create a new customer.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "segment": "regular"
}
```

### GET /api/customers/[id]
Get specific customer by ID.

### PUT /api/customers/[id]
Update an existing customer.

### DELETE /api/customers/[id]
Delete a customer.

---

## 🚛 Drivers

### GET /api/drivers
Get list of drivers with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (active, inactive)
- `search` (string): Search by name

**Response:**
```json
{
  "data": [
    {
      "id": "driver-id",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "license_number": "DL123456",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### POST /api/drivers
Create a new driver.

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "license_number": "DL123456"
}
```

### GET /api/drivers/[id]
Get specific driver by ID.

### PUT /api/drivers/[id]
Update an existing driver.

### DELETE /api/drivers/[id]
Delete a driver.

---

## 📊 Dashboard

### GET /api/dashboard/metrics
Get dashboard metrics and KPIs.

**Response:**
```json
{
  "data": {
    "vehicles": {
      "total": 50,
      "active": 45,
      "maintenance": 5
    },
    "bookings": {
      "total": 150,
      "pending": 10,
      "confirmed": 120,
      "completed": 20
    },
    "quotations": {
      "total": 200,
      "sent": 50,
      "approved": 100,
      "converted": 50
    },
    "revenue": {
      "total": 125000,
      "monthly": 15000,
      "growth": 12.5
    }
  }
}
```

### GET /api/dashboard/upcoming-bookings
Get upcoming bookings for the dashboard.

**Response:**
```json
{
  "data": [
    {
      "id": "booking-id",
      "customer_name": "John Doe",
      "pickup_location": "Airport Terminal 1",
      "date": "2024-01-15",
      "time": "10:00",
      "status": "confirmed"
    }
  ]
}
```

---

## 📧 Email

### POST /api/email/send
Send email using templates.

**Request Body:**
```json
{
  "template": "quotation_sent",
  "to": "customer@example.com",
  "data": {
    "customer_name": "John Doe",
    "quotation_number": "QUO-001"
  },
  "language": "en"
}
```

### GET /api/email/templates
Get available email templates.

**Response:**
```json
{
  "data": [
    {
      "id": "quotation_sent",
      "name": "Quotation Sent",
      "subject": "Your Quotation - {{quotation_number}}",
      "is_active": true
    }
  ]
}
```

---

## 🔔 Notifications

### GET /api/notifications
Get user notifications.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `unread_only` (boolean): Filter unread notifications only

**Response:**
```json
{
  "data": [
    {
      "id": "notification-id",
      "type": "quotation_approved",
      "title": "Quotation Approved",
      "message": "Your quotation QUO-001 has been approved",
      "read": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### PUT /api/notifications/[id]/read
Mark notification as read.

### PUT /api/notifications/read-all
Mark all notifications as read.

---

## 🔍 Search

### GET /api/search
Global search across all entities.

**Query Parameters:**
- `q` (string): Search query
- `type` (string): Entity type (vehicles, bookings, quotations, customers)
- `limit` (number): Maximum results (default: 20)

**Response:**
```json
{
  "data": {
    "vehicles": [
      {
        "id": "vehicle-id",
        "name": "Vehicle Name",
        "license_plate": "ABC-123",
        "type": "vehicle"
      }
    ],
    "bookings": [
      {
        "id": "booking-id",
        "customer_name": "John Doe",
        "pickup_location": "Airport Terminal 1",
        "type": "booking"
      }
    ]
  }
}
```

---

## 📈 Reports

### GET /api/reports/comprehensive
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
      "details": []
    }
  }
}
```

---

## 🔐 Authentication

### POST /api/auth/signin
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
  }
}
```

### POST /api/auth/signout
Sign out the current user.

### POST /api/auth/refresh
Refresh access token.

---

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

---

*API Endpoints Reference - Last Updated: January 30, 2025*
