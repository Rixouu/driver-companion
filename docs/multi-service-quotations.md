# Multi-Service Quotations

## Overview

The multi-service quotation feature allows creating quotations with multiple different services, such as combining airport transfers with hourly charter services in a single quote. This provides more flexibility for complex customer needs.

## Database Changes

We've added several new fields to the `quotation_items` table to support storing service-specific metadata:

- `service_type_id`: UUID reference to the service_types table
- `service_type_name`: Text name of the service type
- `vehicle_type`: Type of vehicle for this service item
- `vehicle_category`: Category of vehicle (platinum, luxury, premium)
- `duration_hours`: Duration in hours for this service item
- `service_days`: Number of days for this service item
- `hours_per_day`: Hours per day for charter services
- `is_service_item`: Boolean flag indicating if this item represents a service configuration

A new SQL migration is available in `database/migrations/quotation_items_service_fields.sql`.

## User Interface Changes

The quotation form now supports:

1. Adding multiple services to a single quotation
2. Viewing and managing a list of services in the Service & Vehicle tab
3. Calculating pricing based on all services combined
4. Previewing all services in the quotation details

## How to Use

### Creating a Multi-Service Quotation

1. Go to the Quotations section and click "Create New Quotation"
2. Fill in customer information in the first tab
3. In the Service & Vehicle tab:
   - Select a service type, vehicle category, and vehicle type
   - Configure dates, times, and durations
   - Click "Add This Service" to add it to the quotation
   - Repeat to add more services
4. Each added service will appear in the service list
5. You can remove or duplicate services using the icons
6. Complete the rest of the form and submit as usual

### Pricing Calculation

When multiple services are added:
- The base amount is calculated as the sum of all service prices
- Discount and tax percentages are applied to the combined total
- The pricing preview will show a breakdown of all services

### Editing Existing Quotations

When editing a quotation with multiple services:
- All existing services will be displayed in the service list
- You can add, remove, or duplicate services
- The changes will be saved when you update the quotation

## Technical Implementation

The multi-service functionality leverages the existing `quotation_items` table with additional metadata. The main quotation record still stores a primary service for backward compatibility, while all services (including the primary one) are stored as items.

Key components:
- Enhanced `QuotationItem` type in `types/quotations.ts`
- New service item management UI in `quotation-form.tsx`
- Extended `createQuotation` and `updateQuotation` functions in `useQuotationService.ts`
- Updated API endpoints for handling service items

## Backward Compatibility

This implementation maintains backward compatibility with existing quotations. When viewing an old quotation, it will display correctly, and when editing, any existing items will be converted to the new format if necessary. 