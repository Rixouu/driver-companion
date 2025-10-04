# Driver Shift Management - SQL Queries Reference

## Quick Start Queries

### 1. Get Current Week Schedule (Most Common)
```sql
SELECT * FROM get_shift_schedule(
  DATE_TRUNC('week', CURRENT_DATE)::DATE,
  (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE,
  NULL
);
```

### 2. Get Today's Assignments
```sql
SELECT 
  d.first_name || ' ' || d.last_name AS driver_name,
  b.wp_id,
  b.time,
  b.customer_name,
  b.service_name,
  b.pickup_location,
  b.dropoff_location,
  b.status
FROM bookings b
JOIN drivers d ON b.driver_id = d.id
WHERE b.date = CURRENT_DATE
  AND b.driver_id IS NOT NULL
  AND d.deleted_at IS NULL
ORDER BY b.time;
```

### 3. Get Unassigned Bookings for Today
```sql
SELECT 
  b.wp_id,
  b.time,
  b.customer_name,
  b.service_name,
  b.service_type,
  b.pickup_location,
  b.dropoff_location,
  b.duration_hours,
  b.price_formatted
FROM bookings b
WHERE b.date = CURRENT_DATE
  AND b.driver_id IS NULL
  AND b.status NOT IN ('cancelled', 'completed')
ORDER BY b.time;
```

### 4. Check Driver Availability
```sql
SELECT * FROM check_driver_availability(
  'driver-uuid-here',
  '2025-10-15',
  '09:00',
  4
);
```

### 5. Get Monthly Driver Statistics
```sql
SELECT 
  driver_name,
  total_shifts,
  completed_shifts,
  total_bookings,
  completed_bookings,
  total_hours,
  TO_CHAR(total_revenue, 'FM¥999,999,999') AS revenue
FROM monthly_shift_overview
WHERE month = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY total_revenue DESC;
```

## Detailed Queries

### Get Driver Schedule for Specific Month
```sql
SELECT * FROM get_shift_schedule(
  DATE_TRUNC('month', '2025-10-01'::DATE)::DATE,
  (DATE_TRUNC('month', '2025-10-01'::DATE) + INTERVAL '1 month - 1 day')::DATE,
  NULL
);
```

### Get Available Drivers for a Time Slot
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
  ca.*
FROM drivers d
JOIN available_drivers ad ON d.id = ad.driver_id
CROSS JOIN LATERAL check_driver_availability(
  d.id, '2025-10-15', '09:00', 4
) ca
WHERE d.deleted_at IS NULL
  AND ca.is_available = TRUE;
```

### Get Driver Workload for Current Week
```sql
SELECT 
  d.first_name || ' ' || d.last_name AS driver_name,
  DATE(b.date) AS day,
  COUNT(b.id) AS bookings,
  SUM(COALESCE(b.duration_hours, 0)) AS hours,
  SUM(COALESCE(b.price_amount, 0)) AS revenue
FROM drivers d
LEFT JOIN bookings b ON d.id = b.driver_id
WHERE d.deleted_at IS NULL
  AND b.date BETWEEN DATE_TRUNC('week', CURRENT_DATE) 
               AND (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')
  AND b.status NOT IN ('cancelled')
GROUP BY d.id, d.first_name, d.last_name, DATE(b.date)
ORDER BY day, driver_name;
```

### Get Shift Coverage Report
```sql
WITH date_series AS (
  SELECT generate_series(
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '6 days',
    '1 day'::INTERVAL
  )::DATE AS shift_date
)
SELECT 
  TO_CHAR(d.shift_date, 'Day, Mon DD') AS date,
  COUNT(DISTINCT ds.driver_id) AS drivers_scheduled,
  COUNT(DISTINCT b.id) AS total_bookings,
  COUNT(DISTINCT CASE WHEN b.driver_id IS NOT NULL THEN b.id END) AS assigned,
  COUNT(DISTINCT CASE WHEN b.driver_id IS NULL THEN b.id END) AS unassigned
FROM date_series d
LEFT JOIN driver_shifts ds ON d.shift_date = ds.shift_date
LEFT JOIN bookings b ON d.shift_date = b.date AND b.status NOT IN ('cancelled')
GROUP BY d.shift_date
ORDER BY d.shift_date;
```

## Management Queries

### Create a Shift
```sql
INSERT INTO driver_shifts (
  driver_id,
  shift_date,
  shift_start_time,
  shift_end_time,
  shift_type,
  status,
  notes,
  created_by
) VALUES (
  'driver-uuid-here',
  '2025-10-15',
  '08:00',
  '17:00',
  'regular',
  'scheduled',
  'Normal shift',
  'user-uuid-here'
);
```

### Update Shift Status
```sql
UPDATE driver_shifts
SET status = 'completed',
    updated_at = NOW(),
    updated_by = 'user-uuid-here'
WHERE id = 'shift-uuid-here';
```

### Assign Booking to Driver
```sql
UPDATE bookings
SET driver_id = 'driver-uuid-here',
    updated_at = NOW(),
    updated_by = 'user-uuid-here'
WHERE id = 'booking-uuid-here';
```

### Cancel a Shift
```sql
UPDATE driver_shifts
SET status = 'cancelled',
    updated_at = NOW(),
    updated_by = 'user-uuid-here'
WHERE id = 'shift-uuid-here';
```

## Analytics Queries

### Driver Performance Comparison (Last 30 Days)
```sql
SELECT 
  d.first_name || ' ' || d.last_name AS driver,
  COUNT(DISTINCT b.id) AS total_bookings,
  COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) AS completed,
  SUM(COALESCE(b.duration_hours, 0)) AS total_hours,
  SUM(COALESCE(b.price_amount, 0)) AS total_revenue,
  ROUND(
    COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT b.id), 0) * 100, 
    2
  ) AS completion_rate
FROM drivers d
LEFT JOIN bookings b ON d.id = b.driver_id
WHERE d.deleted_at IS NULL
  AND b.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY d.id, d.first_name, d.last_name
ORDER BY total_revenue DESC;
```

### Peak Hours Analysis
```sql
SELECT 
  EXTRACT(HOUR FROM b.time::TIME) AS hour,
  COUNT(*) AS booking_count,
  COUNT(DISTINCT b.driver_id) AS drivers_needed,
  COUNT(DISTINCT CASE WHEN b.driver_id IS NULL THEN b.id END) AS unassigned
FROM bookings b
WHERE b.date >= CURRENT_DATE - INTERVAL '30 days'
  AND b.status NOT IN ('cancelled')
GROUP BY EXTRACT(HOUR FROM b.time::TIME)
ORDER BY hour;
```

### Service Type Distribution
```sql
SELECT 
  b.service_type,
  COUNT(*) AS total_bookings,
  COUNT(DISTINCT b.driver_id) AS unique_drivers,
  AVG(b.duration_hours) AS avg_duration,
  AVG(b.price_amount) AS avg_price
FROM bookings b
WHERE b.date >= CURRENT_DATE - INTERVAL '30 days'
  AND b.status NOT IN ('cancelled')
GROUP BY b.service_type
ORDER BY total_bookings DESC;
```

## Optimization Queries

### Find Drivers with Light Workload
```sql
SELECT 
  d.id,
  d.first_name || ' ' || d.last_name AS driver_name,
  COUNT(b.id) AS booking_count,
  SUM(COALESCE(b.duration_hours, 0)) AS total_hours
FROM drivers d
LEFT JOIN bookings b ON d.id = b.driver_id 
  AND b.date = CURRENT_DATE
  AND b.status NOT IN ('cancelled')
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.first_name, d.last_name
HAVING COUNT(b.id) < 3
ORDER BY booking_count ASC, total_hours ASC;
```

### Identify Scheduling Conflicts
```sql
SELECT 
  d.first_name || ' ' || d.last_name AS driver,
  b1.wp_id AS booking1,
  b1.time AS time1,
  b1.duration_hours AS duration1,
  b2.wp_id AS booking2,
  b2.time AS time2,
  b2.duration_hours AS duration2
FROM bookings b1
JOIN bookings b2 ON b1.driver_id = b2.driver_id 
  AND b1.date = b2.date
  AND b1.id < b2.id
JOIN drivers d ON b1.driver_id = d.id
WHERE (
  b1.time::TIME,
  (b1.time::TIME + (COALESCE(b1.duration_hours, 1) || ' hours')::INTERVAL)
) OVERLAPS (
  b2.time::TIME,
  (b2.time::TIME + (COALESCE(b2.duration_hours, 1) || ' hours')::INTERVAL)
)
AND b1.status NOT IN ('cancelled')
AND b2.status NOT IN ('cancelled')
ORDER BY b1.date, d.last_name;
```

## Export Queries

### Export Weekly Schedule (CSV Format)
```sql
SELECT 
  d.first_name || ' ' || d.last_name AS "Driver",
  TO_CHAR(b.date, 'YYYY-MM-DD') AS "Date",
  b.time AS "Time",
  b.wp_id AS "Booking ID",
  b.customer_name AS "Customer",
  b.service_name AS "Service",
  b.pickup_location AS "Pickup",
  b.dropoff_location AS "Dropoff",
  b.duration_hours AS "Hours",
  b.price_formatted AS "Price",
  b.status AS "Status"
FROM drivers d
LEFT JOIN bookings b ON d.id = b.driver_id
WHERE d.deleted_at IS NULL
  AND b.date BETWEEN DATE_TRUNC('week', CURRENT_DATE) 
               AND (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')
ORDER BY b.date, b.time, d.last_name;
```

### Export Monthly Summary
```sql
SELECT 
  driver_name AS "Driver",
  total_shifts AS "Total Shifts",
  completed_shifts AS "Completed",
  total_bookings AS "Bookings",
  total_hours AS "Hours",
  ROUND(total_revenue::NUMERIC, 2) AS "Revenue (¥)",
  ROUND((completed_bookings::NUMERIC / NULLIF(total_bookings, 0)) * 100, 2) AS "Completion %"
FROM monthly_shift_overview
WHERE month = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY total_revenue DESC;
```

