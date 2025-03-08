// First, let's create a type helper for our translations
export type TranslationValue = string | { [key: string]: TranslationValue }

export type TranslationKeys<T> = {
  [K in keyof T]: T[K] extends string 
    ? string 
    : T[K] extends object 
    ? TranslationKeys<T[K]> 
    : never
}

export type RecursiveStringRecord = {
  [key: string]: string | RecursiveStringRecord | CommonTranslations | DashboardTranslations
}

export interface CommonTranslations {
  status: {
    inProgress: string
    upcoming: string
    recent: string
    active: string
    inactive: string
    completed: string
    scheduled: string
    type: string
  }
  loading: string
  error: string
  success: string
  cancel: string
  save: string
  edit: string
  delete: string
  view: string
  back: string
  search: string
  filter: string
  all: string
  noResults: string
  menu: string
  login: string
  logout: string
  details: string
  actions: string
  viewDetails: string
  addNew: string
  backTo: string
  backToList: string
  saving: string
  update: string
  create: string
  deleting: string
  inProgress: string
  upcoming: string
  recent: string
  total: string
}

export interface DashboardTranslations {
  title: string
  description: string
  quickActions: {
    title: string
    description: string
    addVehicle: string
    scheduleMaintenance: string
    scheduleInspection: string
    viewReports: string
  }
  maintenance: {
    title: string
    description: string
  }
  inspections: {
    title: string
    description: string
  }
  stats: {
    totalVehicles: string
    maintenanceTasks: string
    inspections: string
    activeVehicles: string
  }
  sections: {
    maintenanceSchedule: {
      title: string
      noPending: string
    }
    inspectionSchedule: {
      title: string
      noPending: string
    }
    recentMaintenance: {
      title: string
      noCompleted: string
    }
    recentInspections: {
      title: string
      noCompleted: string
    }
  }
}

export interface TranslationValues extends RecursiveStringRecord {
  common: CommonTranslations
  dashboard: DashboardTranslations
  labels: {
    due: string
    priority: {
      high: string
      medium: string
      low: string
    }
    status: {
      scheduled: string
      inProgress: string
    }
  }
  navigation: {
    dashboard: string
    vehicles: string
    maintenance: string
    inspections: string
    settings: string
    reporting: string
  }
  settings: {
    title: string
    description: string
    profile: {
      title: string
      description: string
      name: string
      email: string
      emailDescription: string
    }
    preferences: {
      title: string
      description: string
      theme: {
        title: string
        light: string
        dark: string
        system: string
      }
      language: {
        title: string
        en: string
        ja: string
      }
    }
  }
  vehicles: {
    title: string
    description: string
    addVehicle: string
    newVehicle: string
    editVehicle?: string
    searchPlaceholder: string
    noVehicles: string
    status: {
      active: string
      maintenance: string
      inactive: string
    }
    fields: {
      name: string
      nameDescription: string
      namePlaceholder: string
      plateNumber: string
      brand: string
      brandDescription: string
      brandPlaceholder: string
      model: string
      modelPlaceholder: string
      year: string
      yearPlaceholder: string
      vin: string
      vinDescription: string
      status: string
      statusDescription: string
      image: string
      imageDescription: string
      modelDescription: string
      yearDescription: string
      plateNumberDescription: string
      plateNumberPlaceholder: string
      statusPlaceholder: string
      statusActive: string
      statusInactive: string
      statusMaintenance: string
      uploadImage: string
      formCompletion: string
      formCompletionDescription: string
      vinPlaceholder: string
      uploadImageButton: string
      uploadImageDragText: string
      uploadImageSizeLimit: string
      color?: string
    }
    tabs: {
      schedule: string
      history: string
      costs: string
      reminders: string
      scheduleEmpty: string
      historyEmpty: string
      costsEmpty: string
      remindersEmpty: string
      upcomingMaintenance: string
      scheduledInspections: string
      addMaintenanceTask: string
      scheduleInspection: string
      maintenanceHistory: string
      inspectionHistory: string
      completedOn: string
      totalCosts: string
      maintenanceCosts: string
      fuelCosts: string
      otherCosts: string
      addReminder: string
      noReminders: string
      info?: string
      inProgress: string
    }
    messages: {
      createSuccess: string
      updateSuccess: string
      deleteSuccess: string
      error: string
      deleteError: string
      hasAssociatedRecords: string
      imageUploadError: string
    }
    addNewTitle: string
    addNewDescription: string
    vehicleInformation: string
    vehicleDetails: string
    vehicleStatus: string
    edit: {
      title: string
      description: string
    }
    delete: {
      title: string
      description: string
    }
    details?: string
    form?: {
      basicInfo: string
      additionalInfo: string
    }
    placeholders?: {
      name: string
      plateNumber: string
      brand: string
      model: string
      year: string
      vin: string
    }
    schedule: {
      title: string
      maintenanceTitle: string
      inspectionsTitle: string
      noUpcoming: string
      noMaintenanceTasks: string
      noInspections: string
    }
    history: {
      title: string
      maintenanceTitle: string
      inspectionTitle: string
      noRecords: string
      noMaintenanceRecords: string
      noInspectionRecords: string
      inspection: string
      maintenance: string
    }
    inProgress: {
      title: string
      maintenanceTitle: string
      inspectionsTitle: string
      noTasks: string
      noMaintenanceTasks: string
      noInspections: string
    }
    deleteDialog: {
      title: string
      description: string
    }
  }
  maintenance: {
    title: string
    description: string
    addTask: string
    newTask: string
    editTask: string
    searchPlaceholder: string
    noTasks: string
    schedule: {
      title: string
      details: string
      description: string
      button: string
    }
    createDirect: string
    status: {
      pending: string
      scheduled: string
      in_progress: string
      completed: string
      cancelled: string
    }
    priority: {
      title: string
      high: string
      medium: string
      low: string
    }
    fields: {
      title: string
      titlePlaceholder: string
      titleDescription: string
      description: string
      descriptionPlaceholder: string
      descriptionDescription: string
      vehicle: string
      vehicleDescription: string
      dueDate: string
      dueDateDescription: string
      priority: string
      priorityDescription: string
      status: string
      statusDescription: string
      estimatedDuration: string
      estimatedDurationPlaceholder: string
      estimatedDurationDescription: string
      cost: string
      costDescription: string
      estimatedCost: string
      estimatedCostPlaceholder: string
      estimatedCostDescription: string
      selectVehicle: string
      selectVehiclePlaceholder: string
      notes: string
      notesPlaceholder: string
      notesDescription: string
      dueDatePlaceholder: string
    }
    details: {
      taskDetails: string
      vehicleDetails: string
      vehicleInfo: {
        noImage: string
      }
      scheduledFor: string
      estimatedCompletion: string
      estimatedCost: string
      assignedVehicle: string
      taskHistory: string
      noHistory: string
      taskProgress: string
      hours: string
      overdueDays: string
      daysUntilDue: string
      recommendations: string
      recommendationItems: {
        checkRelated: string
        checkRelatedDesc: string
        trackCosts: string
        trackCostsDesc: string
      }
      progressStatus: {
        completed: string
        inProgress: string
        scheduled: string
        overdue: string
      }
    }
    messages: {
      createSuccess: string
      updateSuccess: string
      deleteSuccess: string
      taskStarted: string
      error: string
    }
    actions: {
      markComplete: string
      markInProgress: string
      startTask: string
      cancel: string
      edit: string
      delete: string
    }
  }
  inspections: {
    title: string
    description: string
    addInspection: string
    newInspection: string
    editInspection: string
    searchPlaceholder: string
    noInspections: string
    createDirect: string
    defaultType: string
    status: {
      scheduled: string
      in_progress: string
      completed: string
      cancelled: string
    }
    type: {
      select: string
      routine: string
      safety: string
      maintenance: string
      description: {
        routine: string
        safety: string
        maintenance: string
      }
    }
    sections: {
      steering_system: {
        title: string
        description: string
        items: {
          steering_wheel: {
            title: string
            description: string
          }
          power_steering: {
            title: string
            description: string
          }
          steering_column: {
            title: string
            description: string
          }
        }
      }
      brake_system: {
        title: string
        description: string
        items: {
          brake_pedal: {
            title: string
            description: string
          }
          brake_discs: {
            title: string
            description: string
          }
          brake_fluid: {
            title: string
            description: string
          }
        }
      }
      safety_equipment: {
        title: string
        description: string
        items: {
          seatbelt_operation: {
            title: string
            description: string
          }
          airbag_system: {
            title: string
            description: string
          }
          wiper_operation: {
            title: string
            description: string
          }
        }
      }
      electrical: {
        title: string
        description: string
        items: {
          battery_condition: {
            title: string
            description: string
          }
          alternator_output: {
            title: string
            description: string
          }
          starter_operation: {
            title: string
            description: string
          }
        }
      }
      suspension: {
        title: string
        description: string
        items: {
          shock_absorbers: {
            title: string
            description: string
          }
          springs: {
            title: string
            description: string
          }
          bushings: {
            title: string
            description: string
          }
          ball_joints: {
            title: string
            description: string
          }
        }
      }
      lighting: {
        title: string
        description: string
        items: {
          headlights: {
            title: string
            description: string
          }
          taillights: {
            title: string
            description: string
          }
          turn_indicators: {
            title: string
            description: string
          }
        }
      }
      tires: {
        title: string
        description: string
        items: {
          tread_depth: {
            title: string
            description: string
          }
          tire_pressure: {
            title: string
            description: string
          }
          tire_condition: {
            title: string
            description: string
          }
          wheel_alignment: {
            title: string
            description: string
          }
          wear_pattern: {
            title: string
            description: string
          }
        }
      }
      engine: {
        title: string
        description: string
        items: {
          oil_level: {
            title: string
            description: string
          }
          coolant_level: {
            title: string
            description: string
          }
          belts: {
            title: string
            description: string
          }
          drive_belts: {
            title: string
            description: string
          }
          hoses: {
            title: string
            description: string
          }
          fluid_leaks: {
            title: string
            description: string
          }
        }
      }
      transmission: {
        title: string
        description: string
        items: {
          transmission_fluid: {
            title: string
            description: string
          }
          shifting_operation: {
            title: string
            description: string
          }
          clutch_operation: {
            title: string
            description: string
          }
          leaks: {
            title: string
            description: string
          }
        }
      }
      scheduled_maintenance: {
        title: string
        description: string
        items: {
          oil_change: {
            title: string
            description: string
          }
          filter_replacement: {
            title: string
            description: string
          }
          fluid_levels: {
            title: string
            description: string
          }
        }
      }
      wear_items: {
        title: string
        description: string
        items: {
          brake_pads: {
            title: string
            description: string
          }
          tire_rotation: {
            title: string
            description: string
          }
          belt_condition: {
            title: string
            description: string
          }
        }
      }
      diagnostics: {
        title: string
        description: string
        items: {
          computer_scan: {
            title: string
            description: string
          }
          sensor_check: {
            title: string
            description: string
          }
          emissions_test: {
            title: string
            description: string
          }
        }
      }
      brake_safety: {
        title: string
        description: string
        items: {
          emergency_brake: {
            title: string
            description: string
          }
          brake_lines: {
            title: string
            description: string
          }
          abs_system: {
            title: string
            description: string
          }
        }
      }
      restraint_systems: {
        title: string
        description: string
        items: {
          seatbelt_condition: {
            title: string
            description: string
          }
          airbag_indicators: {
            title: string
            description: string
          }
          child_locks: {
            title: string
            description: string
          }
        }
      }
      visibility: {
        title: string
        description: string
        items: {
          windshield_condition: {
            title: string
            description: string
          }
          mirror_condition: {
            title: string
            description: string
          }
          window_operation: {
            title: string
            description: string
          }
        }
      }
    }
    templates: {
      routine: {
        title: string
        description: string
      }
      safety: {
        title: string
        description: string
      }
      maintenance: {
        title: string
        description: string
      }
    }
    categories: {
      steering_system: {
        name: string
        description: string
      }
      brake_system: {
        name: string
        description: string
      }
      suspension_system: {
        name: string
        description: string
      }
      lighting_system: {
        name: string
        description: string
      }
      tire_system: {
        name: string
        description: string
      }
      engine_system: {
        name: string
        description: string
      }
      transmission_system: {
        name: string
        description: string
      }
      electrical_system: {
        name: string
        description: string
      }
      safety_equipment: {
        name: string
        description: string
      }
    }
    actions: {
      pass: string
      fail: string
      complete: string
      markComplete: string
      markInProgress: string
      startInspection: string
      cancel: string
      edit: string
      delete: string
      addPhoto: string
      addNotes: string
      resume: string
      scheduleRepair: string
      needsRepair: string
      scheduleRepairDescription: string
    }
    details: {
      title: string
      description: string
      inspectionProgress: string
      inspectionDetails: string
      vehicleDetails: string
      inspectionItems: string
      noItems: string
      scheduledFor: string
      printTitle: string
      vehicleInfo: {
        title: string
        plateNumber: string
        brand: string
        model: string
        year: string
        vin: string
        noImage: string
      }
      photos: {
        title: string
        noPhotos: string
        viewOriginal: string
        downloadPhoto: string
        deletePhoto: string
        confirmDelete: string
        addMore: string
      }
      status: {
        title: string
        completed: string
        in_progress: string
        scheduled: string
        cancelled: string
      }
      inspector: {
        title: string
        assigned: string
        contact: string
        phone: string
        email: string
      }
      results: {
        title: string
        summary: string
        passCount: string
        failCount: string
        pendingCount: string
        photoCount: string
        notesCount: string
        completionRate: string
        lastUpdated: string
        allPassed: string
        noFailedItems: string
        failedItemsFound: string
        failedItemsDescription: string
      }
      sections: {
        title: string
        noSections: string
        viewAll: string
        collapse: string
        expand: string
      }
      actions: {
        edit: string
        delete: string
        print: string
        export: string
        share: string
      }
      tabs: {
        details: string
        failed: string
        passed: string
      }
    }
    fields: {
      vehicle: string
      vehicleDescription: string
      vehiclePlaceholder: string
      date: string
      dateDescription: string
      datePlaceholder: string
      type: string
      typeDescription: string
      status: string
      statusDescription: string
      notes: string
      notesPlaceholder: string
      notesDescription: string
      generalNotesPlaceholder: string
      photoRequired: string
      photo: string
      photos: string
      photoDescription: string
      inspector: string
      inspectorDescription: string
    }
    messages: {
      error: string
      createSuccess: string
      updateSuccess: string
      selectVehicle: string
      loginRequired: string
      tryAgain: string
      photoAdded: string
      photoUploadError: string
      printStarted: string
      exportSuccess: string
      exportError: string
    }
    schedule: {
      title: string
      description: string
      selectDate: string
      datePlaceholder: string
      cancel: string
      button: string
      details: string
      backToInspections: string
    }
  }
  fuel: {
    title: string
    description: string
    new: {
      title: string
      description: string
    }
    edit: {
      title: string
      description: string
    }
    fields: {
      date: string
      odometer_reading: string
      fuel_amount: string
      fuel_cost: string
      fuel_type: string
      station_name: string
      full_tank: string
      notes: string
    }
    messages: {
      created: string
      updated: string
      deleted: string
      error: string
    }
  }
  mileage: {
    title: string
    description: string
    new: {
      title: string
      description: string
    }
    edit: {
      title: string
      description: string
    }
    fields: {
      date: string
      start_odometer: string
      end_odometer: string
      distance: string
      purpose: string
      notes: string
    }
    messages: {
      created: string
      updated: string
      deleted: string
      error: string
    }
  }
  reporting: {
    title: string
    description: string
    filters: {
      vehicleType: string
      status: string
      apply: string
      reset: string
    }
    export: {
      title: string
      pdf: string
      excel: string
    }
    fromPreviousPeriod: string
    sections: {
      overview: string
      analytics: string
      reports: {
        title: string
        maintenance: string
        maintenanceDescription: string
        fuel: string
        fuelDescription: string
        cost: string
        costDescription: string
        downloadCSV: string
        downloadPDF: string
        customReport: string
        customReportDescription: string
        recentReports: string
        createCustomReport: string
        generateReport: string
        reportName: string
        reportType: string
        includeData: string
        vehicleInformation: string
        maintenanceData: string
        fuelData: string
        costAnalysis: string
        cancel: string
      }
      fleetOverview: {
        title: string
        totalVehicles: string
        activeVehicles: string
        inMaintenance: string
        inactive: string
      }
      maintenanceMetrics: {
        title: string
        totalTasks: string
        completedTasks: string
        averageCompletionTime: string
        upcomingTasks: string
        tasksByPriority: string
        tasksByStatus: string
        costOverTime: string
        totalCost: string
        scheduledCost: string
        unscheduledCost: string
      }
      inspectionMetrics: {
        title: string
        totalInspections: string
        passRate: string
        failRate: string
        commonFailures: string
        inspectionsByStatus: string
      }
      vehicleUtilization: {
        title: string
        maintenanceCostPerVehicle: string
        inspectionPassRateByVehicle: string
        vehicleStatus: string
      }
      vehiclePerformance: {
        title: string
        description: string
        vehicle: string
        utilization: string
        distance: string
        fuelUsed: string
        efficiency: string
        costPerKm: string
        noData: string
        search: string
        filterByBrand: string
        allBrands: string
        noVehiclesFound: string
        scheduled: string
        unscheduled: string
        consumption: string
        maintenance: string
        fuel: string
      }
      costPerKm: {
        title: string
        description: string
      }
      fuelConsumption: {
        title: string
        description: string
        noData: string
      }
      monthlyMileage: {
        title: string
        description: string
        noData: string
      }
      maintenanceFrequency: {
        title: string
        description: string
      }
      vehicleAvailability: {
        title: string
        description: string
      }
      maintenanceCosts: {
        title: string
        range: string
        count: string
        total: string
        average: string
      }
    }
    noData: string
  }
}

export type Translations = TranslationValues 