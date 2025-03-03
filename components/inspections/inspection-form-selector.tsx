"use client"

import { InspectionType } from "@/lib/types/inspections"
import { RoutineInspectionForm } from "./forms/routine-inspection-form"
import { SafetyInspectionForm } from "./forms/safety-inspection-form"
import { MaintenanceInspectionForm } from "./forms/maintenance-inspection-form"

interface InspectionFormSelectorProps {
  type: InspectionType
  onSectionComplete: (sectionId: string, status: 'pass' | 'fail') => void
  onPhotoAdd: (sectionId: string, itemId: string, photoUrl: string) => void
  onNotesChange: (sectionId: string, itemId: string, notes: string) => void
}

export function InspectionFormSelector({ 
  type,
  onSectionComplete,
  onPhotoAdd,
  onNotesChange 
}: InspectionFormSelectorProps) {
  switch (type) {
    case 'routine':
      return (
        <RoutineInspectionForm
          onSectionComplete={onSectionComplete}
          onPhotoAdd={onPhotoAdd}
          onNotesChange={onNotesChange}
        />
      )
    case 'safety':
      return (
        <SafetyInspectionForm
          onSectionComplete={onSectionComplete}
          onPhotoAdd={onPhotoAdd}
          onNotesChange={onNotesChange}
        />
      )
    case 'maintenance':
      return (
        <MaintenanceInspectionForm
          onSectionComplete={onSectionComplete}
          onPhotoAdd={onPhotoAdd}
          onNotesChange={onNotesChange}
        />
      )
    default:
      return null
  }
} 