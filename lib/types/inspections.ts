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
  items: InspectionItem[]
}

export interface InspectionItem extends InspectionItemTemplate {
  status: 'pass' | 'fail' | null
  notes: string
  photos: string[]
}

export interface InspectionCategory {
  id: string
  name: string
  description: string
  order_number: number
  inspection_item_templates: InspectionItemTemplate[]
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