-- Phase 3A: Targeted Database Optimizations
-- Based on analysis of actual database structure and existing indexes

-- =============================================
-- MISSING CRITICAL INDEXES
-- =============================================

-- 1. Quotations: status + created_at (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_quotations_status_created_at 
ON quotations (status, created_at DESC);

-- 2. Inspections: inspector_id + created_at (inspector performance queries)
CREATE INDEX IF NOT EXISTS idx_inspections_inspector_id_created_at 
ON inspections (inspector_id, created_at DESC);

-- 3. Quotations: customer_name for search (text search optimization)
CREATE INDEX IF NOT EXISTS idx_quotations_customer_name 
ON quotations (customer_name);

-- 4. Quotations: title for search (text search optimization)
CREATE INDEX IF NOT EXISTS idx_quotations_title 
ON quotations (title);

-- 5. Bookings: date + status (common booking queries)
CREATE INDEX IF NOT EXISTS idx_bookings_date_status 
ON bookings (date, status);

-- 6. Bookings: created_at for ordering
CREATE INDEX IF NOT EXISTS idx_bookings_created_at 
ON bookings (created_at DESC);

-- 7. Inspections: status + created_at (inspection status queries)
CREATE INDEX IF NOT EXISTS idx_inspections_status_created_at 
ON inspections (status, created_at DESC);

-- 8. Vehicles: status + created_at (vehicle management queries)
CREATE INDEX IF NOT EXISTS idx_vehicles_status_created_at 
ON vehicles (status, created_at DESC);

-- 9. Drivers: created_at (driver management queries - no status column)
CREATE INDEX IF NOT EXISTS idx_drivers_created_at 
ON drivers (created_at DESC);

-- 10. Quotation Items: service_type_id for filtering
CREATE INDEX IF NOT EXISTS idx_quotation_items_service_type_id 
ON quotation_items (service_type_id);

-- 11. Quotation Items: vehicle_type for filtering
CREATE INDEX IF NOT EXISTS idx_quotation_items_vehicle_type 
ON quotation_items (vehicle_type);

-- 12. Quotation Items: vehicle_category for filtering
CREATE INDEX IF NOT EXISTS idx_quotation_items_vehicle_category 
ON quotation_items (vehicle_category);

-- =============================================
-- TEXT SEARCH OPTIMIZATION
-- =============================================

-- GIN index for full-text search across quotations
CREATE INDEX IF NOT EXISTS idx_quotations_text_search 
ON quotations USING gin(to_tsvector('english', 
  COALESCE(customer_name, '') || ' ' || 
  COALESCE(customer_email, '') || ' ' || 
  COALESCE(title, '')
));

-- =============================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- =============================================

-- Quotations: status + team_location + created_at
CREATE INDEX IF NOT EXISTS idx_quotations_status_location_created 
ON quotations (status, team_location, created_at DESC);

-- Bookings: status + team_location + date
CREATE INDEX IF NOT EXISTS idx_bookings_status_location_date 
ON bookings (status, team_location, date);

-- Inspections: vehicle_id + status + date
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_status_date 
ON inspections (vehicle_id, status, date DESC);

-- =============================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- =============================================

-- Active quotations only
CREATE INDEX IF NOT EXISTS idx_quotations_active_created_at 
ON quotations (created_at DESC) 
WHERE status IN ('sent', 'pending', 'approved');

-- Pending bookings only
CREATE INDEX IF NOT EXISTS idx_bookings_pending_date 
ON bookings (date, created_at DESC) 
WHERE status = 'pending';

-- Active vehicles only
CREATE INDEX IF NOT EXISTS idx_vehicles_active_created_at 
ON vehicles (created_at DESC) 
WHERE status = 'active';

-- Active drivers only (using deleted_at IS NULL as active indicator)
CREATE INDEX IF NOT EXISTS idx_drivers_active_created_at 
ON drivers (created_at DESC) 
WHERE deleted_at IS NULL;

-- =============================================
-- ANALYZE TABLES FOR OPTIMIZER
-- =============================================

-- Update table statistics for the query planner
ANALYZE quotations;
ANALYZE bookings;
ANALYZE inspections;
ANALYZE vehicles;
ANALYZE drivers;
ANALYZE quotation_items;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify new indexes were created successfully
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname IN (
    'idx_quotations_status_created_at',
    'idx_inspections_inspector_id_created_at',
    'idx_quotations_customer_name',
    'idx_quotations_title',
    'idx_bookings_date_status',
    'idx_bookings_created_at',
    'idx_inspections_status_created_at',
    'idx_vehicles_status_created_at',
    'idx_drivers_status_created_at',
    'idx_quotations_text_search'
  )
ORDER BY tablename, indexname;
