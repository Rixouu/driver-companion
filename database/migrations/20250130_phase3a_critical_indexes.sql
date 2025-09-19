-- Phase 3A.1: Critical Database Indexes for Performance Optimization
-- This migration creates all the missing indexes identified in the database analysis

-- =============================================
-- QUOTATIONS TABLE INDEXES
-- =============================================

-- Index for status and created_at ordering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_quotations_status_created_at 
ON quotations (status, created_at DESC);

-- Index for customer email lookups
CREATE INDEX IF NOT EXISTS idx_quotations_customer_email 
ON quotations (customer_email);

-- Composite index for customer name searches
CREATE INDEX IF NOT EXISTS idx_quotations_customer_name 
ON quotations (customer_name);

-- Index for title searches
CREATE INDEX IF NOT EXISTS idx_quotations_title 
ON quotations (title);

-- GIN index for full-text search across multiple columns
CREATE INDEX IF NOT EXISTS idx_quotations_text_search 
ON quotations USING gin(to_tsvector('english', 
  COALESCE(customer_name, '') || ' ' || 
  COALESCE(customer_email, '') || ' ' || 
  COALESCE(title, '')
));

-- Index for quotation number lookups
CREATE INDEX IF NOT EXISTS idx_quotations_quote_number 
ON quotations (quote_number);

-- Index for payment status filtering
CREATE INDEX IF NOT EXISTS idx_quotations_payment_status 
ON quotations (payment_status);

-- =============================================
-- BOOKINGS TABLE INDEXES
-- =============================================

-- Index for date and status filtering (most common booking query)
CREATE INDEX IF NOT EXISTS idx_bookings_date_status 
ON bookings (date, status);

-- Index for created_at ordering
CREATE INDEX IF NOT EXISTS idx_bookings_created_at 
ON bookings (created_at DESC);

-- Index for customer email lookups
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email 
ON bookings (customer_email);

-- Index for customer name searches
CREATE INDEX IF NOT EXISTS idx_bookings_customer_name 
ON bookings (customer_name);

-- Index for vehicle_id lookups
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id 
ON bookings (vehicle_id);

-- Index for driver_id lookups
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id 
ON bookings (driver_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_bookings_status 
ON bookings (status);

-- Index for pickup_location searches
CREATE INDEX IF NOT EXISTS idx_bookings_pickup_location 
ON bookings (pickup_location);

-- =============================================
-- INSPECTIONS TABLE INDEXES
-- =============================================

-- Index for vehicle_id and created_at (most common inspection query)
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_id_created_at 
ON inspections (vehicle_id, created_at DESC);

-- Index for inspector_id and created_at
CREATE INDEX IF NOT EXISTS idx_inspections_inspector_id_created_at 
ON inspections (inspector_id, created_at DESC);

-- Index for status and created_at filtering
CREATE INDEX IF NOT EXISTS idx_inspections_status_created_at 
ON inspections (status, created_at DESC);

-- Index for date filtering
CREATE INDEX IF NOT EXISTS idx_inspections_date 
ON inspections (date DESC);

-- Index for inspection type filtering
CREATE INDEX IF NOT EXISTS idx_inspections_type 
ON inspections (type);

-- Index for created_by user lookups
CREATE INDEX IF NOT EXISTS idx_inspections_created_by 
ON inspections (created_by);

-- =============================================
-- VEHICLES TABLE INDEXES
-- =============================================

-- Index for status and created_at ordering
CREATE INDEX IF NOT EXISTS idx_vehicles_status_created_at 
ON vehicles (status, created_at DESC);

-- Index for brand and model searches
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_model 
ON vehicles (brand, model);

-- Index for plate_number lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_plate_number 
ON vehicles (plate_number);

-- Index for VIN lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_vin 
ON vehicles (vin);

-- Index for year filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_year 
ON vehicles (year);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_status 
ON vehicles (status);

-- =============================================
-- DRIVERS TABLE INDEXES
-- =============================================

-- Index for status and created_at ordering
CREATE INDEX IF NOT EXISTS idx_drivers_status_created_at 
ON drivers (status, created_at DESC);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_drivers_email 
ON drivers (email);

-- Index for phone lookups
CREATE INDEX IF NOT EXISTS idx_drivers_phone 
ON drivers (phone);

-- Index for license_number lookups
CREATE INDEX IF NOT EXISTS idx_drivers_license_number 
ON drivers (license_number);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_drivers_status 
ON drivers (status);

-- =============================================
-- QUOTATION_ITEMS TABLE INDEXES
-- =============================================

-- Index for quotation_id lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id 
ON quotation_items (quotation_id);

-- Index for service_type_id lookups
CREATE INDEX IF NOT EXISTS idx_quotation_items_service_type_id 
ON quotation_items (service_type_id);

-- Index for vehicle_type filtering
CREATE INDEX IF NOT EXISTS idx_quotation_items_vehicle_type 
ON quotation_items (vehicle_type);

-- Index for vehicle_category filtering
CREATE INDEX IF NOT EXISTS idx_quotation_items_vehicle_category 
ON quotation_items (vehicle_category);

-- =============================================
-- INSPECTION_ITEMS TABLE INDEXES
-- =============================================

-- Index for inspection_id lookups
CREATE INDEX IF NOT EXISTS idx_inspection_items_inspection_id 
ON inspection_items (inspection_id);

-- Index for template_id lookups
CREATE INDEX IF NOT EXISTS idx_inspection_items_template_id 
ON inspection_items (template_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_inspection_items_status 
ON inspection_items (status);

-- =============================================
-- INSPECTION_PHOTOS TABLE INDEXES
-- =============================================

-- Index for inspection_item_id lookups
CREATE INDEX IF NOT EXISTS idx_inspection_photos_inspection_item_id 
ON inspection_photos (inspection_item_id);

-- Index for inspection_id lookups
CREATE INDEX IF NOT EXISTS idx_inspection_photos_inspection_id 
ON inspection_photos (inspection_id);

-- =============================================
-- PRICING TABLES INDEXES
-- =============================================

-- Pricing categories indexes
CREATE INDEX IF NOT EXISTS idx_pricing_categories_name 
ON pricing_categories (name);

-- Pricing items indexes
CREATE INDEX IF NOT EXISTS idx_pricing_items_category_id 
ON pricing_items (pricing_category_id);

CREATE INDEX IF NOT EXISTS idx_pricing_items_name 
ON pricing_items (name);

-- Pricing category vehicles indexes
CREATE INDEX IF NOT EXISTS idx_pricing_category_vehicles_category_id 
ON pricing_category_vehicles (pricing_category_id);

CREATE INDEX IF NOT EXISTS idx_pricing_category_vehicles_vehicle_id 
ON pricing_category_vehicles (vehicle_id);

-- =============================================
-- NOTIFICATIONS TABLE INDEXES
-- =============================================

-- Index for user_id and created_at
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
ON notifications (user_id, created_at DESC);

-- Index for type filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications (type);

-- Index for read status
CREATE INDEX IF NOT EXISTS idx_notifications_read 
ON notifications (read);

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
ANALYZE inspection_items;
ANALYZE inspection_photos;
ANALYZE pricing_categories;
ANALYZE pricing_items;
ANALYZE pricing_category_vehicles;
ANALYZE notifications;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify indexes were created successfully
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
