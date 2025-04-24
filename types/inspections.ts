// Basic inspection type (for UI purposes)
export type InspectionType = 'routine' | 'safety' | 'maintenance'

// Driver interface
export interface Driver {
  id: string
  name: string
  license_number: string
}

// Interface for the inspection data returned from the API
export interface InspectionData {
  id: string
  vehicle: {
    id: string
    name: string
    plate_number: string
  }
  date: string
  status: string
  type: string
  items: Array<{
    id: string
    section: string
    name: string
    status: 'pass' | 'fail' | null
    notes: string
    photos: string[]
  }>
}

// Define inspection status types
export const InspectionStatus = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELED: 'canceled'
} as const

export type InspectionStatusType = typeof InspectionStatus[keyof typeof InspectionStatus]

// Define template status types
export const TemplateStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
} as const

export type TemplateStatusType = typeof TemplateStatus[keyof typeof TemplateStatus]

// Define item result status types
export const ItemResultStatus = {
  PENDING: 'pending',
  PASS: 'pass',
  FAIL: 'fail',
  NOT_APPLICABLE: 'not_applicable'
} as const

export type ItemResultStatusType = typeof ItemResultStatus[keyof typeof ItemResultStatus]

// Define item types
export const ItemType = {
  PASS_FAIL: 'pass_fail',
  NUMERIC: 'numeric',
  TEXT: 'text',
  MULTIPLE_CHOICE: 'multiple_choice'
} as const

export type ItemTypeType = typeof ItemType[keyof typeof ItemType]

// Database types - these will be properly defined when database schema is generated
// For now, we'll use interface definitions

export interface DbInspectionTemplate {
  id: string
  title: string
  description?: string
  status: TemplateStatusType
  vehicle_type_id?: string
  created_by?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface DbInspectionSection {
  id: string
  template_id: string
  title: string
  description?: string
  order_index: number
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface DbInspectionItem {
  id: string
  section_id: string
  title: string
  description?: string
  item_type: ItemTypeType
  is_required: boolean
  order_index: number
  options?: Record<string, any>
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface DbInspection {
  id: string
  template_id: string
  vehicle_id: string
  status: InspectionStatusType
  inspector_id?: string
  completed_at?: string
  notes?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface DbInspectionItemResult {
  id: string
  inspection_id: string
  item_id: string
  status: ItemResultStatusType
  value?: string
  notes?: string
  photos?: string[]
  created_by?: string
  created_at: string
  updated_at: string
}

// Helper interfaces for related data

export interface InspectionWithRelations extends DbInspection {
  template?: DbInspectionTemplate
  vehicle?: {
    id: string
    name: string
    plate_number: string
    brand?: string
    model?: string
    image_url?: string
  }
  inspector?: {
    id: string
    email?: string
    name?: string
  }
  results?: InspectionItemResultWithRelations[]
}

export interface InspectionItemResultWithRelations extends DbInspectionItemResult {
  item?: DbInspectionItem
}

export interface InspectionTemplateWithRelations extends DbInspectionTemplate {
  sections?: InspectionSectionWithRelations[]
}

export interface InspectionSectionWithRelations extends DbInspectionSection {
  items?: DbInspectionItem[]
} 