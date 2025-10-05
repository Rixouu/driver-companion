# Shift Management System Refactor Plan

## Current State vs Required State

### Your Excel Structure
```
Row 1-10: Task Numbers (タスク番号 1-10)
Columns: Days (September 29 - October 5, etc.)
Cells: Task numbers assigned to drivers per day
Yellow cells: Charter services with duration info
```

### Example from Excel:
**Jonathan Rycx (JR) on Saturday, October 4:**
- Has booking: "16:00 Charter Services"
- Duration: 3 days, 4 hours/day
- Should span: Oct 4, 5, 6 visually

### Current System Issues
1. ❌ **Booking-only** - Can only display bookings from database
2. ❌ **No tasks** - No concept of task numbers (1-10)
3. ❌ **Single day** - Each booking shows only on one date
4. ❌ **No manual assignment** - Can't create arbitrary tasks
5. ❌ **Poor colors** - Text hard to read in dark/light modes

---

## Proposed Solution

### 1. Database Schema Changes

#### New Table: `crew_tasks`
```sql
CREATE TABLE crew_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_number INT NOT NULL, -- 1-10
  task_type TEXT NOT NULL, -- 'charter', 'training', 'day_off', 'maintenance', 'regular'
  driver_id UUID REFERENCES drivers(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL, -- For multi-day tasks
  start_time TIME,
  end_time TIME,
  hours_per_day DECIMAL(4,2), -- For charter: 4.0 hours/day
  
  -- Link to booking if applicable
  booking_id UUID REFERENCES bookings(id),
  
  -- Task details
  title TEXT,
  description TEXT,
  location TEXT,
  customer_name TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  color TEXT, -- Custom color override
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id)
);

CREATE INDEX idx_crew_tasks_driver_date ON crew_tasks(driver_id, start_date, end_date);
CREATE INDEX idx_crew_tasks_task_number ON crew_tasks(task_number);
```

### 2. Task Types & Colors

#### Task Type Colors (High Contrast)
```typescript
const TASK_COLORS = {
  charter: {
    light: {
      bg: 'bg-blue-100 dark:bg-blue-900/40',
      text: 'text-blue-900 dark:text-blue-100',
      border: 'border-l-blue-600 dark:border-l-blue-400'
    }
  },
  training: {
    light: {
      bg: 'bg-purple-100 dark:bg-purple-900/40',
      text: 'text-purple-900 dark:text-purple-100',
      border: 'border-l-purple-600 dark:border-l-purple-400'
    }
  },
  day_off: {
    light: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-900 dark:text-gray-100',
      border: 'border-l-gray-500 dark:border-l-gray-400'
    }
  },
  regular: {
    light: {
      bg: 'bg-green-100 dark:bg-green-900/40',
      text: 'text-green-900 dark:text-green-100',
      border: 'border-l-green-600 dark:border-l-green-400'
    }
  }
};
```

### 3. Multi-Day Charter Display

#### Current (Wrong):
```
Oct 4: [Charter Service - 16:00]
Oct 5: [empty]
Oct 6: [empty]
```

#### Proposed (Correct):
```
Oct 4: [Charter Service - Day 1/3 - 4h]
Oct 5: [Charter Service - Day 2/3 - 4h]  (same card, continued)
Oct 6: [Charter Service - Day 3/3 - 4h]  (same card, continued)
```

**Implementation:**
- Single `crew_tasks` record with `start_date=Oct 4`, `end_date=Oct 6`
- Calendar grid renders card spanning across all 3 days
- Card shows: "16:00 • Charter Services • Day 1-3/3 • 4h/day"

### 4. Task Assignment UI

#### Click "+" Button Opens Modal:
```
┌─────────────────────────────────────┐
│  Assign Task - Jonathan Rycx       │
│  Date: October 4, 2025              │
├─────────────────────────────────────┤
│                                     │
│  ○ Assign Existing Task             │
│    [Select Task Number: 1-10 ▾]    │
│                                     │
│  ○ Create New Task                  │
│    Task Type: [Charter ▾]           │
│    Title: [_____________________]   │
│    Start Date: [Oct 4 ▾]            │
│    End Date: [Oct 6 ▾]              │
│    Hours/Day: [4.0]                 │
│    Start Time: [16:00]              │
│                                     │
│  ○ Mark as Day Off                  │
│  ○ Mark as Training                 │
│                                     │
│  [Cancel]  [Assign Task]            │
└─────────────────────────────────────┘
```

### 5. Calendar Cell Display

#### For Multi-Day Task:
```tsx
<div className="task-cell border-l-4 border-l-blue-600">
  <div className="task-number">3</div>
  <div className="task-title">Charter Services</div>
  <div className="task-meta">Day 1/3 • 4h</div>
  <div className="task-time">16:00</div>
</div>
```

#### For Multiple Tasks Same Day:
```tsx
<div className="day-cell">
  <div className="task task-1">1</div>
  <div className="task task-3">3</div>
  <div className="task task-5">5</div>
</div>
```

### 6. API Endpoints

```typescript
// Create new task
POST /api/crew-tasks
Body: { task_type, driver_id, start_date, end_date, hours_per_day, ... }

// Assign existing task number
POST /api/crew-tasks/{taskNumber}/assign
Body: { driver_id, date }

// Get tasks for date range
GET /api/crew-tasks?start_date=2025-10-01&end_date=2025-10-31

// Update task
PATCH /api/crew-tasks/{id}

// Delete task
DELETE /api/crew-tasks/{id}
```

---

## Implementation Steps

### Phase 1: Database & Backend ✅
1. Create `crew_tasks` table
2. Create API routes for CRUD operations
3. Update `get_shift_schedule` function to include tasks

### Phase 2: UI Components ✅
1. Create `TaskCell` component (replaces `BookingCell`)
2. Update color scheme for readability
3. Handle multi-day rendering (grid-column-span)
4. Show task numbers prominently

### Phase 3: Task Management ✅
1. Create `TaskAssignmentModal` component
2. Add task creation form
3. Add task number selector (1-10)
4. Connect "+" button to modal

### Phase 4: Integration ✅
1. Update calendar grid to use tasks instead of bookings
2. Add drag-and-drop task reassignment
3. Add task filtering/search
4. Add bulk operations

---

## Migration Strategy

### Option A: Clean Start
- Drop current shift-related data
- Fresh `crew_tasks` table
- Manually recreate schedule

### Option B: Data Migration
- Keep existing booking data
- Create `crew_tasks` records from bookings
- Link `booking_id` for reference

**Recommendation:** Option A for faster implementation, Option B if you have critical existing data.

---

## Questions for You

1. **Task Numbers (1-10):**
   - Are these pre-defined tasks with specific meanings?
   - Or are they just identifiers you assign manually?
   - Do you want a master list of "Task 1 = Airport Transfer", "Task 2 = City Tour", etc.?

2. **Charter Services:**
   - Always multi-day?
   - Always show as one continuous block?
   - Need to see day-by-day breakdown (Day 1/3, Day 2/3, etc.)?

3. **Task Assignment:**
   - Can same task number be assigned to multiple drivers same day?
   - Can driver have same task number multiple times per day?

4. **UI Preferences:**
   - Show task number prominently (large "3" in cell)?
   - Show booking details on hover/click?
   - Color by task type or status?

---

## Next Steps

Please review this plan and let me know:
1. ✅ Confirm this matches your requirements
2. ✅ Answer the questions above
3. ✅ Choose migration strategy (A or B)
4. ✅ Any additional features needed

Once confirmed, I'll implement this system completely!

