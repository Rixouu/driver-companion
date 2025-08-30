-- Migration: Fix vehicle categorization using existing pricing_category_vehicles table
-- Date: 2025-01-29
-- Description: Properly categorize vehicles using the existing junction table architecture

-- First, let's see what's currently in the pricing_category_vehicles table
-- This will help us understand the current state
SELECT 'Current vehicle-category relationships:' as info;

SELECT 
  pc.name as category_name,
  COUNT(pcv.vehicle_id) as vehicle_count,
  STRING_AGG(v.name, ', ') as vehicles
FROM pricing_categories pc
LEFT JOIN pricing_category_vehicles pcv ON pc.id = pcv.category_id
LEFT JOIN vehicles v ON pcv.vehicle_id = v.id
WHERE pc.is_active = true
GROUP BY pc.id, pc.name, pc.sort_order
ORDER BY pc.sort_order;

-- Now let's properly categorize vehicles based on their brand and model
-- We'll use the existing pricing_category_vehicles table

-- Clear existing categorizations to start fresh
DELETE FROM pricing_category_vehicles;

-- Mercedes vehicles -> Platinum category (high-end luxury)
INSERT INTO pricing_category_vehicles (category_id, vehicle_id)
SELECT 
  pc.id as category_id,
  v.id as vehicle_id
FROM vehicles v
CROSS JOIN pricing_categories pc
WHERE v.status = 'active' 
  AND v.brand ILIKE '%mercedes%'
  AND pc.name = 'Platinum';

-- Toyota Alphard vehicles -> Luxury category (mid-high luxury)
INSERT INTO pricing_category_vehicles (category_id, vehicle_id)
SELECT 
  pc.id as category_id,
  v.id as vehicle_id
FROM vehicles v
CROSS JOIN pricing_categories pc
WHERE v.status = 'active' 
  AND v.brand ILIKE '%toyota%' 
  AND v.model ILIKE '%alphard%'
  AND pc.name = 'Luxury';

-- Toyota Hi-Ace vehicles -> Premium category (standard premium)
INSERT INTO pricing_category_vehicles (category_id, vehicle_id)
SELECT 
  pc.id as category_id,
  v.id as vehicle_id
FROM vehicles v
CROSS JOIN pricing_categories pc
WHERE v.status = 'active' 
  AND v.brand ILIKE '%toyota%' 
  AND v.model ILIKE '%hi-ace%'
  AND pc.name = 'Premium';

-- Special case: Move the two Mercedes vehicles (Maybach and S580 Long) to Elite category
-- These are ultra-premium vehicles that deserve the Elite classification
INSERT INTO pricing_category_vehicles (category_id, vehicle_id)
SELECT 
  pc.id as category_id,
  v.id as vehicle_id
FROM vehicles v
CROSS JOIN pricing_categories pc
WHERE v.status = 'active' 
  AND v.brand ILIKE '%mercedes%' 
  AND (v.model ILIKE '%maybach%' OR v.model ILIKE '%s580%')
  AND pc.name = 'Elite';

-- Verify the final categorization
SELECT 'Final vehicle-category relationships:' as info;

SELECT 
  pc.name as category_name,
  pc.sort_order,
  COUNT(pcv.vehicle_id) as vehicle_count,
  STRING_AGG(v.name, ', ') as vehicles
FROM pricing_categories pc
LEFT JOIN pricing_category_vehicles pcv ON pc.id = pcv.category_id
LEFT JOIN vehicles v ON pcv.vehicle_id = v.id
WHERE pc.is_active = true
GROUP BY pc.id, pc.name, pc.sort_order
ORDER BY pc.sort_order;

-- Add a comment for documentation
COMMENT ON TABLE public.pricing_category_vehicles IS 'Junction table linking vehicles to pricing categories for flexible categorization';
