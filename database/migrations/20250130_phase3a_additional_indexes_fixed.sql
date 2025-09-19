-- Phase 3A: Additional Missing Indexes (FIXED)
-- Supplementary indexes for optimal performance - verified against actual schema

-- =============================================
-- INSPECTION-RELATED INDEXES
-- =============================================

-- Inspection items: inspection_id (most common query)
CREATE INDEX IF NOT EXISTS idx_inspection_items_inspection_id 
ON inspection_items (inspection_id);

-- Inspection items: template_id for template lookups
CREATE INDEX IF NOT EXISTS idx_inspection_items_template_id 
ON inspection_items (template_id);

-- Inspection items: status for filtering
CREATE INDEX IF NOT EXISTS idx_inspection_items_status 
ON inspection_items (status);

-- Inspection photos: inspection_item_id (most common query)
CREATE INDEX IF NOT EXISTS idx_inspection_photos_inspection_item_id 
ON inspection_photos (inspection_item_id);

-- Inspection photos: created_by for user queries
CREATE INDEX IF NOT EXISTS idx_inspection_photos_created_by 
ON inspection_photos (created_by);

-- =============================================
-- NOTIFICATION AND ACTIVITY INDEXES
-- =============================================

-- Notifications: user_id + created_at (user notification queries)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
ON notifications (user_id, created_at DESC);

-- Notifications: type for filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications (type);

-- Notifications: read status for unread queries
CREATE INDEX IF NOT EXISTS idx_notifications_read 
ON notifications (is_read);

-- Quotation activities: quotation_id + created_at (activity timeline)
CREATE INDEX IF NOT EXISTS idx_quotation_activities_quotation_id_created_at 
ON quotation_activities (quotation_id, created_at DESC);

-- Quotation messages: quotation_id + created_at (message timeline)
CREATE INDEX IF NOT EXISTS idx_quotation_messages_quotation_id_created_at 
ON quotation_messages (quotation_id, created_at DESC);

-- =============================================
-- CUSTOMER AND USER INDEXES
-- =============================================

-- Customers: email for lookups
CREATE INDEX IF NOT EXISTS idx_customers_email 
ON customers (email);

-- Customers: segment_id for segmentation
CREATE INDEX IF NOT EXISTS idx_customers_segment_id 
ON customers (segment_id);

-- Note: user_profiles is a view, cannot create indexes on views

-- =============================================
-- PRICING AND SERVICE INDEXES
-- =============================================

-- Pricing items: category_id for category filtering
CREATE INDEX IF NOT EXISTS idx_pricing_items_category_id 
ON pricing_items (category_id);

-- Pricing items: service_type_id for service filtering
CREATE INDEX IF NOT EXISTS idx_pricing_items_service_type_id 
ON pricing_items (service_type_id);

-- Service types: name for lookups
CREATE INDEX IF NOT EXISTS idx_service_types_name 
ON service_types (name);

-- =============================================
-- VEHICLE AND DRIVER RELATIONSHIP INDEXES
-- =============================================

-- Vehicle assignments: driver_id for driver queries
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_driver_id 
ON vehicle_assignments (driver_id);

-- Vehicle assignments: status for active assignments
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_status 
ON vehicle_assignments (status);

-- Dispatch assignments: driver_id for driver dispatch queries
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_driver_id 
ON dispatch_assignments (driver_id);

-- Dispatch assignments: vehicle_id for vehicle dispatch queries
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_vehicle_id 
ON dispatch_assignments (vehicle_id);

-- =============================================
-- REPORTING AND ANALYTICS INDEXES
-- =============================================

-- Generated reports: created_by for user reports
CREATE INDEX IF NOT EXISTS idx_generated_reports_created_by 
ON generated_reports (created_by);

-- Generated reports: type for report type filtering
CREATE INDEX IF NOT EXISTS idx_generated_reports_type 
ON generated_reports (type);

-- Generated reports: status for report status filtering
CREATE INDEX IF NOT EXISTS idx_generated_reports_status 
ON generated_reports (status);

-- =============================================
-- EMAIL AND COMMUNICATION INDEXES
-- =============================================

-- Email statuses: quotation_id for quotation email tracking
CREATE INDEX IF NOT EXISTS idx_email_statuses_quotation_id 
ON email_statuses (quotation_id);

-- Email statuses: email for email lookups
CREATE INDEX IF NOT EXISTS idx_email_statuses_email 
ON email_statuses (email);

-- Email engagement events: quotation_id for engagement tracking
CREATE INDEX IF NOT EXISTS idx_email_engagement_quotation_id 
ON email_engagement_events (quotation_id);

-- =============================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =============================================

-- Quotations: customer_email + status for customer quotation queries
CREATE INDEX IF NOT EXISTS idx_quotations_customer_email_status 
ON quotations (customer_email, status);

-- Bookings: customer_email + status for customer booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email_status 
ON bookings (customer_email, status);

-- Inspections: vehicle_id + status + created_at for vehicle inspection history
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_status_created_at 
ON inspections (vehicle_id, status, created_at DESC);

-- =============================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- =============================================

-- Unread notifications only
CREATE INDEX IF NOT EXISTS idx_notifications_unread_user_created 
ON notifications (user_id, created_at DESC) 
WHERE is_read = false;

-- Active vehicle assignments only
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_active_driver 
ON vehicle_assignments (driver_id, created_at DESC) 
WHERE status = 'active';

-- Note: maintenance_tasks table is empty, skipping index creation

-- =============================================
-- ANALYZE TABLES FOR OPTIMIZER
-- =============================================

-- Update table statistics for the query planner
ANALYZE inspection_items;
ANALYZE inspection_photos;
ANALYZE notifications;
ANALYZE quotation_activities;
ANALYZE quotation_messages;
ANALYZE customers;
ANALYZE pricing_items;
ANALYZE service_types;
ANALYZE vehicle_assignments;
ANALYZE dispatch_assignments;
ANALYZE generated_reports;
ANALYZE email_statuses;
ANALYZE email_engagement_events;

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
    'idx_inspection_items_inspection_id',
    'idx_inspection_items_template_id',
    'idx_inspection_photos_inspection_item_id',
    'idx_inspection_photos_created_by',
    'idx_notifications_user_id_created_at',
    'idx_quotation_activities_quotation_id_created_at',
    'idx_customers_email',
    'idx_pricing_items_category_id',
    'idx_vehicle_assignments_driver_id'
  )
ORDER BY tablename, indexname;
