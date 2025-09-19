-- Phase 3A: Final Critical Foreign Key Indexes
-- Essential indexes for foreign key relationships and performance

-- =============================================
-- BOOKINGS TABLE - Missing Foreign Key Indexes
-- =============================================

-- Bookings: customer_id (most critical for customer queries)
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id 
ON bookings (customer_id);

-- Bookings: vehicle_id (vehicle assignment queries)
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id 
ON bookings (vehicle_id);

-- Bookings: updated_by (audit trail queries)
CREATE INDEX IF NOT EXISTS idx_bookings_updated_by 
ON bookings (updated_by);

-- =============================================
-- QUOTATIONS TABLE - Missing Foreign Key Indexes
-- =============================================

-- Quotations: customer_id (customer quotation queries)
CREATE INDEX IF NOT EXISTS idx_quotations_customer_id 
ON quotations (customer_id);

-- Quotations: service_type_id (service type filtering)
CREATE INDEX IF NOT EXISTS idx_quotations_service_type_id 
ON quotations (service_type_id);

-- Quotations: approved_by (approval workflow queries)
CREATE INDEX IF NOT EXISTS idx_quotations_approved_by 
ON quotations (approved_by);

-- Quotations: rejected_by (rejection workflow queries)
CREATE INDEX IF NOT EXISTS idx_quotations_rejected_by 
ON quotations (rejected_by);

-- Quotations: merchant_id (merchant-specific queries)
CREATE INDEX IF NOT EXISTS idx_quotations_merchant_id 
ON quotations (merchant_id);

-- =============================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- =============================================

-- Bookings: customer_id + status (customer booking status queries)
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status 
ON bookings (customer_id, status);

-- Bookings: vehicle_id + status (vehicle assignment status queries)
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_status 
ON bookings (vehicle_id, status);

-- Quotations: customer_id + status (customer quotation status queries)
CREATE INDEX IF NOT EXISTS idx_quotations_customer_status 
ON quotations (customer_id, status);

-- Quotations: service_type_id + status (service type status queries)
CREATE INDEX IF NOT EXISTS idx_quotations_service_status 
ON quotations (service_type_id, status);

-- =============================================
-- ANALYZE TABLES FOR OPTIMIZER
-- =============================================

-- Update table statistics for the query planner
ANALYZE bookings;
ANALYZE quotations;

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
    'idx_bookings_customer_id',
    'idx_bookings_vehicle_id',
    'idx_bookings_updated_by',
    'idx_quotations_customer_id',
    'idx_quotations_service_type_id',
    'idx_quotations_approved_by',
    'idx_quotations_rejected_by',
    'idx_quotations_merchant_id',
    'idx_bookings_customer_status',
    'idx_bookings_vehicle_status',
    'idx_quotations_customer_status',
    'idx_quotations_service_status'
  )
ORDER BY tablename, indexname;
