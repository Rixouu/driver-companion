# 🚗 Driver Shift Management System - Setup Guide

## 📋 Overview

I've created a comprehensive **Driver Shift Management System** based on your Excel template. This system provides a calendar-style grid view of driver schedules with booking assignments, similar to your spreadsheet.

## 🎯 What's Been Created

### 1. **Database Schema** ✅
- **Table**: `driver_shifts` - Stores planned shifts for drivers
- **Views**: 
  - `driver_shift_schedule` - Combined driver, shift, and booking data
  - `monthly_shift_overview` - Monthly statistics per driver
- **Functions**:
  - `get_shift_schedule(start_date, end_date, driver_ids[])` - Fetch schedule with bookings
  - `check_driver_availability(driver_id, date, time, duration)` - Check availability
- **Triggers & Policies**: RLS policies for security, auto-update timestamps

📄 **File**: `database/migrations/create_driver_shifts_table.sql`

### 2. **API Routes** ✅
- **GET** `/api/shifts/schedule` - Get shift schedule for date range
- **GET** `/api/shifts/availability` - Check driver availability
- **GET** `/api/shifts` - List shifts with filters
- **POST** `/api/shifts` - Create new shift
- **GET** `/api/shifts/[id]` - Get single shift
- **PATCH** `/api/shifts/[id]` - Update shift
- **DELETE** `/api/shifts/[id]` - Cancel shift

📁 **Files**: 
- `app/api/shifts/schedule/route.ts`
- `app/api/shifts/availability/route.ts`
- `app/api/shifts/route.ts`
- `app/api/shifts/[id]/route.ts`

### 3. **Custom Hooks** ✅
- `useShiftSchedule()` - Fetch and manage shift schedule data
- `useDriverAvailability()` - Check driver availability in real-time

📄 **File**: `lib/hooks/use-shift-schedule.ts`

### 4. **TypeScript Types** ✅
Complete type definitions for shifts, bookings, drivers, and UI components

📄 **File**: `types/shifts.ts`

### 5. **Documentation** ✅
- **Feature Guide**: Comprehensive documentation with examples
- **SQL Queries Reference**: 20+ ready-to-use SQL queries

📁 **Files**:
- `docs/features/driver-shift-management.md`
- `docs/features/shift-sql-queries.md`

## 🚀 Quick Start - Running SQL Queries

### Step 1: Create the Database Tables

Run this migration first to create the tables and functions:

```bash
# Copy the SQL file to your database
psql your_database < database/migrations/create_driver_shifts_table.sql
```

Or in Supabase Dashboard:
1. Go to **SQL Editor**
2. Open `database/migrations/create_driver_shifts_table.sql`
3. Execute the entire file

### Step 2: Test the Queries

Here are the most useful queries to get started:

#### 🔹 **Get Current Week Schedule**
```sql
SELECT * FROM get_shift_schedule(
  DATE_TRUNC('week', CURRENT_DATE)::DATE,
  (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE,
  NULL
);
```

#### 🔹 **Get Today's Assignments**
```sql
SELECT 
  d.first_name || ' ' || d.last_name AS driver_name,
  b.wp_id,
  b.time,
  b.customer_name,
  b.service_name,
  b.pickup_location,
  b.status
FROM bookings b
JOIN drivers d ON b.driver_id = d.id
WHERE b.date = CURRENT_DATE
  AND b.driver_id IS NOT NULL
ORDER BY b.time;
```

#### 🔹 **Get Unassigned Bookings**
```sql
SELECT 
  b.wp_id,
  b.time,
  b.customer_name,
  b.service_name,
  b.pickup_location,
  b.dropoff_location
FROM bookings b
WHERE b.date = CURRENT_DATE
  AND b.driver_id IS NULL
  AND b.status NOT IN ('cancelled', 'completed')
ORDER BY b.time;
```

#### 🔹 **Check Driver Availability**
```sql
-- Example: Check if driver can take a 4-hour booking at 9am on Oct 15
SELECT * FROM check_driver_availability(
  'your-driver-uuid-here',
  '2025-10-15',
  '09:00',
  4
);
```

#### 🔹 **Monthly Driver Statistics**
```sql
SELECT 
  driver_name,
  total_shifts,
  completed_shifts,
  total_bookings,
  total_hours,
  TO_CHAR(total_revenue, 'FM¥999,999,999') AS revenue
FROM monthly_shift_overview
WHERE month = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY total_revenue DESC;
```

## 📊 What This System Provides

### Features Matching Your Excel Template:

✅ **Calendar Grid Layout**
- Drivers in rows (like your Excel row headers DD-001, DD-002, etc.)
- Dates across columns (like your Excel columns MAX/1, MAX/2, etc.)
- Cells showing bookings for each driver/date combination

✅ **Color-Coded Bookings**
- Different colors for booking status (confirmed, pending, etc.)
- Visual indicators for shift types (regular, overtime, special)

✅ **Booking Details in Cells**
- Customer name
- Service type
- Time and duration
- Pickup/dropoff locations
- Price/revenue

✅ **Driver Management**
- View all drivers and their schedules
- Filter by driver, date range, or status
- Quick access to driver contact info

✅ **Analytics**
- Total bookings per driver
- Hours worked per shift
- Revenue generated
- Utilization rates
- Completion rates

## 🎨 Next Steps - Building the UI

### What Still Needs to Be Created:

1. **Shift Schedule Page Component** (`app/(dashboard)/shifts/page.tsx`)
   - Main page with calendar grid
   - Date range selector
   - Driver filters

2. **Shift Calendar Grid Component** (`components/shifts/shift-calendar-grid.tsx`)
   - Grid layout with drivers × dates
   - Responsive design
   - Scroll handling

3. **Booking Cell Component** (`components/shifts/booking-cell.tsx`)
   - Color-coded cells
   - Booking details on hover/click
   - Status indicators

4. **Driver Shift Row Component** (`components/shifts/driver-shift-row.tsx`)
   - Individual driver row with all dates
   - Booking cells for each date

5. **Drag & Drop Functionality**
   - Reassign bookings between drivers
   - Visual feedback during drag
   - Conflict detection

6. **Assignment Modal**
   - Assign unassigned bookings
   - Search and select driver
   - Check availability before assignment

Would you like me to create these UI components next? I can start with the main shift schedule page and work through the grid, cells, and interactive features.

## 📖 Documentation Files

- **`docs/features/driver-shift-management.md`** - Complete feature documentation
- **`docs/features/shift-sql-queries.md`** - All SQL queries with examples
- **`types/shifts.ts`** - TypeScript type definitions
- **`lib/hooks/use-shift-schedule.ts`** - React hooks for data fetching

## 🔧 Configuration

### API Endpoints Available:

- **GET** `/api/shifts/schedule?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&driver_ids[]=uuid`
- **GET** `/api/shifts/availability?driver_id=uuid&date=YYYY-MM-DD&start_time=HH:MM&duration=N`
- **GET** `/api/shifts?driver_id=uuid&start_date=YYYY-MM-DD&status=scheduled`
- **POST** `/api/shifts` (Create shift)
- **PATCH** `/api/shifts/[id]` (Update shift)
- **DELETE** `/api/shifts/[id]` (Cancel shift)

## 🎯 Ready to Use

All backend functionality is ready:
- ✅ Database schema created
- ✅ SQL functions and views
- ✅ API routes implemented
- ✅ Custom hooks created
- ✅ TypeScript types defined
- ✅ Documentation written

**What's next?**
1. Run the migration SQL
2. Test the queries
3. Build the UI components
4. Connect everything together

Let me know if you'd like me to proceed with creating the UI components to visualize this shift schedule data! 🚀

