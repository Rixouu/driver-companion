-- =====================================================
-- COMPREHENSIVE TEST CREW TASKS
-- Creates 30+ diverse test tasks across all categories
-- =====================================================

-- Clear existing test tasks (optional - uncomment if needed)
-- DELETE FROM crew_tasks WHERE title LIKE '%Test%' OR title LIKE '%Airport%' OR title LIKE '%Training%' OR title LIKE '%Charter%' OR title LIKE '%Regular%';

-- Create an "Unassigned" driver for tasks without specific driver assignment
-- This allows us to have unassigned tasks while maintaining the NOT NULL constraint
-- Using an existing user_id from auth.users
INSERT INTO drivers (id, first_name, last_name, email, phone, user_id, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Unassigned',
  'Tasks',
  'unassigned@system.local',
  '+1-000-000-0000',
  'ecf5c05f-7f28-4f03-bb6e-c7e0fd865993', -- Use existing user_id from auth.users
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert 30+ diverse test tasks
INSERT INTO crew_tasks (
  id,
  task_number,
  task_type,
  task_status,
  driver_id,
  start_date,
  end_date,
  start_time,
  end_time,
  hours_per_day,
  total_hours,
  title,
  description,
  location,
  customer_name,
  customer_phone,
  priority,
  notes,
  created_at,
  updated_at
) VALUES 
-- =====================================================
-- CHARTER SERVICES (8 tasks)
-- =====================================================
(
  gen_random_uuid(),
  1,
  'charter',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-07',
  '2025-10-07',
  '06:00:00',
  '10:00:00',
  4.0,
  4.0,
  'Early Morning Airport Transfer',
  'VIP client pickup from Haneda Airport to Tokyo Station',
  'Haneda Airport, Tokyo, Japan',
  'Mr. Tanaka',
  '+81-90-1234-5678',
  1,
  'High priority - VIP client',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  2,
  'charter',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-08',
  '2025-10-08',
  '14:00:00',
  '18:00:00',
  4.0,
  4.0,
  'Business Executive Transfer',
  'Corporate transfer from Shibuya to Narita Airport',
  'Shibuya Station, Tokyo, Japan',
  'Ms. Suzuki',
  '+81-90-2345-6789',
  2,
  'Business class service required',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  3,
  'charter',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-09',
  '2025-10-09',
  '08:00:00',
  '12:00:00',
  4.0,
  4.0,
  'Luxury Hotel Transfer',
  'Premium transfer from Imperial Hotel to Ginza',
  'Imperial Hotel, Tokyo, Japan',
  'Mr. Yamamoto',
  '+81-90-3456-7890',
  1,
  'Luxury vehicle required',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  4,
  'charter',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-10',
  '2025-10-10',
  '16:00:00',
  '20:00:00',
  4.0,
  4.0,
  'Evening Airport Run',
  'Late evening transfer to Haneda Airport',
  'Roppongi, Tokyo, Japan',
  'Ms. Nakamura',
  '+81-90-4567-8901',
  2,
  'Evening rush hour traffic',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  5,
  'charter',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-11',
  '2025-10-11',
  '10:00:00',
  '14:00:00',
  4.0,
  4.0,
  'Weekend City Tour',
  'Private city tour for international visitors',
  'Tokyo Station, Tokyo, Japan',
  'Mr. Smith',
  '+81-90-5678-9012',
  3,
  'English speaking driver preferred',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  6,
  'charter',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-12',
  '2025-10-12',
  '07:00:00',
  '11:00:00',
  4.0,
  4.0,
  'Morning VIP Transfer',
  'Early morning VIP pickup from Ritz-Carlton',
  'Ritz-Carlton Tokyo, Japan',
  'Mr. Johnson',
  '+81-90-6789-0123',
  1,
  'VIP service - luxury vehicle',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  7,
  'charter',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-13',
  '2025-10-13',
  '15:00:00',
  '19:00:00',
  4.0,
  4.0,
  'Afternoon Charter Service',
  'Corporate charter for business meeting',
  'Marunouchi, Tokyo, Japan',
  'Ms. Williams',
  '+81-90-7890-1234',
  2,
  'Corporate client',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  8,
  'charter',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-14',
  '2025-10-14',
  '12:00:00',
  '16:00:00',
  4.0,
  4.0,
  'Lunch Hour Transfer',
  'Midday charter service for restaurant visit',
  'Ginza, Tokyo, Japan',
  'Mr. Brown',
  '+81-90-8901-2345',
  3,
  'Restaurant reservation',
  NOW(),
  NOW()
),

-- =====================================================
-- REGULAR SERVICES (8 tasks)
-- =====================================================
(
  gen_random_uuid(),
  1,
  'regular',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-07',
  '2025-10-07',
  '09:00:00',
  '17:00:00',
  8.0,
  8.0,
  'Daily City Shuttle',
  'Regular shuttle service between major stations',
  'Shinjuku Station, Tokyo, Japan',
  'City Transport Co.',
  '+81-3-1234-5678',
  2,
  'Regular route service',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  2,
  'regular',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-08',
  '2025-10-08',
  '07:00:00',
  '15:00:00',
  8.0,
  8.0,
  'Morning Commute Service',
  'Peak hour commuter service',
  'Ikebukuro Station, Tokyo, Japan',
  'Commute Solutions Ltd.',
  '+81-3-2345-6789',
  1,
  'High demand during rush hour',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  3,
  'regular',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-09',
  '2025-10-09',
  '13:00:00',
  '21:00:00',
  8.0,
  8.0,
  'Afternoon Service Route',
  'Regular afternoon service route',
  'Shibuya Station, Tokyo, Japan',
  'Metro Transport',
  '+81-3-3456-7890',
  2,
  'Standard afternoon route',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  4,
  'regular',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-10',
  '2025-10-10',
  '11:00:00',
  '19:00:00',
  8.0,
  8.0,
  'Midday Service',
  'Regular midday service operations',
  'Ueno Station, Tokyo, Japan',
  'Tokyo Transport Co.',
  '+81-3-4567-8901',
  2,
  'Midday service route',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  5,
  'regular',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-11',
  '2025-10-11',
  '08:00:00',
  '16:00:00',
  8.0,
  8.0,
  'Weekend Service',
  'Weekend regular service',
  'Harajuku Station, Tokyo, Japan',
  'Weekend Transport',
  '+81-3-5678-9012',
  3,
  'Weekend service operations',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  6,
  'regular',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-12',
  '2025-10-12',
  '06:00:00',
  '14:00:00',
  8.0,
  8.0,
  'Early Morning Route',
  'Early morning regular service',
  'Asakusa Station, Tokyo, Japan',
  'Early Transport Co.',
  '+81-3-6789-0123',
  2,
  'Early morning operations',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  7,
  'regular',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-13',
  '2025-10-13',
  '14:00:00',
  '22:00:00',
  8.0,
  8.0,
  'Evening Service Route',
  'Evening regular service operations',
  'Shinjuku Station, Tokyo, Japan',
  'Evening Transport',
  '+81-3-7890-1234',
  2,
  'Evening service route',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  8,
  'regular',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-14',
  '2025-10-14',
  '10:00:00',
  '18:00:00',
  8.0,
  8.0,
  'Standard Day Service',
  'Standard daytime regular service',
  'Tokyo Station, Tokyo, Japan',
  'Standard Transport',
  '+81-3-8901-2345',
  2,
  'Standard daytime operations',
  NOW(),
  NOW()
),

-- =====================================================
-- TRAINING TASKS (5 tasks)
-- =====================================================
(
  gen_random_uuid(),
  1,
  'training',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-07',
  '2025-10-09',
  '10:00:00',
  '16:00:00',
  6.0,
  18.0,
  'Safety Training Course',
  '3-day mandatory safety and customer service training',
  'Training Center, Shinagawa, Tokyo',
  'Training Department',
  '+81-3-6789-0123',
  1,
  'Mandatory for all drivers',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  2,
  'training',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-10',
  '2025-10-10',
  '09:00:00',
  '17:00:00',
  8.0,
  8.0,
  'Defensive Driving Course',
  'Advanced defensive driving techniques',
  'Driving School, Yokohama',
  'Safety Training Inc.',
  '+81-45-1234-5678',
  2,
  'Advanced driving skills',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  3,
  'training',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-11',
  '2025-10-11',
  '14:00:00',
  '18:00:00',
  4.0,
  4.0,
  'Customer Service Workshop',
  'Customer service excellence training',
  'Conference Room, Main Office',
  'HR Department',
  '+81-3-7890-1234',
  3,
  'Soft skills development',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  4,
  'training',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-12',
  '2025-10-12',
  '08:00:00',
  '12:00:00',
  4.0,
  4.0,
  'Vehicle Maintenance Training',
  'Basic vehicle maintenance and inspection training',
  'Service Center, Chiba',
  'Maintenance Team',
  '+81-43-1234-5678',
  2,
  'Technical skills training',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  5,
  'training',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-13',
  '2025-10-13',
  '13:00:00',
  '17:00:00',
  4.0,
  4.0,
  'Emergency Response Training',
  'Emergency procedures and first aid training',
  'Training Facility, Saitama',
  'Safety Department',
  '+81-48-1234-5678',
  1,
  'Critical safety training',
  NOW(),
  NOW()
),

-- =====================================================
-- MAINTENANCE TASKS (4 tasks)
-- =====================================================
(
  gen_random_uuid(),
  1,
  'maintenance',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-07',
  '2025-10-07',
  '08:00:00',
  '12:00:00',
  4.0,
  4.0,
  'Vehicle Inspection',
  'Monthly vehicle safety inspection',
  'Service Center, Chiba',
  'Maintenance Team',
  '+81-43-1234-5678',
  1,
  'Critical safety inspection',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  2,
  'maintenance',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-08',
  '2025-10-08',
  '10:00:00',
  '14:00:00',
  4.0,
  4.0,
  'Engine Service',
  'Regular engine maintenance and oil change',
  'Auto Service Center, Saitama',
  'Mechanical Team',
  '+81-48-1234-5678',
  2,
  'Regular maintenance schedule',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  3,
  'maintenance',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-09',
  '2025-10-09',
  '13:00:00',
  '17:00:00',
  4.0,
  4.0,
  'Interior Cleaning',
  'Deep cleaning and sanitization',
  'Cleaning Facility, Tokyo',
  'Cleaning Team',
  '+81-3-8901-2345',
  3,
  'Hygiene and cleanliness',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  4,
  'maintenance',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-10',
  '2025-10-10',
  '09:00:00',
  '13:00:00',
  4.0,
  4.0,
  'Brake System Check',
  'Comprehensive brake system inspection and service',
  'Brake Service Center, Kanagawa',
  'Brake Specialists',
  '+81-45-2345-6789',
  1,
  'Safety critical maintenance',
  NOW(),
  NOW()
),

-- =====================================================
-- MEETING TASKS (3 tasks)
-- =====================================================
(
  gen_random_uuid(),
  1,
  'meeting',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-07',
  '2025-10-07',
  '14:00:00',
  '16:00:00',
  2.0,
  2.0,
  'Team Briefing',
  'Weekly team meeting and updates',
  'Main Office, Shinjuku',
  'Management Team',
  '+81-3-9012-3456',
  2,
  'Weekly team coordination',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  2,
  'meeting',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-10',
  '2025-10-10',
  '15:00:00',
  '17:00:00',
  2.0,
  2.0,
  'Safety Review Meeting',
  'Monthly safety review and planning',
  'Conference Room, Main Office',
  'Safety Committee',
  '+81-3-0123-4567',
  1,
  'Safety protocol review',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  3,
  'meeting',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-11',
  '2025-10-11',
  '11:00:00',
  '13:00:00',
  2.0,
  2.0,
  'Performance Review',
  'Monthly performance review meeting',
  'HR Office, Main Building',
  'HR Department',
  '+81-3-1234-5678',
  2,
  'Performance evaluation',
  NOW(),
  NOW()
),

-- =====================================================
-- DAY OFF TASKS (3 tasks)
-- =====================================================
(
  gen_random_uuid(),
  1,
  'day_off',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-08',
  '2025-10-08',
  '00:00:00',
  '23:59:59',
  0.0,
  0.0,
  'Scheduled Day Off',
  'Planned day off for driver rest',
  'N/A',
  'N/A',
  'N/A',
  3,
  'Rest and recovery day',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  2,
  'day_off',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-11',
  '2025-10-11',
  '00:00:00',
  '23:59:59',
  0.0,
  0.0,
  'Weekend Day Off',
  'Weekend rest day',
  'N/A',
  'N/A',
  'N/A',
  3,
  'Weekend rest period',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  3,
  'day_off',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-14',
  '2025-10-14',
  '00:00:00',
  '23:59:59',
  0.0,
  0.0,
  'Personal Day Off',
  'Personal day off for family time',
  'N/A',
  'N/A',
  'N/A',
  3,
  'Personal time off',
  NOW(),
  NOW()
),

-- =====================================================
-- STANDBY TASKS (3 tasks)
-- =====================================================
(
  gen_random_uuid(),
  1,
  'standby',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-07',
  '2025-10-07',
  '18:00:00',
  '22:00:00',
  4.0,
  4.0,
  'Evening Standby',
  'Evening standby duty for emergency calls',
  'Main Office, Shinjuku',
  'Dispatch Center',
  '+81-3-2345-6789',
  2,
  'Emergency standby duty',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  2,
  'standby',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-09',
  '2025-10-09',
  '20:00:00',
  '24:00:00',
  4.0,
  4.0,
  'Night Standby',
  'Night standby duty for late night requests',
  'Main Office, Shinjuku',
  'Dispatch Center',
  '+81-3-3456-7890',
  2,
  'Night standby duty',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  3,
  'standby',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-12',
  '2025-10-12',
  '12:00:00',
  '16:00:00',
  4.0,
  4.0,
  'Weekend Standby',
  'Weekend standby duty for special requests',
  'Main Office, Shinjuku',
  'Dispatch Center',
  '+81-3-4567-8901',
  3,
  'Weekend standby duty',
  NOW(),
  NOW()
),

-- =====================================================
-- SPECIAL TASKS (4 tasks)
-- =====================================================
(
  gen_random_uuid(),
  1,
  'special',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-07',
  '2025-10-07',
  '19:00:00',
  '23:00:00',
  4.0,
  4.0,
  'Wedding Transportation',
  'Special wedding day transportation service',
  'Wedding Venue, Yokohama',
  'Wedding Planner',
  '+81-45-3456-7890',
  2,
  'Special event transportation',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  2,
  'special',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-09',
  '2025-10-09',
  '08:00:00',
  '12:00:00',
  4.0,
  4.0,
  'Airport VIP Service',
  'Special VIP airport service for dignitaries',
  'Narita Airport, Chiba',
  'VIP Services',
  '+81-47-1234-5678',
  1,
  'High security VIP service',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  3,
  'special',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-11',
  '2025-10-11',
  '14:00:00',
  '18:00:00',
  4.0,
  4.0,
  'Corporate Event Transport',
  'Special transportation for corporate event',
  'Convention Center, Tokyo',
  'Event Organizer',
  '+81-3-5678-9012',
  2,
  'Corporate event service',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  4,
  'special',
  'scheduled',
  '00000000-0000-0000-0000-000000000000', -- Unassigned driver
  '2025-10-13',
  '2025-10-13',
  '10:00:00',
  '14:00:00',
  4.0,
  4.0,
  'Medical Transport',
  'Special medical transportation service',
  'Hospital, Tokyo',
  'Medical Services',
  '+81-3-6789-0123',
  1,
  'Medical transportation',
  NOW(),
  NOW()
);

-- Assign some tasks to drivers for demonstration
UPDATE crew_tasks 
SET driver_id = (SELECT id FROM drivers WHERE first_name = 'Takeshi' LIMIT 1)
WHERE title IN ('Early Morning Airport Transfer', 'Business Executive Transfer', 'Daily City Shuttle');

UPDATE crew_tasks 
SET driver_id = (SELECT id FROM drivers WHERE first_name = 'Yuki' LIMIT 1)
WHERE title IN ('Morning Commute Service', 'Afternoon Service Route', 'Safety Training Course');

UPDATE crew_tasks 
SET driver_id = (SELECT id FROM drivers WHERE first_name = 'Hiroshi' LIMIT 1)
WHERE title IN ('Vehicle Inspection', 'Engine Service', 'Team Briefing');

-- Display summary
SELECT 
  task_type,
  COUNT(*) as task_count,
  COUNT(CASE WHEN driver_id IS NULL THEN 1 END) as unassigned_count,
  COUNT(CASE WHEN driver_id IS NOT NULL THEN 1 END) as assigned_count
FROM crew_tasks 
WHERE title IN (
  'Early Morning Airport Transfer', 'Business Executive Transfer', 'Luxury Hotel Transfer',
  'Evening Airport Run', 'Weekend City Tour', 'Morning VIP Transfer', 'Afternoon Charter Service',
  'Lunch Hour Transfer', 'Daily City Shuttle', 'Morning Commute Service', 'Afternoon Service Route',
  'Midday Service', 'Weekend Service', 'Early Morning Route', 'Evening Service Route',
  'Standard Day Service', 'Safety Training Course', 'Defensive Driving Course',
  'Customer Service Workshop', 'Vehicle Maintenance Training', 'Emergency Response Training',
  'Vehicle Inspection', 'Engine Service', 'Interior Cleaning', 'Brake System Check',
  'Team Briefing', 'Safety Review Meeting', 'Performance Review', 'Scheduled Day Off',
  'Weekend Day Off', 'Personal Day Off', 'Evening Standby', 'Night Standby',
  'Weekend Standby', 'Wedding Transportation', 'Airport VIP Service',
  'Corporate Event Transport', 'Medical Transport'
)
GROUP BY task_type
ORDER BY task_type;
