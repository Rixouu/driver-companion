# Driver Shift Management

## Overview

The Driver Shift Management feature provides a comprehensive calendar-based view of driver schedules, shift assignments, and booking allocations. It allows dispatchers and managers to visualize and manage driver availability, assign bookings, and track shift utilization across days, weeks, and months.

## Features

### 1. **Shift Schedule Grid**
- Calendar-style grid layout with drivers in rows and dates in columns
- Color-coded cells indicating booking status and shift type
- Multi-select date range (day, week, month views)
- Real-time updates when bookings are assigned/reassigned

### 2. **Driver Management**
- View all active drivers and their schedules
- Filter by driver name, status, or team
- Quick access to driver profiles and contact information

### 3. **Booking Assignment**
- Drag-and-drop bookings between drivers
- Visual conflict detection (overlapping times)
- Automatic availability checking
- Bulk assignment capabilities

### 4. **Shift Planning**
- Create and manage driver shifts
- Define shift types (regular, overtime, on-call, split)
- Set shift start/end times
- Track shift status (scheduled, active, completed, cancelled)

### 5. **Visual Indicators**
- **Color Coding**:
  - 🟢 Green: Confirmed/Completed bookings
  - 🟡 Yellow: Pending bookings
  - 🔴 Red: Urgent/Priority bookings
  - 🔵 Blue: Day trips/Special services
  - ⚪ Gray: Cancelled bookings
  - 🟣 Purple: Overtime shifts

### 6. **Analytics & Reporting**
- Total hours worked per driver
- Booking count per shift
- Revenue generated per driver
- Shift utilization rates
- Monthly overview statistics

## Database Structure

### Tables

#### `driver_shifts`
Stores planned shifts and availability for each driver.

**Columns:**
- `id` (UUID): Primary key
- `driver_id` (UUID): Reference to driver
- `shift_date` (DATE): Date of the shift
- `shift_start_time` (TIME): Shift start time
- `shift_end_time` (TIME): Shift end time
- `shift_type` (VARCHAR): regular, overtime, on-call, split, etc.
- `status` (VARCHAR): scheduled, active, completed, cancelled
- `notes` (TEXT): Additional notes or instructions
- `created_at`, `updated_at`: Timestamps
- `created_by`, `updated_by`: User references

**Indexes:**
- `idx_driver_shifts_driver_id`
- `idx_driver_shifts_shift_date`
- `idx_driver_shifts_status`
- `idx_driver_shifts_date_range`

### Views

#### `driver_shift_schedule`
Comprehensive view combining driver, shift, and booking data.

**Returns:**
- Driver information
- Shift details
- Aggregated bookings for each shift
- Booking counts

#### `monthly_shift_overview`
Monthly statistics for driver performance and utilization.

**Returns:**
- Total shifts per driver
- Completed shifts count
- Total bookings count
- Total hours worked
- Total revenue generated

### Functions

#### `get_shift_schedule(start_date, end_date, driver_ids[])`
**Purpose:** Fetch shift schedule with all bookings for a date range

**Parameters:**
- `p_start_date` (DATE): Start date of range
- `p_end_date` (DATE): End date of range
- `p_driver_ids` (UUID[]): Optional array of driver IDs to filter

**Returns:** Table with:
- `driver_id`, `driver_name`
- `shift_date`
- `shifts` (JSON): Array of shift objects
- `bookings` (JSON): Array of booking objects

**Usage:**
```sql
-- Get 2-week schedule for all drivers
SELECT * FROM get_shift_schedule('2025-10-01', '2025-10-14', NULL);

-- Get specific driver schedule for a month
SELECT * FROM get_shift_schedule(
  '2025-10-01', 
  '2025-10-31', 
  ARRAY['driver-uuid-here']::UUID[]
);
```

#### `check_driver_availability(driver_id, date, start_time, duration)`
**Purpose:** Check if driver is available for a booking at specified time

**Parameters:**
- `p_driver_id` (UUID): Driver to check
- `p_date` (DATE): Booking date
- `p_start_time` (TIME): Booking start time
- `p_duration_hours` (INTEGER): Duration in hours

**Returns:** Table with:
- `is_available` (BOOLEAN): Whether driver is available
- `conflict_reason` (TEXT): Reason if unavailable
- `conflicts` (JSON): Array of conflicting bookings

**Usage:**
```sql
-- Check if driver can take a 4-hour booking starting at 09:00
SELECT * FROM check_driver_availability(
  'driver-uuid-here',
  '2025-10-15',
  '09:00',
  4
);
```

## SQL Query Examples

### 1. Get Current Week Schedule
```sql
SELECT * FROM get_shift_schedule(
  DATE_TRUNC('week', CURRENT_DATE)::DATE,
  (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE,
  NULL
);
```

### 2. Get Driver's Bookings for Today
```sql
SELECT 
  d.first_name || ' ' || d.last_name AS driver_name,
  b.wp_id,
  b.time,
  b.customer_name,
  b.service_name,
  b.pickup_location,
  b.dropoff_location,
  b.status,
  da.status AS assignment_status
FROM bookings b
JOIN drivers d ON b.driver_id = d.id
LEFT JOIN dispatch_assignments da ON b.id = da.booking_id
WHERE b.date = CURRENT_DATE
  AND b.driver_id IS NOT NULL
  AND d.deleted_at IS NULL
ORDER BY d.last_name, b.time;
```

### 3. Get Drivers Available for Specific Time Slot
```sql
WITH available_drivers AS (
  SELECT DISTINCT ds.driver_id
  FROM driver_shifts ds
  WHERE ds.shift_date = '2025-10-15'
    AND ds.status = 'scheduled'
    AND ds.shift_start_time <= '09:00'::TIME
    AND ds.shift_end_time >= '13:00'::TIME
)
SELECT 
  d.id,
  d.first_name || ' ' || d.last_name AS driver_name,
  d.phone,
  d.email,
  ca.*
FROM drivers d
JOIN available_drivers ad ON d.id = ad.driver_id
CROSS JOIN LATERAL check_driver_availability(
  d.id,
  '2025-10-15',
  '09:00',
  4
) ca
WHERE d.deleted_at IS NULL
  AND ca.is_available = TRUE
ORDER BY d.last_name;
```

### 4. Get Monthly Statistics for Each Driver
```sql
SELECT 
  driver_name,
  total_shifts,
  completed_shifts,
  total_bookings,
  completed_bookings,
  total_hours,
  TO_CHAR(total_revenue, 'FM¥999,999,999') AS formatted_revenue,
  ROUND((completed_bookings::NUMERIC / NULLIF(total_bookings, 0)) * 100, 2) AS completion_rate,
  ROUND(total_hours::NUMERIC / NULLIF(total_shifts, 0), 2) AS avg_hours_per_shift
FROM monthly_shift_overview
WHERE month = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY total_revenue DESC;
```

### 5. Get Unassigned Bookings for a Date Range
```sql
SELECT 
  b.wp_id,
  b.date,
  b.time,
  b.customer_name,
  b.service_name,
  b.service_type,
  b.pickup_location,
  b.dropoff_location,
  b.duration_hours,
  b.status
FROM bookings b
WHERE b.date BETWEEN '2025-10-01' AND '2025-10-31'
  AND b.driver_id IS NULL
  AND b.status NOT IN ('cancelled', 'completed')
ORDER BY b.date, b.time;
```

### 6. Get Driver Workload for a Week
```sql
SELECT 
  d.id,
  d.first_name || ' ' || d.last_name AS driver_name,
  DATE(b.date) AS booking_date,
  COUNT(b.id) AS booking_count,
  SUM(COALESCE(b.duration_hours, 0)) AS total_hours,
  SUM(COALESCE(b.price_amount, 0)) AS total_revenue,
  array_agg(b.wp_id ORDER BY b.time) AS booking_ids
FROM drivers d
LEFT JOIN bookings b ON d.id = b.driver_id
WHERE d.deleted_at IS NULL
  AND b.date BETWEEN DATE_TRUNC('week', CURRENT_DATE) 
               AND (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')
  AND b.status NOT IN ('cancelled')
GROUP BY d.id, d.first_name, d.last_name, DATE(b.date)
ORDER BY d.last_name, booking_date;
```

### 7. Find Best Driver for a Booking (by availability and location)
```sql
WITH booking_time_slot AS (
  SELECT 
    '2025-10-15'::DATE AS booking_date,
    '10:00'::TIME AS start_time,
    4 AS duration_hours
)
SELECT 
  d.id,
  d.first_name || ' ' || d.last_name AS driver_name,
  d.phone,
  ca.is_available,
  ca.conflict_reason,
  -- Count today's bookings
  COUNT(b.id) AS current_booking_count,
  -- Total hours already assigned
  SUM(COALESCE(b.duration_hours, 0)) AS current_hours
FROM drivers d
CROSS JOIN booking_time_slot bts
CROSS JOIN LATERAL check_driver_availability(
  d.id,
  bts.booking_date,
  bts.start_time,
  bts.duration_hours
) ca
LEFT JOIN bookings b ON d.id = b.driver_id 
  AND b.date = bts.booking_date
  AND b.status NOT IN ('cancelled')
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.first_name, d.last_name, d.phone, ca.is_available, ca.conflict_reason
HAVING ca.is_available = TRUE
ORDER BY current_booking_count ASC, current_hours ASC
LIMIT 5;
```

### 8. Get Shift Coverage Report
```sql
WITH date_series AS (
  SELECT generate_series(
    DATE_TRUNC('week', CURRENT_DATE),
    DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days',
    '1 day'::INTERVAL
  )::DATE AS shift_date
),
shift_coverage AS (
  SELECT 
    ds.shift_date,
    COUNT(DISTINCT ds.driver_id) AS drivers_scheduled,
    COUNT(DISTINCT b.id) AS total_bookings,
    COUNT(DISTINCT CASE WHEN b.driver_id IS NOT NULL THEN b.id END) AS assigned_bookings,
    COUNT(DISTINCT CASE WHEN b.driver_id IS NULL THEN b.id END) AS unassigned_bookings
  FROM date_series d
  LEFT JOIN driver_shifts ds ON d.shift_date = ds.shift_date
  LEFT JOIN bookings b ON d.shift_date = b.date AND b.status NOT IN ('cancelled')
  GROUP BY ds.shift_date
)
SELECT 
  TO_CHAR(shift_date, 'Day, Mon DD') AS date,
  drivers_scheduled,
  total_bookings,
  assigned_bookings,
  unassigned_bookings,
  CASE 
    WHEN total_bookings > 0 
    THEN ROUND((assigned_bookings::NUMERIC / total_bookings) * 100, 2)
    ELSE 0
  END AS assignment_rate
FROM shift_coverage
ORDER BY shift_date;
```

## API Endpoints

### Get Shift Schedule
```
GET /api/shifts/schedule?start_date=2025-10-01&end_date=2025-10-31&driver_ids[]=uuid1
```

### Create Shift
```
POST /api/shifts
Body: {
  driver_id: "uuid",
  shift_date: "2025-10-15",
  shift_start_time: "08:00",
  shift_end_time: "17:00",
  shift_type: "regular"
}
```

### Update Shift
```
PATCH /api/shifts/[id]
Body: { status: "completed", notes: "..." }
```

### Check Availability
```
GET /api/shifts/availability?driver_id=uuid&date=2025-10-15&start_time=09:00&duration=4
```

### Assign Booking to Driver
```
POST /api/shifts/assign
Body: {
  booking_id: "uuid",
  driver_id: "uuid",
  vehicle_id: "uuid"
}
```

## UI Components

### 1. `ShiftSchedulePage` - Main page component
### 2. `ShiftCalendarGrid` - Calendar grid layout
### 3. `DriverShiftRow` - Individual driver row
### 4. `BookingCell` - Booking cell with color coding
### 5. `ShiftFilters` - Date range and driver filters
### 6. `AssignmentModal` - Modal for assigning/reassigning bookings
### 7. `ShiftStatistics` - Analytics dashboard

## Permissions

- **View Shifts**: All authenticated users
- **Manage Shifts**: Admin, Super Admin, Dispatcher
- **Assign Bookings**: Admin, Super Admin, Dispatcher
- **Create/Edit Shifts**: Admin, Super Admin

## Future Enhancements

1. **Mobile App Integration**: Real-time shift updates for drivers
2. **AI-Powered Assignment**: Auto-suggest best driver for bookings
3. **Route Optimization**: Consider traffic and distance
4. **Overtime Alerts**: Notify when drivers exceed shift hours
5. **Shift Templates**: Recurring shift patterns
6. **Multi-Team Support**: Manage shifts across multiple locations
7. **Driver Preferences**: Allow drivers to set preferred shifts
8. **Shift Trading**: Let drivers swap shifts with approval

