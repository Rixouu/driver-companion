# Vehicle Inspection Database Schema

## Tables Overview

### Inspection Templates
- Defines the blueprint for inspections
- Contains general information about the inspection type

### Inspection Sections
- Groups related inspection items
- Belongs to an inspection template
- Has an order for display purposes

### Inspection Items
- Individual inspection checks within a section
- Defines what needs to be inspected and how
- Supports different item types (pass/fail, numeric, text, multiple-choice)

### Inspections
- Represents an actual inspection performed on a vehicle
- References the template used
- Tracks the overall status of the inspection

### Inspection Item Results
- Stores the results for each inspection item
- Links to both the inspection and the item being inspected
- Contains actual values, notes, and photo evidence

## Entity Relationships

```
inspection_templates
    |
    +--> inspection_sections
              |
              +--> inspection_items
                        |
                        |
inspections <-----------+
    |                   |
    +--> inspection_item_results
```

## Table Definitions

### inspection_templates
| Column          | Type         | Description                    |
|-----------------|--------------|--------------------------------|
| id              | UUID         | Primary key                    |
| title           | VARCHAR(255) | Template name                  |
| description     | TEXT         | Description of the template    |
| status          | VARCHAR(20)  | draft/active/inactive/archived |
| vehicle_type_id | UUID         | Type of vehicle this is for    |
| created_by      | UUID         | User who created the template  |
| metadata        | JSONB        | Additional flexible data       |
| created_at      | TIMESTAMPTZ  | Creation timestamp             |
| updated_at      | TIMESTAMPTZ  | Update timestamp               |
| deleted_at      | TIMESTAMPTZ  | Soft delete timestamp          |

### inspection_sections
| Column       | Type         | Description                  |
|--------------|--------------|------------------------------|
| id           | UUID         | Primary key                  |
| template_id  | UUID         | FK to inspection_templates   |
| title        | VARCHAR(255) | Section name                 |
| description  | TEXT         | Section description          |
| order_index  | INTEGER      | Display order                |
| metadata     | JSONB        | Additional flexible data     |
| created_at   | TIMESTAMPTZ  | Creation timestamp           |
| updated_at   | TIMESTAMPTZ  | Update timestamp             |
| deleted_at   | TIMESTAMPTZ  | Soft delete timestamp        |

### inspection_items
| Column       | Type         | Description                   |
|--------------|--------------|-------------------------------|
| id           | UUID         | Primary key                   |
| section_id   | UUID         | FK to inspection_sections     |
| title        | VARCHAR(255) | Item name                     |
| description  | TEXT         | Item description              |
| item_type    | VARCHAR(50)  | pass_fail/numeric/text/choice |
| is_required  | BOOLEAN      | Whether item must be checked  |
| order_index  | INTEGER      | Display order                 |
| options      | JSONB        | Options for multiple choice   |
| metadata     | JSONB        | Additional flexible data      |
| created_at   | TIMESTAMPTZ  | Creation timestamp            |
| updated_at   | TIMESTAMPTZ  | Update timestamp              |
| deleted_at   | TIMESTAMPTZ  | Soft delete timestamp         |

### inspections
| Column        | Type         | Description                         |
|---------------|--------------|-------------------------------------|
| id            | UUID         | Primary key                         |
| template_id   | UUID         | FK to inspection_templates          |
| vehicle_id    | UUID         | FK to vehicles                      |
| status        | VARCHAR(20)  | in_progress/completed/failed/canceled |
| inspector_id  | UUID         | FK to auth.users                    |
| completed_at  | TIMESTAMPTZ  | When inspection was completed       |
| notes         | TEXT         | Overall inspection notes            |
| metadata      | JSONB        | Additional flexible data            |
| created_at    | TIMESTAMPTZ  | Creation timestamp                  |
| updated_at    | TIMESTAMPTZ  | Update timestamp                    |
| deleted_at    | TIMESTAMPTZ  | Soft delete timestamp               |

### inspection_item_results
| Column         | Type         | Description                   |
|----------------|--------------|-------------------------------|
| id             | UUID         | Primary key                   |
| inspection_id  | UUID         | FK to inspections             |
| item_id        | UUID         | FK to inspection_items        |
| status         | VARCHAR(20)  | pending/pass/fail/not_applicable |
| value          | TEXT         | Value for numeric/text items  |
| notes          | TEXT         | Notes for this item           |
| photos         | TEXT[]       | Array of photo URLs           |
| created_by     | UUID         | FK to auth.users              |
| created_at     | TIMESTAMPTZ  | Creation timestamp            |
| updated_at     | TIMESTAMPTZ  | Update timestamp              | 