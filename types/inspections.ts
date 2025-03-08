export interface Driver {
  id: string
  name: string
  email: string
  created_at: string
}

export interface Inspection {
  id: string
  vehicle_id: string
  inspector_id: string
  vehicle: {
    id: string
    name: string
    plate_number: string
  }
  inspector: Driver | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed'
  date: string
  notes: string
  items: Array<{
    name: string
    status: string
  }>
  created_at: string
}

export interface InspectionCategory {
  id: string
  name: string
  description?: string
  order_number: number
  inspection_item_templates?: InspectionItemTemplate[]
}

export interface InspectionFormItem {
  id: string
  name: string
  description: string
  category_id: string
  status: 'pass' | 'fail' | 'not_checked'
  photos: string[]
  notes?: string
}

export interface InspectionItem {
  id: string
  inspection_id?: string
  category: string
  category_id: string
  item: string
  status: 'pending' | 'pass' | 'fail'
  notes?: string
  order_number?: number
}

export interface InspectionPhoto {
  id: string
  result_id: string
  photo_url: string
}

export interface InspectionDetails {
  id: string
  vehicle_name: string
  plate_number: string
  model: string
  year: string
  date: string
  status: string
  inspector_name: string | null
}

export interface InspectionResult {
  id: string
  status: string
  notes: string | null
  item: {
    id: string
    category: string
    item: string
  }
  photos: {
    id: string
    photo_url: string
  }[]
}

// Types from lib/types/inspections.ts
export type InspectionType = 'routine' | 'safety' | 'maintenance'

export interface InspectionTemplate {
  id: string
  type: InspectionType
  title: string
  description: string
  sections: InspectionSection[]
}

export interface InspectionSection {
  id: string
  title: string
  description: string
  items: InspectionItemExtended[]
}

export interface InspectionItemExtended extends InspectionItemTemplate {
  status: 'pass' | 'fail' | null
  notes: string
  photos: string[]
}

export interface InspectionItemTemplate {
  id: string
  name: string
  description: string
  requires_photo: boolean
  requires_notes: boolean
  order_number: number
}

export interface SectionWithItems extends InspectionCategory {
  items: (InspectionItemTemplate & {
    status: 'pass' | 'fail' | null
    notes: string
    photos: string[]
  })[]
} 