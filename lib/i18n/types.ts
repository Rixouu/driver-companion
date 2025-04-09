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
  next: string
  search: string
  filter: string
  all: string
  noResults: string
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
  menu: string
  login: string
  logout: string
  darkMode: string
  inProgress: string
  upcoming: string
  recent: string
  total: string
  type: string
  saveChanges?: string
  confirmDelete?: string
  untitled?: string
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
  activityFeed: {
    title: string
    description: string
    noUpcoming: string
    noRecent: string
    viewAll: string
  }
  dailyChecklist: {
    title: string
    description: string
    completeChecklist: string
    checkAllItems: string
    upcomingReminders: string
    completed: {
      title: string
      message: string
      reset: string
    }
    items: {
      checkTires: string
      checkLights: string
      checkFluids: string
      checkBrakes: string
      visualInspection: string
    }
  }
  vehicleStats: {
    title: string
    description: string
    fuelLevel: string
    mileage: string
    viewAllVehicles: string
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
  auth: {
    login: string
    logout: string
    email: string
    password: string
    forgotPassword: string
    resetPassword: string
    register: string
    loginSuccess: string
    loginError: string
    logoutSuccess: string
  }
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
  notifications: {
    title: string
    empty: string
    toggle: string
    delete: string
    deleteSuccess: string
    deleteError: string
    markAllAsRead: string
    markAsRead: string
    markAsReadSuccess: string
    markAsReadError: string
    upcoming: string
    today: string
    thisWeek: string
    newNotifications: string
    clickToView: string
    unread: string
  }
  schedules: {
    title: string
    createSchedule: string
    frequency: string
    selectFrequency: string
    frequencyDescription: string
    intervalDays: string
    intervalDaysPlaceholder: string
    intervalDaysDescription: string
    startDate: string
    startDateDescription: string
    endDate: string
    endDatePlaceholder: string
    endDateDescription: string
    selectDate: string
    frequencies: {
      daily: string
      weekly: string
      biweekly: string
      monthly: string
      quarterly: string
      biannually: string
      annually: string
      custom: string
    }
    maintenance: {
      title: string
      description: string
      createSuccess: string
      createError: string
      updateSuccess: string
      updateError: string
      deleteSuccess: string
      deleteError: string
    }
    inspection: {
      title: string
      description: string
      createSuccess: string
      createError: string
      updateSuccess: string
      updateError: string
      deleteSuccess: string
      deleteError: string
    }
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
    menu: {
      title: string
      description: string
      menuItem: string
      desktop: string
      mobile: string
      desktopSettingsHidden: string
      alwaysVisible: string
    }
    templates?: {
      title: string
      description: string
    }
    tabs?: {
      profile: string
      preferences: string
      menu: string
      templates: string
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
    createImmediateTask: string
    createImmediateTaskDescription: string
    recurringTask: string
    oneTime: string
    isRecurring: string
    isRecurringDescription: string
    schedule: {
      title: string
      details: string
      description: string
      button: string
      id: string
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
    templates: {
      selectTemplate: string
      searchPlaceholder: string
      noResults: string
      createCustomTask: string
      useTemplate: string
      manualEntry: string
      templateInfo: string
      templateInfoDescription: string
      templateApplied: string
      templateAppliedDescription: string
    }
    form: {
      description: string
      basicInfo: string
      scheduleInfo: string
      additionalDetails: string
      stepOneTitle: string
      stepOneDescription: string
      stepTwoTitle: string
      stepTwoDescription: string
      stepThreeTitle: string
      stepThreeDescription: string
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
      immediateTaskError: string
      nextTaskCreated: string
      nextTaskScheduled: string
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
    createInspection: string
    defaultType: string
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
      [key: string]: {
        title: string
        description: string
        items: {
          [key: string]: {
            title: string
            description: string
          }
        }
      }
    }
    templates: {
      title?: string
      manageTitle: string
      loadError: string
      noSections: string
      updateSuccess: string
      updateError: string
      addSection: string
      newSectionTitle: string
      newSectionDescription: string
      sectionNameLabel: string
      sectionNamePlaceholder: string
      sectionDescriptionLabel: string
      sectionDescriptionPlaceholder: string
      addSectionSuccess: string
      addSectionError: string
      deleteSectionConfirm: string
      deleteSectionSuccess: string
      deleteSectionError: string
      routine?: {
        title: string
        description: string
      }
      safety?: {
        title: string
        description: string
      }
      maintenance?: {
        title: string
        description: string
      }
      addItem: string
      newItemTitle: string
      newItemDescription: string
      itemNameLabel: string
      itemNamePlaceholder: string
      itemDescriptionLabel: string
      itemDescriptionPlaceholder: string
      requiresPhoto: string
      requiresNotes: string
      addItemSuccess: string
      addItemError: string
      deleteItemConfirm: string
      deleteItemSuccess: string
      deleteItemError: string
    }
    categories: {
      [key: string]: {
        name: string
        description: string
      }
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
    noData: string
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