"use client"

import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface InspectionDBSchema extends DBSchema {
  inspections: {
    key: string
    value: {
      id: string
      vehicleId: string
      timestamp: string
      status: 'draft' | 'pending' | 'synced'
      data: any
    }
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
        if (!db.objectStoreNames.contains('inspections')) {
          db.createObjectStore('inspections', { keyPath: 'id' })
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

  async saveInspection(inspection: any) {
    const db = await this.init()
    await db.put('inspections', {
      ...inspection,
      status: 'draft',
      timestamp: new Date().toISOString(),
    })
  }

  async savePhoto(photo: any) {
    const db = await this.init()
    await db.put('photos', {
      ...photo,
      timestamp: new Date().toISOString(),
    })
  }

  async saveRecording(recording: any) {
    const db = await this.init()
    await db.put('recordings', {
      ...recording,
      timestamp: new Date().toISOString(),
    })
  }

  async getInspection(id: string) {
    const db = await this.init()
    return db.get('inspections', id)
  }

  async getPendingInspections() {
    const db = await this.init()
    return db.getAllFromIndex('inspections', 'status', 'pending')
  }

  async markAsSynced(id: string) {
    const db = await this.init()
    const inspection = await this.getInspection(id)
    if (inspection) {
      await db.put('inspections', { ...inspection, status: 'synced' })
    }
  }
}

export const offlineStorage = new OfflineStorage() 