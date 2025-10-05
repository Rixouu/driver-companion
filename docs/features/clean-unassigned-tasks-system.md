# Clean Unassigned Tasks System

## Current Problem
The system uses a fake driver with ID `'00000000-0000-0000-0000-000000000000'` to represent unassigned tasks. This causes:
- Fake driver appears in calendar
- Pollutes driver hours summary
- Confusing user experience
- Data integrity issues

## Proposed Solution

### 1. Remove Fake Driver from Calendar
- Filter out the unassigned driver ID from calendar display
- Only show real drivers in the calendar grid
- Keep unassigned tasks in separate panel/section

### 2. Clean Driver Hours Summary
- Exclude fake driver from driver hours calculations
- Only show real drivers with actual capacity settings
- Maintain clean driver statistics

### 3. Dedicated Unassigned Tasks Section
- Keep existing `RevampedUnassignedPanel` for unassigned tasks
- Allow drag-and-drop from unassigned panel to calendar
- Clear separation between assigned and unassigned tasks

### 4. Database Schema Changes
- Use `NULL` driver_id for unassigned tasks instead of fake ID
- Add proper constraints and indexes
- Clean up existing fake driver records

## Implementation Plan

### Phase 1: Filter Fake Driver from Display
1. Update calendar components to exclude fake driver ID
2. Update driver hours summary to exclude fake driver
3. Update task tables to handle NULL driver_id properly

### Phase 2: Database Migration
1. Create migration to set fake driver_id to NULL
2. Remove fake driver record from drivers table
3. Update constraints and indexes

### Phase 3: UI Improvements
1. Enhance unassigned tasks panel
2. Improve drag-and-drop experience
3. Add better visual indicators for unassigned tasks

## Benefits
- Clean data model
- Better user experience
- No fake drivers in system
- Proper separation of concerns
- Easier maintenance and debugging
