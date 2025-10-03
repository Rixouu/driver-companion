# Multi-Service Quotation: Technical Implementation

## Overview

The multi-service quotation feature extends our quotation system to support multiple services within a single quote. This document explains the technical implementation details for developers who need to understand or extend this functionality.

## Data Model Changes

### 1. Enhanced QuotationItem Schema

We've expanded the `quotation_items` table to store service-specific metadata:

```sql
ALTER TABLE public.quotation_items
ADD COLUMN IF NOT EXISTS service_type_id UUID,
ADD COLUMN IF NOT EXISTS service_type_name TEXT,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
ADD COLUMN IF NOT EXISTS vehicle_category TEXT,
ADD COLUMN IF NOT EXISTS duration_hours INTEGER,
ADD COLUMN IF NOT EXISTS service_days INTEGER,
ADD COLUMN IF NOT EXISTS hours_per_day INTEGER,
ADD COLUMN IF NOT EXISTS is_service_item BOOLEAN DEFAULT false;
```

This allows each quotation item to contain all the necessary information to represent a distinct service.

### 2. Relationship Model

- A `Quotation` can have multiple `QuotationItem` records
- Each `QuotationItem` marked with `is_service_item=true` represents a standalone service
- The main quotation record still stores a primary service for backward compatibility

## Service Architecture

### Core Components

1. **Service Item Management UI**
   - Added to `quotation-form.tsx`
   - Allows adding, editing, removing, and duplicating services

2. **Service Pricing Calculator**
   - Added to `useQuotationService.ts`
   - Handles pricing calculations for multiple services
   - Calculates combined totals with discount and tax applied

3. **API Integration**
   - Enhanced `/api/quotations/items/bulk-create` endpoint
   - New functionality in `/api/quotations/[id]/items/delete-all` endpoint

### Implementation Flow

1. **Creating a New Multi-Service Quotation**
   ```
   User selects service details → Adds service to list → Repeats for multiple services
   → System calculates total price → Quotation is saved with all service items
   ```

2. **Updating an Existing Quotation**
   ```
   System loads quotation with items → User modifies services → 
   On save: Delete all existing items → Create new items with current service configuration
   ```

## Core Logic Implementation

### Service Item Management

The main state management occurs in `quotation-form.tsx`:

```typescript
// State for service items
const [serviceItems, setServiceItems] = useState<ServiceItemInput[]>([]);

// Adding a service item
const handleAddServiceItem = async () => {
  // Calculate price for this service
  const { baseAmount } = await calculateQuotationAmount(
    serviceType,
    vehicleType,
    effectiveDuration || 1,
    0, // No discount at item level
    0, // No tax at item level
    serviceDays || 1
  );
  
  // Create new service item
  const newItem: ServiceItemInput = {
    // Service details
    description: `${selectedServiceName} - ${vehicleType}`,
    service_type_id: serviceType,
    service_type_name: selectedServiceName,
    // Other fields...
    is_service_item: true
  };
  
  // Add to list
  setServiceItems([...serviceItems, newItem]);
};
```

### Pricing Calculation

Price calculation has been enhanced to support multiple services:

```typescript
// Calculate total with multiple services
const calculateTotalWithMultipleServices = async (
  serviceItems: ServiceItemInput[],
  baseTaxPercentage: number = 0,
  baseDiscountPercentage: number = 0
) => {
  let totalBaseAmount = 0;
  
  // Calculate base amount for each service
  for (const item of serviceItems) {
    if (item.unit_price) {
      totalBaseAmount += item.unit_price * (item.quantity || 1);
    }
  }
  
  // Apply discount and tax
  const discountAmount = totalBaseAmount * (baseDiscountPercentage / 100);
  const amountAfterDiscount = totalBaseAmount - discountAmount;
  const taxAmount = amountAfterDiscount * (baseTaxPercentage / 100);
  
  return {
    baseAmount: totalBaseAmount,
    currency,
    discountAmount,
    taxAmount,
    totalAmount: amountAfterDiscount + taxAmount
  };
};
```

### API Integration

The quotation creation/update flow has been modified to handle service items:

```typescript
// Create quotation with service items
const result = await createQuotation(createInput, serviceItems);

// For updating existing quotations with service items
// 1. Delete existing items
await fetch(`/api/quotations/${id}/items/delete-all`, { method: 'DELETE' });

// 2. Create new items
await fetch('/api/quotations/items/bulk-create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    quotation_id: id,
    items: processedServiceItems
  })
});
```

## Performance Considerations

1. **Bulk Operations**
   - When updating a quotation with many services, we use bulk API operations
   - Delete all items in a single operation, then bulk create the new items

2. **Caching**
   - Service type and pricing data should be cached to improve performance
   - Calculating costs happens on the client-side to reduce server load

## Security Considerations

1. **Data Validation**
   - All service item inputs should be validated before submission
   - Server-side validation ensures total amounts match component amounts

2. **Permissions**
   - Standard quotation permissions apply to multi-service functionality
   - Only authorized users can modify quotation items

## Error Handling

1. **Failed Item Creation**
   - If item creation fails, we log the error but allow the base quotation to proceed
   - This provides partial functionality rather than total failure

2. **Validation Errors**
   - Validate all services before attempting to create any
   - Present validation errors in the UI with clear actions to fix

## Testing

1. **Unit Tests**
   - Test individual service pricing calculations
   - Test combined service pricing with different discount/tax scenarios

2. **Integration Tests**
   - Test the complete flow from UI to database and back
   - Test backward compatibility with existing quotations

## Migration Path

For existing applications:

1. Apply the database migration script
2. Deploy the updated code
3. Existing quotations will continue to work as before
4. New quotations can use the multi-service feature

## Future Considerations

1. **Service Templates**
   - Create predefined service combinations for common quotes
   - Allow saving and reusing service configurations

2. **Advanced Pricing Rules**
   - Implement cross-service discounts or bundle pricing
   - Support for seasonal pricing variations

3. **Quantity-Based Services**
   - Enhance support for services with variable quantities
   - Add automatic quantity calculations based on inputs 