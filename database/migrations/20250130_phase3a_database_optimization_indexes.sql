-- Phase 3A: Database Performance Optimization - Indexes
-- This migration adds critical missing indexes for query performance

-- ==============================================
-- QUOTATIONS TABLE OPTIMIZATIONS
-- ==============================================

-- Composite index for status and created_at (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_quotations_status_created_at 
ON quotations(status, created_at DESC);

-- Index for customer email lookups
CREATE INDEX IF NOT EXISTS idx_quotations_customer_email 
ON quotations(customer_email);

-- Index for pickup date ordering
CREATE INDEX IF NOT EXISTS idx_quotations_pickup_date 
ON quotations(pickup_date DESC NULLS LAST);

-- GIN index for full-text search optimization
CREATE INDEX IF NOT EXISTS idx_quotations_text_search 
ON quotations USING gin(to_tsvector('english', 
  COALESCE(customer_name, '') || ' ' || 
  COALESCE(customer_email, '') || ' ' || 
  COALESCE(title, '')
));

-- Index for quotation items foreign key
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id 
ON quotation_items(quotation_id);

-- ==============================================
-- BOOKINGS TABLE OPTIMIZATIONS
-- ==============================================

-- Composite index for date and status filtering
CREATE INDEX IF NOT EXISTS idx_bookings_date_status 
ON bookings(date DESC, status);

-- Index for created_at ordering
CREATE INDEX IF NOT EXISTS idx_bookings_created_at 
ON bookings(created_at DESC);

-- Index for customer email lookups
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email 
ON bookings(customer_email);

-- Index for service type filtering
CREATE INDEX IF NOT EXISTS idx_bookings_service_type 
ON bookings(service_type);

-- Index for vehicle_id foreign key
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id 
ON bookings(vehicle_id);

-- ==============================================
-- INSPECTIONS TABLE OPTIMIZATIONS
-- ==============================================

-- Composite index for vehicle_id and created_at
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_id_created_at 
ON inspections(vehicle_id, created_at DESC);

-- Composite index for inspector_id and created_at
CREATE INDEX IF NOT EXISTS idx_inspections_inspector_id_created_at 
ON inspections(inspector_id, created_at DESC);

-- Composite index for status and created_at
CREATE INDEX IF NOT EXISTS idx_inspections_status_created_at 
ON inspections(status, created_at DESC);

-- Index for date ordering (inspections use 'date' column, not 'inspection_date')
CREATE INDEX IF NOT EXISTS idx_inspections_date 
ON inspections(date DESC NULLS LAST);

-- ==============================================
-- VEHICLES TABLE OPTIMIZATIONS
-- ==============================================

-- Composite index for status and created_at
CREATE INDEX IF NOT EXISTS idx_vehicles_status_created_at 
ON vehicles(status, created_at DESC);

-- Composite index for brand and model
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_model 
ON vehicles(brand, model);

-- Index for plate_number lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_plate_number 
ON vehicles(plate_number);

-- Index for year filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_year 
ON vehicles(year);

-- ==============================================
-- DRIVERS TABLE OPTIMIZATIONS
-- ==============================================

-- Composite index for status and created_at
CREATE INDEX IF NOT EXISTS idx_drivers_status_created_at 
ON drivers(status, created_at DESC);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_drivers_email 
ON drivers(email);

-- Index for user_id foreign key
CREATE INDEX IF NOT EXISTS idx_drivers_user_id 
ON drivers(user_id);

-- ==============================================
-- MAINTENANCE_TASKS TABLE OPTIMIZATIONS
-- ==============================================
-- NOTE: maintenance_tasks table does not exist in current schema
-- These indexes will be created when the table is added to the schema

-- Composite index for vehicle_id and created_at
-- CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_vehicle_id_created_at 
-- ON maintenance_tasks(vehicle_id, created_at DESC);

-- Composite index for status and due_date
-- CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_status_due_date 
-- ON maintenance_tasks(status, due_date);

-- Index for task_type filtering
-- CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_task_type 
-- ON maintenance_tasks(task_type);

-- ==============================================
-- CUSTOMERS TABLE OPTIMIZATIONS
-- ==============================================

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_customers_email 
ON customers(email);

-- Index for created_at ordering
CREATE INDEX IF NOT EXISTS idx_customers_created_at 
ON customers(created_at DESC);

-- Index for phone lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone 
ON customers(phone);

-- ==============================================
-- PRICING TABLES OPTIMIZATIONS
-- ==============================================

-- Index for pricing_categories
CREATE INDEX IF NOT EXISTS idx_pricing_categories_service_type 
ON pricing_categories(service_type);

-- Index for pricing_items
CREATE INDEX IF NOT EXISTS idx_pricing_items_category_id 
ON pricing_items(category_id);

-- Index for pricing_items service_type
CREATE INDEX IF NOT EXISTS idx_pricing_items_service_type 
ON pricing_items(service_type);

-- ==============================================
-- NOTIFICATIONS TABLE OPTIMIZATIONS
-- ==============================================

-- Composite index for user_id and created_at
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
ON notifications(user_id, created_at DESC);

-- Index for read status
CREATE INDEX IF NOT EXISTS idx_notifications_read 
ON notifications(read);

-- Index for notification_type
CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications(type);

-- ==============================================
-- ANALYZE TABLES FOR OPTIMIZER
-- ==============================================

-- Update table statistics for better query planning
ANALYZE quotations;
ANALYZE bookings;
ANALYZE inspections;
ANALYZE vehicles;
ANALYZE drivers;
-- ANALYZE maintenance_tasks; -- Table does not exist yet
ANALYZE customers;
ANALYZE quotation_items;
ANALYZE pricing_categories;
ANALYZE pricing_items;
ANALYZE notifications;

-- ==============================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON INDEX idx_quotations_status_created_at IS 'Optimizes quotations queries filtered by status and ordered by created_at';
COMMENT ON INDEX idx_quotations_text_search IS 'GIN index for full-text search on customer_name, customer_email, and title';
COMMENT ON INDEX idx_bookings_date_status IS 'Optimizes bookings queries filtered by date and status';
COMMENT ON INDEX idx_inspections_vehicle_id_created_at IS 'Optimizes inspections queries by vehicle with date ordering';
COMMENT ON INDEX idx_inspections_inspector_id_created_at IS 'Optimizes inspections queries by inspector with date ordering';
COMMENT ON INDEX idx_inspections_date IS 'Optimizes inspections queries ordered by inspection date';
COMMENT ON INDEX idx_vehicles_status_created_at IS 'Optimizes vehicles queries filtered by status and ordered by created_at';
