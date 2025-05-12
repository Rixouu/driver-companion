-- Add service_type_id column to pricing_calculation_logs table
ALTER TABLE pricing_calculation_logs ADD COLUMN service_type_id UUID;

-- Create a foreign key constraint referencing service_types
ALTER TABLE pricing_calculation_logs
ADD CONSTRAINT fk_pricing_calculation_logs_service_type
FOREIGN KEY (service_type_id) REFERENCES service_types(id); 