# Auto-Scroll Hook Documentation

## Overview

The `useAutoScroll` hook provides a reusable solution for automatically scrolling to a target element when specific conditions are met. This is particularly useful for calendar components where users click on days with events and need to see the details panel.

## Usage

### Basic Implementation

```tsx
import { useAutoScroll } from "@/lib/hooks/use-auto-scroll"

function MyCalendarComponent() {
  // Define the condition for when to scroll
  const { targetRef, scrollToTarget } = useAutoScroll(
    (date: Date) => getEventsForDate(date).length > 0,
    { scrollDelay: 100 }
  )

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    scrollToTarget(date) // This will scroll if condition is met
  }

  return (
    <div>
      {/* Calendar grid */}
      <div onClick={() => handleDayClick(someDate)}>Day</div>
      
      {/* Target element to scroll to */}
      <div ref={targetRef}>
        {/* Details panel content */}
      </div>
    </div>
  )
}
```

### Configuration Options

```tsx
const { targetRef, scrollToTarget } = useAutoScroll(
  (data) => shouldScrollCondition(data),
  {
    scrollDelay: 150,        // Delay before scrolling (default: 100ms)
    behavior: 'smooth',      // Scroll behavior (default: 'smooth')
    block: 'start',          // Vertical alignment (default: 'start')
    inline: 'nearest'        // Horizontal alignment (default: 'nearest')
  }
)
```

## Applied Components

This hook has been successfully applied to:

1. **Sales Calendar** (`components/sales/sales-calendar.tsx`)
   - Scrolls to sidebar when clicking on days with quotations/bookings

2. **Inspection List** (`components/inspections/inspection-list.tsx`)
   - Scrolls to sidebar when clicking on days with inspections

3. **Dispatch Calendar** (`components/dispatch/dispatch-calendar-view.tsx`)
   - Scrolls to details panel when clicking on days with dispatch entries

## Benefits

- **Reusable**: Single hook for all calendar components
- **Configurable**: Customizable scroll behavior and timing
- **Type-Safe**: Full TypeScript support
- **Mobile-Friendly**: Especially helpful on mobile devices
- **Performance**: Uses `useCallback` for optimized re-renders
- **Accessible**: Maintains proper scroll behavior for screen readers

## Mobile Optimization

The hook is particularly beneficial on mobile devices where:
- The details panel might be below the fold
- Users need immediate visual feedback
- Touch interactions require smooth scrolling
- Screen real estate is limited

## Future Enhancements

Potential improvements could include:
- Scroll offset customization
- Animation duration control
- Multiple target support
- Intersection observer integration
- Keyboard navigation support
