# Integration Guide: Error Handling & Real-time Updates

This guide outlines how to integrate the new error handling and real-time features into the Vehicle Inspection application.

## 1. Error Handling Integration

### Using Centralized Error Handling

The new error handling system provides consistent error management across the application. Here's how to use it:

```typescript
import { handleError, ErrorType, withErrorHandling } from "@/lib/utils/error-handler"

// Basic error handling
try {
  // Your code that might throw an error
  await saveData()
} catch (error) {
  // Let the centralized handler manage the error
  handleError(error)
}

// Simplified with withErrorHandling utility
await withErrorHandling(
  async () => {
    // Your async operation
    await saveData()
  },
  "Failed to save data" // Optional custom message
)
```

### API Error Handling

For API routes, use the API error handling utilities:

```typescript
import { handleApiError, withApiErrorHandling, createApiErrorResponse } from "@/lib/utils/api-error-handler"
import { ErrorType } from "@/lib/utils/error-handler"

// In API route handlers
export async function POST(request: Request) {
  return withApiErrorHandling(async () => {
    // Your API logic
    const data = await request.json()
    
    // Validation
    if (!data.requiredField) {
      return createApiErrorResponse(
        ErrorType.VALIDATION,
        "Required field is missing"
      )
    }
    
    // Process data...
    return NextResponse.json({ success: true })
  })
}
```

### Error Boundary Component

Use the enhanced error boundary component to catch and display UI errors:

```tsx
import { ErrorBoundary, ErrorMessage } from "@/components/ui/error-boundary"

// Wrap components that might error
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary
  fallback={<CustomErrorUI />}
  onError={(error, errorInfo) => {
    // Additional error handling
    logErrorToService(error, errorInfo)
  }}
>
  <YourComponent />
</ErrorBoundary>

// Display specific errors
function ComponentWithError() {
  const [error, setError] = useState<Error | null>(null)
  
  if (error) {
    return <ErrorMessage error={error} retry={() => setError(null)} />
  }
  
  return <YourComponent />
}
```

### Async Operations with Error Handling

Use the async hooks for data fetching with built-in error handling:

```tsx
import { useAsync, useSafeAsync } from "@/hooks/use-async"

function YourComponent() {
  // Full-featured hook
  const { data, isLoading, error, execute } = useAsync(
    async () => {
      // Your async operation
      return fetchSomeData()
    },
    false // Don't execute immediately
  )
  
  // Simpler hook
  const { data: simpleData, isLoading: simpleLoading, execute: simpleExecute } = useSafeAsync(
    () => fetchSimpleData(),
    {
      onSuccess: (data) => {
        // Handle success
        showSuccessMessage()
      },
      customErrorMessage: "Failed to fetch data" // Custom error message
    }
  )
  
  useEffect(() => {
    execute() // Execute the async operation
  }, [execute])
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} retry={() => execute()} />
  
  return <DataDisplay data={data} />
}
```

## 2. Real-time Updates Integration

### Using Real-time Hooks

The application now supports real-time updates with Supabase. Here's how to use the hooks:

```tsx
import { useRealtimeRecord, useRealtimeCollection } from "@/hooks/use-realtime"
import { RealtimeTable } from "@/lib/services/realtime"

// Subscribe to a single record
function InspectionDetails({ inspectionId }) {
  const { 
    data: inspection,
    isLoading,
    error
  } = useRealtimeRecord({
    config: {
      table: RealtimeTable.INSPECTIONS,
      filter: `id=eq.${inspectionId}`,
    },
    onDataChange: (newData, oldData, eventType) => {
      // Handle changes, e.g., show notifications
      if (eventType === "UPDATE" && oldData?.status !== newData.status) {
        showStatusChangeNotification(oldData?.status, newData.status)
      }
    }
  })
  
  // Render the component...
}

// Subscribe to a collection of records
function InspectionItemsList({ inspectionId }) {
  const {
    items,
    isLoading,
    error
  } = useRealtimeCollection({
    config: {
      table: RealtimeTable.INSPECTION_ITEMS,
      filter: `inspection_id=eq.${inspectionId}`,
    }
  })
  
  // Render the list...
}
```

### Using Specialized Real-time Hooks

The application provides specialized hooks for common entities:

```tsx
import { useRealtimeInspection, useRealtimeInspectionItems } from "@/hooks/use-realtime"

// Use specialized hooks
function InspectionWithItems({ inspectionId }) {
  // Get the inspection
  const { 
    data: inspection,
    isLoading: inspectionLoading
  } = useRealtimeInspection(inspectionId)
  
  // Get the inspection items
  const {
    items: inspectionItems,
    isLoading: itemsLoading
  } = useRealtimeInspectionItems(inspectionId)
  
  if (inspectionLoading || itemsLoading) {
    return <LoadingSpinner />
  }
  
  // Render the inspection with its items...
}
```

### Direct Access to Real-time Subscriptions

For more control, you can use the real-time service directly:

```tsx
import { 
  subscribeToRecord,
  subscribeToCollection,
  RealtimeTable,
  idFilter
} from "@/lib/services/realtime"

// In a React component
useEffect(() => {
  // Set up subscription
  const unsubscribe = subscribeToRecord(
    {
      table: RealtimeTable.VEHICLES,
      filter: idFilter(vehicleId),
    },
    ({ new: newVehicle, old: oldVehicle, eventType }) => {
      // Handle real-time updates
      updateVehicleState(newVehicle)
    }
  )
  
  // Clean up subscription on unmount
  return () => {
    unsubscribe()
  }
}, [vehicleId])
```

## 3. Integration Examples

### Example: Vehicle Inspection Page

Here's how to implement a complete vehicle inspection page with real-time updates and error handling:

```tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ErrorBoundary, ErrorMessage } from "@/components/ui/error-boundary"
import { useRealtimeInspection, useRealtimeInspectionItems } from "@/hooks/use-realtime"
import { withErrorHandling } from "@/lib/utils/error-handler"
import { useToast } from "@/hooks/use-toast"

export default function InspectionPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Get inspection data with real-time updates
  const {
    data: inspection,
    isLoading: inspectionLoading,
    error: inspectionError
  } = useRealtimeInspection(params.id)
  
  // Get inspection items with real-time updates
  const {
    items: inspectionItems,
    isLoading: itemsLoading,
    error: itemsError
  } = useRealtimeInspectionItems(params.id)
  
  // Submit inspection function with error handling
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    await withErrorHandling(
      async () => {
        // Submit logic here
        // ...
        
        toast({
          title: "Success",
          description: "Inspection submitted successfully",
        })
      },
      "Failed to submit inspection"
    )
    
    setIsSubmitting(false)
  }
  
  // Loading state
  if (inspectionLoading || itemsLoading) {
    return <div>Loading inspection...</div>
  }
  
  // Error state
  if (inspectionError) {
    return <ErrorMessage error={inspectionError} />
  }
  
  // Not found state
  if (!inspection) {
    return <div>Inspection not found</div>
  }
  
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Inspection: {inspection.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Status: {inspection.status}</p>
            <p>Vehicle: {inspection.vehicle_name}</p>
            {/* Other inspection details */}
          </CardContent>
        </Card>
        
        <h2 className="text-xl font-bold">Inspection Items</h2>
        <div className="space-y-4">
          {inspectionItems.map(item => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{item.description}</p>
                <p>Status: {item.status}</p>
                {/* Other item details */}
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Inspection"}
        </Button>
      </div>
    </ErrorBoundary>
  )
}
```

### Example: API Route with Error Handling

```typescript
// app/api/inspections/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { withApiErrorHandling, createApiErrorResponse } from "@/lib/utils/api-error-handler"
import { ErrorType } from "@/lib/utils/error-handler"
import { supabase } from "@/lib/supabase"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiErrorHandling(async () => {
    const inspectionId = params.id
    
    // Fetch inspection data
    const { data: inspection, error } = await supabase
      .from("inspections")
      .select("*")
      .eq("id", inspectionId)
      .single()
    
    if (error) throw error
    
    if (!inspection) {
      return createApiErrorResponse(
        ErrorType.RESOURCE_NOT_FOUND,
        `Inspection with ID ${inspectionId} not found`
      )
    }
    
    return NextResponse.json(inspection)
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiErrorHandling(async () => {
    const inspectionId = params.id
    const updates = await request.json()
    
    // Validate updates
    if (!updates || typeof updates !== "object") {
      return createApiErrorResponse(
        ErrorType.VALIDATION,
        "Invalid update data"
      )
    }
    
    // Update the inspection
    const { data, error } = await supabase
      .from("inspections")
      .update(updates)
      .eq("id", inspectionId)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  })
}
```

## 4. Migration Guide

### From Manual Try/Catch to withErrorHandling

Before:
```typescript
try {
  const { data, error } = await supabase.from("inspections").select("*")
  if (error) throw error
  return data
} catch (error) {
  console.error("Error fetching inspections:", error)
  toast({
    title: "Error",
    description: "Failed to fetch inspections",
    variant: "destructive",
  })
  return null
}
```

After:
```typescript
return await withErrorHandling(
  async () => {
    const { data, error } = await supabase.from("inspections").select("*")
    if (error) throw error
    return data
  },
  "Failed to fetch inspections"
)
```

### From Manual State Management to useAsync

Before:
```typescript
const [data, setData] = useState(null)
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState(null)

async function fetchData() {
  setIsLoading(true)
  try {
    const result = await fetchSomeData()
    setData(result)
  } catch (error) {
    setError(error)
    console.error(error)
  } finally {
    setIsLoading(false)
  }
}
```

After:
```typescript
const { data, isLoading, error, execute: fetchData } = useAsync(
  async () => await fetchSomeData()
)
```

### From Polling to Real-time Updates

Before:
```typescript
useEffect(() => {
  let mounted = true
  const interval = setInterval(async () => {
    try {
      const { data } = await supabase
        .from("inspections")
        .select("*")
        .eq("id", inspectionId)
        .single()
      
      if (mounted && data) {
        setInspection(data)
      }
    } catch (error) {
      console.error(error)
    }
  }, 5000)
  
  return () => {
    mounted = false
    clearInterval(interval)
  }
}, [inspectionId])
```

After:
```typescript
const { data: inspection } = useRealtimeInspection(inspectionId)
``` 