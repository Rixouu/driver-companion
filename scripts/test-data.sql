-- Test data for vehicle inspection app
-- This script inserts realistic test data for the reporting components

-- Clear existing test data (optional - uncomment if needed)
-- DELETE FROM fuel_logs;
-- DELETE FROM mileage_logs;
-- DELETE FROM maintenance_tasks;

-- Get existing vehicle IDs
-- V-Class JD1: 93ed0adf-bccf-4a62-a44a-8e32a8f52a67
-- Vellfire JD1: 34d0e471-d901-460f-8c8c-58addff01e84
-- Alphard Executive JD1: 2e4d526d-15c6-4e9b-a1ea-8d2a53b7b2b0
-- Alphard Z-Class JD1: 312ed128-cc54-46d3-92c7-91dc2be1708e
-- Grand Cabin JD1: 07dd7311-148f-4f8d-8fd0-9514ef3407e9

-- Insert mileage logs for March 2025
-- V-Class JD1
INSERT INTO mileage_logs (vehicle_id, date, reading)
VALUES 
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-03-01T00:00:00Z', 54000),
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-03-15T00:00:00Z', 54500),
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-03-31T00:00:00Z', 55200);

-- Vellfire JD1
INSERT INTO mileage_logs (vehicle_id, date, reading)
VALUES 
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-03-01T00:00:00Z', 32000),
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-03-15T00:00:00Z', 32800),
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-03-31T00:00:00Z', 33500);

-- Alphard Executive JD1
INSERT INTO mileage_logs (vehicle_id, date, reading)
VALUES 
('2e4d526d-15c6-4e9b-a1ea-8d2a53b7b2b0', '2025-03-01T00:00:00Z', 44000),
('2e4d526d-15c6-4e9b-a1ea-8d2a53b7b2b0', '2025-03-15T00:00:00Z', 44600),
('2e4d526d-15c6-4e9b-a1ea-8d2a53b7b2b0', '2025-03-31T00:00:00Z', 45200);

-- Alphard Z-Class JD1
INSERT INTO mileage_logs (vehicle_id, date, reading)
VALUES 
('312ed128-cc54-46d3-92c7-91dc2be1708e', '2025-03-01T00:00:00Z', 28000),
('312ed128-cc54-46d3-92c7-91dc2be1708e', '2025-03-15T00:00:00Z', 28700),
('312ed128-cc54-46d3-92c7-91dc2be1708e', '2025-03-31T00:00:00Z', 29400);

-- Grand Cabin JD1
INSERT INTO mileage_logs (vehicle_id, date, reading)
VALUES 
('07dd7311-148f-4f8d-8fd0-9514ef3407e9', '2025-03-01T00:00:00Z', 15000),
('07dd7311-148f-4f8d-8fd0-9514ef3407e9', '2025-03-15T00:00:00Z', 15600),
('07dd7311-148f-4f8d-8fd0-9514ef3407e9', '2025-03-31T00:00:00Z', 16200);

-- Insert mileage logs for February 2025
-- V-Class JD1
INSERT INTO mileage_logs (vehicle_id, date, reading)
VALUES 
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-02-01T00:00:00Z', 52800),
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-02-15T00:00:00Z', 53400),
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-02-28T00:00:00Z', 54000);

-- Vellfire JD1
INSERT INTO mileage_logs (vehicle_id, date, reading)
VALUES 
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-02-01T00:00:00Z', 30800),
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-02-15T00:00:00Z', 31400),
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-02-28T00:00:00Z', 32000);

-- Insert fuel logs for March 2025
-- V-Class JD1
INSERT INTO fuel_logs (vehicle_id, date, mileage, liters, cost)
VALUES 
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-03-05T00:00:00Z', 54200, 65.5, 650.00),
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-03-12T00:00:00Z', 54400, 70.2, 700.00),
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-03-19T00:00:00Z', 54800, 68.8, 680.00),
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-03-26T00:00:00Z', 55000, 72.5, 720.00);

-- Vellfire JD1
INSERT INTO fuel_logs (vehicle_id, date, mileage, liters, cost)
VALUES 
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-03-05T00:00:00Z', 32200, 75.0, 750.00),
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-03-12T00:00:00Z', 32500, 80.0, 800.00),
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-03-19T00:00:00Z', 33000, 78.5, 785.00),
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-03-26T00:00:00Z', 33300, 82.0, 820.00);

-- Alphard Executive JD1
INSERT INTO fuel_logs (vehicle_id, date, mileage, liters, cost)
VALUES 
('2e4d526d-15c6-4e9b-a1ea-8d2a53b7b2b0', '2025-03-05T00:00:00Z', 44200, 60.0, 600.00),
('2e4d526d-15c6-4e9b-a1ea-8d2a53b7b2b0', '2025-03-12T00:00:00Z', 44400, 62.5, 625.00),
('2e4d526d-15c6-4e9b-a1ea-8d2a53b7b2b0', '2025-03-19T00:00:00Z', 44800, 61.0, 610.00),
('2e4d526d-15c6-4e9b-a1ea-8d2a53b7b2b0', '2025-03-26T00:00:00Z', 45000, 63.5, 635.00);

-- Alphard Z-Class JD1
INSERT INTO fuel_logs (vehicle_id, date, mileage, liters, cost)
VALUES 
('312ed128-cc54-46d3-92c7-91dc2be1708e', '2025-03-05T00:00:00Z', 28200, 58.0, 580.00),
('312ed128-cc54-46d3-92c7-91dc2be1708e', '2025-03-12T00:00:00Z', 28400, 60.0, 600.00),
('312ed128-cc54-46d3-92c7-91dc2be1708e', '2025-03-19T00:00:00Z', 28900, 59.5, 595.00),
('312ed128-cc54-46d3-92c7-91dc2be1708e', '2025-03-26T00:00:00Z', 29200, 61.0, 610.00);

-- Grand Cabin JD1
INSERT INTO fuel_logs (vehicle_id, date, mileage, liters, cost)
VALUES 
('07dd7311-148f-4f8d-8fd0-9514ef3407e9', '2025-03-05T00:00:00Z', 15200, 55.0, 550.00),
('07dd7311-148f-4f8d-8fd0-9514ef3407e9', '2025-03-12T00:00:00Z', 15400, 57.0, 570.00),
('07dd7311-148f-4f8d-8fd0-9514ef3407e9', '2025-03-19T00:00:00Z', 15800, 56.5, 565.00),
('07dd7311-148f-4f8d-8fd0-9514ef3407e9', '2025-03-26T00:00:00Z', 16000, 58.0, 580.00);

-- Insert fuel logs for February 2025
-- V-Class JD1
INSERT INTO fuel_logs (vehicle_id, date, mileage, liters, cost)
VALUES 
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-02-05T00:00:00Z', 53000, 64.0, 640.00),
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-02-12T00:00:00Z', 53200, 68.5, 685.00),
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-02-19T00:00:00Z', 53600, 67.0, 670.00),
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-02-26T00:00:00Z', 53800, 71.0, 710.00);

-- Vellfire JD1
INSERT INTO fuel_logs (vehicle_id, date, mileage, liters, cost)
VALUES 
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-02-05T00:00:00Z', 31000, 73.0, 730.00),
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-02-12T00:00:00Z', 31200, 78.0, 780.00),
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-02-19T00:00:00Z', 31600, 76.5, 765.00),
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-02-26T00:00:00Z', 31800, 80.0, 800.00);

-- Insert maintenance tasks for March 2025
-- V-Class JD1
INSERT INTO maintenance_tasks (vehicle_id, completed_date, due_date, cost, description, title)
VALUES 
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-03-08T00:00:00Z', '2025-06-08T00:00:00Z', 500.00, 'Oil Change', 'Regular Oil Change Service'),
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-03-10T00:00:00Z', '2025-09-10T00:00:00Z', 1200.00, 'Brake Service', 'Brake System Maintenance');

-- Vellfire JD1
INSERT INTO maintenance_tasks (vehicle_id, completed_date, due_date, cost, description, title)
VALUES 
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-03-07T00:00:00Z', '2025-06-07T00:00:00Z', 450.00, 'Oil Change', 'Scheduled Oil Change'),
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-03-09T00:00:00Z', '2025-09-09T00:00:00Z', 800.00, 'Tire Rotation', 'Tire Rotation and Balance');

-- Alphard Executive JD1
INSERT INTO maintenance_tasks (vehicle_id, completed_date, due_date, cost, description, title)
VALUES 
('2e4d526d-15c6-4e9b-a1ea-8d2a53b7b2b0', '2025-03-15T00:00:00Z', '2026-03-15T00:00:00Z', 1500.00, 'Transmission Service', 'Transmission Fluid Service'),
('2e4d526d-15c6-4e9b-a1ea-8d2a53b7b2b0', '2025-03-16T00:00:00Z', '2025-09-16T00:00:00Z', 350.00, 'Air Filter Replacement', 'Air Filter Service');

-- Alphard Z-Class JD1
INSERT INTO maintenance_tasks (vehicle_id, completed_date, due_date, cost, description, title)
VALUES 
('312ed128-cc54-46d3-92c7-91dc2be1708e', '2025-03-20T00:00:00Z', '2025-09-20T00:00:00Z', 600.00, 'Brake Pad Replacement', 'Front Brake Service'),
('312ed128-cc54-46d3-92c7-91dc2be1708e', '2025-03-21T00:00:00Z', '2025-06-21T00:00:00Z', 250.00, 'Oil Change', 'Regular Oil Service');

-- Grand Cabin JD1
INSERT INTO maintenance_tasks (vehicle_id, completed_date, due_date, cost, description, title)
VALUES 
('07dd7311-148f-4f8d-8fd0-9514ef3407e9', '2025-03-25T00:00:00Z', '2026-03-25T00:00:00Z', 1800.00, 'Suspension Repair', 'Suspension System Service'),
('07dd7311-148f-4f8d-8fd0-9514ef3407e9', '2025-03-26T00:00:00Z', '2025-06-26T00:00:00Z', 400.00, 'Oil Change', 'Routine Oil Change');

-- Insert maintenance tasks for February 2025
-- V-Class JD1
INSERT INTO maintenance_tasks (vehicle_id, completed_date, due_date, cost, description, title)
VALUES 
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-02-08T00:00:00Z', '2025-05-08T00:00:00Z', 450.00, 'Oil Change', 'Scheduled Oil Service'),
('93ed0adf-bccf-4a62-a44a-8e32a8f52a67', '2025-02-10T00:00:00Z', '2025-08-10T00:00:00Z', 900.00, 'Wheel Alignment', 'Wheel Alignment Service');

-- Vellfire JD1
INSERT INTO maintenance_tasks (vehicle_id, completed_date, due_date, cost, description, title)
VALUES 
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-02-07T00:00:00Z', '2025-05-07T00:00:00Z', 400.00, 'Oil Change', 'Regular Oil Change'),
('34d0e471-d901-460f-8c8c-58addff01e84', '2025-02-09T00:00:00Z', '2026-02-09T00:00:00Z', 750.00, 'Air Conditioning Service', 'AC System Maintenance'); 