"use client"

import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface InspectionProgress {
  items: Record<string, InspectionItem[]>
  photos: string[]
  recordings: string[]
  timestamp: string
}

interface InspectionItem {
  id: string
  label: string
  status: "pass" | "fail" | null
  photos: string[]
  notes: string
}

interface InspectionDBSchema extends DBSchema {
  inspections: {
    key: string
    value: {
      id: string
      vehicleId: string
      timestamp: string
      status: 'draft' | 'pending' | 'synced'
      data: InspectionProgress
    }
    indexes: { 'status': string }
  }
  photos: {
    key: string
    value: {
      id: string
      inspectionId: string
      sectionId: string
      blob: Blob
      timestamp: string
    }
  }
  recordings: {
    key: string
    value: {
      id: string
      inspectionId: string
      sectionId: string
      blob: Blob
      duration: number
      timestamp: string
    }
  }
}

class OfflineStorage {
  private db: IDBPDatabase<InspectionDBSchema> | null = null
  private dbName = 'vehicle-inspection-db'
  private version = 1

  async init() {
    if (this.db) return this.db

    this.db = await openDB<InspectionDBSchema>(this.dbName, this.version, {
      upgrade(db) {
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('inspections')) {
          const inspectionsStore = db.createObjectStore('inspections', { keyPath: 'id' })
          inspectionsStore.createIndex('status', 'status')
        }
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('recordings')) {
          db.createObjectStore('recordings', { keyPath: 'id' })
        }
      },
    })

    return this.db
  }

  async saveProgress(vehicleId: string, data: InspectionProgress) {
    const db = await this.init()
    const id = `progress-${vehicleId}`
    await db.put('inspections', {
      id,
      vehicleId,
      status: 'draft',
      timestamp: new Date().toISOString(),
      data
    })
  }

  async loadProgress(vehicleId: string): Promise<InspectionProgress | null> {
    const db = await this.init()
    const id = `progress-${vehicleId}`
    const record = await db.get('inspections', id)
    return record?.data || null
  }

  async clearProgress(vehicleId: string) {
    const db = await this.init()
    const id = `progress-${vehicleId}`
    await db.delete('inspections', id)
  }
}

export const offlineStorage = new OfflineStorage()

export function saveProgress(vehicleId: string, data: InspectionProgress): void {
  try {
    localStorage.setItem(`inspection-progress-${vehicleId}`, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save inspection progress:', error)
  }
}

export function loadProgress(vehicleId: string): InspectionProgress | null {
  try {
    const data = localStorage.getItem(`inspection-progress-${vehicleId}`)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Failed to load inspection progress:', error)
    return null
  }
}

export function clearProgress(vehicleId: string): void {
  try {
    localStorage.removeItem(`inspection-progress-${vehicleId}`)
  } catch (error) {
    console.error('Failed to clear inspection progress:', error)
  }
} 