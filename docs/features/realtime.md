# Real-time Features

## Overview

The real-time features provide instant data synchronization across clients using Supabase's real-time subscriptions. This enables collaborative workflows, live updates, and improved user experience without relying on polling or manual refreshes.

## Key Benefits

- **Instant Updates**: Data changes are reflected immediately across all connected clients
- **Reduced Network Traffic**: Only data changes are transmitted, not entire datasets
- **Better User Experience**: Users see changes without refreshing or polling
- **Collaborative Features**: Multiple users can work on the same data simultaneously
- **Offline-First Ready**: Foundation for implementing offline-first capabilities
- **Simplified State Management**: Automatic state updates based on server changes

## Core Components

### 1. Real-time Service (`lib/services/realtime.ts`)

Low-level utilities for Supabase real-time subscriptions:

```typescript
import { 
  subscribeToRecord,
  subscribeToCollection,
  RealtimeTable,
  idFilter
} from "@/lib/services/realtime"

// Subscribe to a single record
const unsubscribe = subscribeToRecord(
  {
    table: RealtimeTable.INSPECTIONS,
    filter: idFilter("123"),
  },
  ({ new: newData, old: oldData, eventType }) => {
    // Handle real-time updates
    console.log(`Inspection updated: ${eventType}`, newData)
  }
)

// Later: unsubscribe when no longer needed
unsubscribe()
```

### 2. Real-time Hooks (`hooks/use-realtime.ts`)

React hooks for easy integration of real-time features:

```typescript
import { 
  useRealtimeRecord,
  useRealtimeCollection,
  useRealtimeInspection,
  useRealtimeInspectionItems
} from "@/hooks/use-realtime"

// Generic hooks
function VehicleComponent({ vehicleId }) {
  const { data: vehicle, isLoading, error } = useRealtimeRecord({
    config: {
      table: "vehicles",
      filter: `id=eq.${vehicleId}`,
    }
  })
  
  // Component implementation
}

// Specialized hooks
function InspectionDetails({ inspectionId }) {
  const { data: inspection } = useRealtimeInspection(inspectionId)
  const { items: inspectionItems } = useRealtimeInspectionItems(inspectionId)
  
  // Component implementation
}
```

### 3. Live Status Component (`components/inspections/inspection-live-status.tsx`)

Example component that demonstrates real-time features:

```tsx
import { InspectionLiveStatus } from "@/components/inspections/inspection-live-status"

// Use in any component/page
<InspectionLiveStatus inspectionId="123" />
```

## Supported Tables

The real-time features support the following tables:

- `INSPECTIONS`: Vehicle inspection records
- `INSPECTION_ITEMS`: Individual inspection check items
- `VEHICLES`: Vehicle records
- `MAINTENANCE_TASKS`: Maintenance task records
- `FUEL_LOGS`: Fuel log entries
- `MILEAGE_LOGS`: Mileage log entries
- `NOTIFICATIONS`: User notifications

## Subscription Types

### Record Subscriptions

Listen for changes to a specific record:

```typescript
const { data: vehicle } = useRealtimeRecord({
  config: {
    table: RealtimeTable.VEHICLES,
    filter: `id=eq.${vehicleId}`,
  }
})
```

### Collection Subscriptions

Listen for changes to a collection of records:

```typescript
const { items: inspections } = useRealtimeCollection({
  config: {
    table: RealtimeTable.INSPECTIONS,
    filter: `vehicle_id=eq.${vehicleId}`,
  }
})
```

## Event Types

The real-time system handles the following event types:

- `INSERT`: New record created
- `UPDATE`: Existing record updated
- `DELETE`: Record deleted
- `*`: All event types (default)

## Error Handling

The real-time features integrate with the error handling system:

```typescript
const { data, error } = useRealtimeInspection(inspectionId)

if (error) {
  return <ErrorMessage error={error} />
}
```

## Best Practices

1. **Use specialized hooks when possible**:
   ```typescript
   const { data } = useRealtimeInspection(inspectionId)
   // Instead of
   const { data } = useRealtimeRecord({
     config: { table: "inspections", filter: `id=eq.${inspectionId}` }
   })
   ```

2. **Clean up subscriptions when unmounting**:
   ```typescript
   useEffect(() => {
     const unsubscribe = subscribeToRecord(...)
     return () => unsubscribe()
   }, [])
   ```

3. **Handle different event types appropriately**:
   ```typescript
   useRealtimeRecord({
     // ...
     onDataChange: (newData, oldData, eventType) => {
       if (eventType === "UPDATE") {
         // Handle update
       } else if (eventType === "DELETE") {
         // Handle deletion
       }
     }
   })
   ```

4. **Specify the minimum necessary filter**:
   ```typescript
   // Good
   filter: `id=eq.${recordId}`
   
   // Avoid when possible (too broad)
   filter: undefined
   ```

5. **Use with error boundaries**:
   ```tsx
   <ErrorBoundary>
     <RealtimeComponent />
   </ErrorBoundary>
   ```

## Performance Considerations

- **Subscription Count**: Each subscription uses resources; consolidate when possible
- **Filter Specificity**: Use specific filters to reduce unnecessary updates
- **Data Volume**: Be mindful of the size and frequency of data changes
- **Unsubscribe**: Always unsubscribe when components unmount

## Integration Examples

### Real-time Inspection Form

```tsx
function InspectionForm({ inspectionId }) {
  const { data: inspection, isLoading } = useRealtimeInspection(inspectionId)
  const { items: inspectionItems } = useRealtimeInspectionItems(inspectionId)
  
  // Form state that syncs with real-time data
  const [formState, setFormState] = useState({})
  
  // Keep form in sync with real-time updates
  useEffect(() => {
    if (inspection) {
      setFormState(inspection)
    }
  }, [inspection])
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    await updateInspection(inspectionId, formState)
    // No need to refresh - real-time updates will reflect changes
  }
  
  // Form implementation
}
```

### Collaborative Editing

```tsx
function CollaborativeEditor({ documentId }) {
  const { data: document } = useRealtimeRecord({
    config: {
      table: "documents",
      filter: `id=eq.${documentId}`,
    },
    onDataChange: (newData, oldData, eventType) => {
      if (eventType === "UPDATE") {
        // Show notification about changes
        toast({
          title: "Document Updated",
          description: `Updated by ${newData.updated_by}`,
        })
      }
    }
  })
  
  // Editor implementation
}
```

## Further Documentation

For more detailed information and examples, refer to:

- [Integration Guide](integration-guide.md) - How to integrate real-time features
- [API Reference](api-reference.md) - Detailed API documentation
- [Error Handling](ERROR-HANDLING.md) - How real-time features work with error handling 