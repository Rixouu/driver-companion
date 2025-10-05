# Testing the New Shift Management System

## 🐛 Fixes Applied

### 1. Calendar Date Selection Fixed ✅
**Issue**: Calendar dates weren't selectable in the task creation sheet.

**Fix**: 
- Added `type="button"` to calendar trigger buttons (prevents form submission)
- Changed date format handling to use `format(date, "yyyy-MM-dd")` directly
- Added `align="start"` to popover positioning

### 2. Google Maps Autocomplete Added ✅
**Issue**: Location field was plain text input.

**Fix**:
- Integrated `GooglePlaceAutocomplete` component (same as booking form)
- Autocomplete for Japan locations
- Fallback to manual input if Google Maps fails

### 3. API Integration Completed ✅
**Issue**: Task creation/editing wasn't actually calling the backend.

**Fix**:
- Connected `handleTaskCreate` to POST `/api/crew-tasks`
- Connected `handleDeleteTask` to DELETE `/api/crew-tasks/{id}`
- Connected `handleAssignTask` to PUT `/api/crew-tasks/{id}`
- Updated page to use `useCrewTasks` hook (proper crew tasks API)
- Calendar now uses `CrewTaskCalendarGrid` component

### 4. Test Data Generator Added ✅
**Feature**: Easy way to populate the system with test tasks.

**Created**:
- `TestDataManager` component with "Generate Test Tasks" button
- Creates ~20+ varied tasks across different drivers
- Includes: Charter, Regular, Training, Maintenance, Meetings
- Multi-day tasks, multiple tasks per day, different times
- "Clear All Tasks" button for cleanup

## 🧪 How to Test

### Step 1: Generate Test Data
1. Navigate to `/shifts` in your browser
2. Look for the yellow "Test Data Manager" card
3. Click **"Generate Test Tasks"** button
4. Wait for success message
5. You should see tasks appear in the calendar!

### Step 2: Test Task Creation
1. Click **"Create Task"** button (top right)
2. Select a task type (e.g., "Charter Service")
3. **Test calendar**: Click date buttons - they should now work!
4. Fill in task details:
   - Title: "Test Charter"
   - Start date: Pick from calendar
   - **Test location autocomplete**: Start typing "Tokyo" and select from dropdown
   - Add customer info if applicable
5. Click "Create Task"
6. Check if task appears in calendar

### Step 3: Test Multi-Task Per Day
1. Click on a cell that already has a task
2. You should see existing tasks stacked vertically
3. Click "Add Task" button at bottom of cell
4. Create another task for same driver/day
5. Both tasks should display stacked

### Step 4: Test Bulk Creation
1. Click "Create Task"
2. Select task type: "Meeting"
3. Check **"Apply to Multiple Drivers"**
4. Select 2-3 drivers or click "Select All"
5. Fill in: "Team Meeting" for today
6. Click "Create Task"
7. All selected drivers should have the same task

### Step 5: Test Drag & Drop
1. Click **"Unassigned Tasks"** button (coming soon - needs unassigned tasks in DB)
2. Drag a task from the panel
3. Drop it on a calendar cell
4. Task should be assigned to that driver/date

### Step 6: Test Tasks Table
1. Scroll below the calendar
2. See "All Tasks" table
3. Test filters:
   - Search by task name
   - Filter by type
   - Filter by status
   - Filter by driver
4. Click edit/view/delete buttons
5. Drag tasks from table to calendar

### Step 7: Test View Switching
1. Use dropdown in filters: "Week View"
2. Switch to "Day View" - see single day
3. Switch to "Month View" - see whole month
4. Use prev/next arrows to navigate
5. Click "Today" to return to current date

### Step 8: Test Multi-Day Tasks
1. Create a new task
2. Check **"Multi-Day Task"** checkbox
3. Select start date: Today
4. Select end date: 3 days from now
5. Create task
6. Task should appear on all days with "Day 1/3", "Day 2/3", etc.

### Step 9: Test Google Maps
1. Create charter/regular task
2. In location field, type "Shibuya"
3. You should see Google autocomplete suggestions
4. Select one - address should fill in
5. If Google Maps is not loaded, fallback to manual entry

### Step 10: Cleanup
1. Click **"Clear All Tasks"** button
2. Confirm deletion
3. All tasks should be removed
4. You can generate new test data anytime!

## 📊 Expected Test Data

When you click "Generate Test Tasks", you'll get:

**For each of 3 drivers:**
- Task 1: Charter service today (4h, 8:00-12:00)
- Task 2: Regular service tomorrow (8h, 9:00-17:00)
- Task 3: Training course (multi-day, 3 days)
- Task 4: Evening service tomorrow (4h, 18:00-22:00) - **2nd task same day!**
- Task 5: Vehicle maintenance
- Task 6: Team meeting

**Total**: ~18-20 tasks across different types, dates, and scenarios

## 🎯 Things to Verify

- ✅ Calendar dates are selectable
- ✅ Tasks appear in calendar cells
- ✅ Multiple tasks stack vertically
- ✅ Google Maps autocomplete works
- ✅ Bulk creation works
- ✅ Multi-day tasks span correctly
- ✅ Tasks table shows all tasks
- ✅ Filters work in table
- ✅ Edit/delete functions work
- ✅ Day/Week/Month views work
- ✅ Task colors match types
- ✅ Task numbers display correctly

## 🚨 Known Limitations

1. **Unassigned Tasks Panel**: Needs tasks to be marked as "unassigned" in DB
2. **Drag & Drop**: Currently logs to console, needs full implementation
3. **Task Edit**: Opens creation sheet with existing data (works)
4. **Conflict Detection**: Basic validation in API, visual warnings coming
5. **Test Data Manager**: Should be removed in production (clearly marked)

## 🔧 If Something Doesn't Work

### Calendar dates not selectable?
- Check browser console for errors
- Make sure form is not submitting (type="button" on triggers)

### No tasks showing?
- Check browser Network tab for API errors
- Verify drivers exist in database
- Click "Generate Test Tasks" again

### Google Maps not working?
- Check if Google Maps API key is configured
- Fallback to manual entry should work
- Check browser console for Google Maps errors

### Tasks not saving?
- Check Network tab for 400/500 errors
- Verify crew_tasks table exists
- Check Supabase logs

## 📝 Next Steps

Once basic functionality is verified:
1. Remove Test Data Manager component (or hide in production)
2. Implement unassigned tasks tracking
3. Add real-time updates
4. Add conflict warnings
5. Integrate with booking system
6. Add notifications for drivers
7. Mobile optimization
8. Export/print schedules

---

**Status**: Ready for testing!
**Date**: October 4, 2025

