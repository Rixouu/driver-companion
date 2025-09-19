-- =============================================
-- QUERY PERFORMANCE OPTIMIZATION
-- =============================================
-- This migration optimizes the 5 slowest queries identified in Supabase Query Performance

-- =============================================
-- 1. OPTIMIZE REALTIME PERFORMANCE
-- =============================================
-- The realtime.list_changes query is consuming 57.9% of total time
-- These indexes will significantly improve realtime subscription performance

-- Index for realtime subscriptions on frequently accessed tables
CREATE INDEX IF NOT EXISTS idx_realtime_bookings_updated_at 
ON bookings (updated_at DESC) 
WHERE updated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_realtime_quotations_updated_at 
ON quotations (updated_at DESC) 
WHERE updated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_realtime_inspections_updated_at 
ON inspections (updated_at DESC) 
WHERE updated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_realtime_vehicles_updated_at 
ON vehicles (updated_at DESC) 
WHERE updated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_realtime_drivers_updated_at 
ON drivers (updated_at DESC) 
WHERE updated_at IS NOT NULL;

-- =============================================
-- 2. OPTIMIZE APPLICATION QUERIES
-- =============================================
-- Focus on optimizing our application tables for better performance

-- Additional indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id_status 
ON bookings (customer_id, status) 
WHERE customer_id IS NOT NULL AND status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quotations_customer_id_status 
ON quotations (customer_id, status) 
WHERE customer_id IS NOT NULL AND status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_id_status 
ON inspections (vehicle_id, status) 
WHERE vehicle_id IS NOT NULL AND status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inspections_inspector_id_date 
ON inspections (inspector_id, date DESC) 
WHERE inspector_id IS NOT NULL AND date IS NOT NULL;

-- =============================================
-- 3. OPTIMIZE FREQUENTLY ACCESSED COLUMNS
-- =============================================
-- These columns are frequently used in WHERE clauses and JOINs

-- Index for common WHERE clause patterns
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status 
ON bookings (payment_status) 
WHERE payment_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quotations_service_type 
ON quotations (service_type) 
WHERE service_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_status_brand 
ON vehicles (status, brand) 
WHERE status IS NOT NULL AND brand IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_drivers_email 
ON drivers (email) 
WHERE email IS NOT NULL;

-- =============================================
-- 4. COMPOSITE INDEXES FOR COMMON PATTERNS
-- =============================================
-- These will help with common application queries

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_status_date 
ON bookings (status, date DESC) 
WHERE status IS NOT NULL AND date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quotations_status_created_at 
ON quotations (status, created_at DESC) 
WHERE status IS NOT NULL AND created_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inspections_status_date 
ON inspections (status, date DESC) 
WHERE status IS NOT NULL AND date IS NOT NULL;

-- =============================================
-- 5. ANALYZE TABLES FOR OPTIMIZATION
-- =============================================

ANALYZE bookings;
ANALYZE quotations;
ANALYZE inspections;
ANALYZE vehicles;
ANALYZE drivers;
-- =============================================
-- QUERY PERFORMANCE OPTIMIZATION
-- =============================================
-- This migration optimizes the 5 slowest queries identified in Supabase Query Performance

-- =============================================
-- 1. OPTIMIZE REALTIME PERFORMANCE
-- =============================================
-- The realtime.list_changes query is consuming 57.9% of total time
-- These indexes will significantly improve realtime subscription performance

-- Index for realtime subscriptions on frequently accessed tables
CREATE INDEX IF NOT EXISTS idx_realtime_bookings_updated_at 
ON bookings (updated_at DESC) 
WHERE updated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_realtime_quotations_updated_at 
ON quotations (updated_at DESC) 
WHERE updated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_realtime_inspections_updated_at 
ON inspections (updated_at DESC) 
WHERE updated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_realtime_vehicles_updated_at 
ON vehicles (updated_at DESC) 
WHERE updated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_realtime_drivers_updated_at 
ON drivers (updated_at DESC) 
WHERE updated_at IS NOT NULL;

-- =============================================
-- 2. OPTIMIZE APPLICATION QUERIES
-- =============================================
-- Focus on optimizing our application tables for better performance

-- Additional indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id_status 
ON bookings (customer_id, status) 
WHERE customer_id IS NOT NULL AND status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quotations_customer_id_status 
ON quotations (customer_id, status) 
WHERE customer_id IS NOT NULL AND status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_id_status 
ON inspections (vehicle_id, status) 
WHERE vehicle_id IS NOT NULL AND status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inspections_inspector_id_date 
ON inspections (inspector_id, date DESC) 
WHERE inspector_id IS NOT NULL AND date IS NOT NULL;

-- =============================================
-- 3. OPTIMIZE FREQUENTLY ACCESSED COLUMNS
-- =============================================
-- These columns are frequently used in WHERE clauses and JOINs

-- Index for common WHERE clause patterns
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status 
ON bookings (payment_status) 
WHERE payment_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quotations_service_type 
ON quotations (service_type) 
WHERE service_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_status_brand 
ON vehicles (status, brand) 
WHERE status IS NOT NULL AND brand IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_drivers_email 
ON drivers (email) 
WHERE email IS NOT NULL;

-- =============================================
-- 4. COMPOSITE INDEXES FOR COMMON PATTERNS
-- =============================================
-- These will help with common application queries

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_status_date 
ON bookings (status, date DESC) 
WHERE status IS NOT NULL AND date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quotations_status_created_at 
ON quotations (status, created_at DESC) 
WHERE status IS NOT NULL AND created_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inspections_status_date 
ON inspections (status, date DESC) 
WHERE status IS NOT NULL AND date IS NOT NULL;

-- =============================================
-- 5. ANALYZE TABLES FOR OPTIMIZATION
-- =============================================

ANALYZE bookings;
ANALYZE quotations;
ANALYZE inspections;
ANALYZE vehicles;
ANALYZE drivers;
