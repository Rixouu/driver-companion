import type { Translations } from '../types'

export const en: Translations = {
  common: {
    status: {
      inProgress: "In Progress",
      upcoming: "Upcoming",
      recent: "Recent",
      active: "Active",
      inactive: "Inactive",
      completed: "Completed",
      scheduled: "Scheduled",
      type: "Type"
    },
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    back: "Back",
    search: "Search",
    filter: "Filter",
    all: "All",
    noResults: "No results found",
    details: "Details",
    actions: "Actions",
    viewDetails: "View Details",
    addNew: "Add New",
    backTo: "Back to List",
    saving: "Saving...",
    update: "Update",
    create: "Create",
    deleting: "Deleting...",
    menu: "Menu",
    login: "Login",
    logout: "Logout",
    inProgress: "In Progress",
    upcoming: "Upcoming",
    recent: "Recent",
    total: "Total"
  },
  navigation: {
    dashboard: "Dashboard",
    vehicles: "Vehicles",
    maintenance: "Maintenance",
    inspections: "Inspections",
    reporting: "Reporting",
    settings: "Settings",
  },
  settings: {
    title: "Settings",
    description: "Manage your account settings and preferences",
    profile: {
      title: "Profile",
      description: "Manage your account settings",
      name: "Name",
      email: "Email",
      emailDescription: "Your email address is used for notifications and sign-in"
    },
    preferences: {
      title: "Preferences",
      description: "Customize your application experience",
      theme: {
        title: "Theme",
        light: "Light",
        dark: "Dark",
        system: "System"
      },
      language: {
        title: "Language",
        en: "English",
        ja: "Japanese"
      }
    }
  },
  vehicles: {
    title: "Vehicles",
    description: "Manage your fleet of vehicles",
    addVehicle: "Add Vehicle",
    newVehicle: "New Vehicle",
    editVehicle: "Edit Vehicle",
    details: "Vehicle Details",
    searchPlaceholder: "Search vehicles...",
    noVehicles: "No vehicles found",
    status: {
      active: "Active",
      maintenance: "Maintenance",
      inactive: "Inactive"
    },
    fields: {
      name: "Vehicle Name",
      nameDescription: "A friendly name to identify this vehicle",
      namePlaceholder: "e.g., Family SUV",
      plateNumber: "License Plate",
      brand: "Brand",
      brandDescription: "The manufacturer of the vehicle",
      brandPlaceholder: "e.g., Toyota",
      model: "Model",
      modelPlaceholder: "e.g., Camry",
      year: "Year",
      yearPlaceholder: "e.g., 2024",
      vin: "VIN",
      vinDescription: "17-character vehicle identification number",
      status: "Status",
      statusDescription: "Current operational status of the vehicle",
      image: "Vehicle Image",
      imageDescription: "PNG, JPG or WEBP (MAX. 800x400px)",
      modelDescription: "The model name of the vehicle",
      yearDescription: "The manufacturing year",
      plateNumberDescription: "Vehicle registration number",
      plateNumberPlaceholder: "e.g., ABC-1234",
      statusPlaceholder: "Select vehicle status",
      statusActive: "Active",
      statusInactive: "Inactive",
      statusMaintenance: "In Maintenance",
      uploadImage: "Upload Image",
      formCompletion: "Form Completion",
      formCompletionDescription: "Progress of required fields",
      vinPlaceholder: "Enter 17-character VIN",
      uploadImageButton: "Upload Image",
      uploadImageDragText: "Drag and drop an image here, or click to select",
      uploadImageSizeLimit: "Maximum file size: 5MB"
    },
    placeholders: {
      name: "Enter vehicle name",
      plateNumber: "Enter license plate number",
      brand: "Enter vehicle brand",
      model: "Enter vehicle model",
      year: "Enter manufacturing year",
      vin: "Enter vehicle identification number"
    },
    form: {
      basicInfo: "Basic Information",
      additionalInfo: "Additional Information"
    },
    tabs: {
      info: "Information",
      schedule: "Scheduled",
      inProgress: "In Progress",
      history: "History",
      costs: "Costs",
      reminders: "Reminders",
      scheduleEmpty: "No scheduled tasks",
      historyEmpty: "No history available",
      costsEmpty: "No cost records",
      remindersEmpty: "No reminders set",
      upcomingMaintenance: "Upcoming Maintenance",
      scheduledInspections: "Scheduled Inspections",
      addMaintenanceTask: "Add Task",
      scheduleInspection: "Schedule Inspection",
      maintenanceHistory: "Maintenance History",
      inspectionHistory: "Inspection History",
      completedOn: "Completed on {date}",
      totalCosts: "Total Costs",
      maintenanceCosts: "Maintenance Costs",
      fuelCosts: "Fuel Costs",
      otherCosts: "Other Costs",
      addReminder: "Add Reminder",
      noReminders: "No reminders set for this vehicle"
    },
    messages: {
      createSuccess: "Vehicle created successfully",
      updateSuccess: "Vehicle updated successfully",
      deleteSuccess: "Vehicle deleted successfully",
      error: "An error occurred",
      deleteError: "Cannot delete vehicle",
      hasAssociatedRecords: "This vehicle has associated inspections or maintenance tasks and cannot be deleted",
      imageUploadError: "Failed to upload image"
    },
    addNewTitle: "Add New Vehicle",
    addNewDescription: "Add a new vehicle to the fleet",
    vehicleInformation: "Vehicle Information",
    vehicleDetails: "Vehicle Details",
    vehicleStatus: "Vehicle Status",
    edit: {
      title: "Edit Vehicle",
      description: "Update vehicle information"
    },
    delete: {
      title: "Delete Vehicle",
      description: "This action cannot be undone. This will permanently delete the vehicle and remove it from our servers."
    },
    schedule: {
      title: "Upcoming Tasks",
      maintenanceTitle: "Scheduled Maintenance",
      inspectionsTitle: "Scheduled Inspections",
      noUpcoming: "No upcoming tasks scheduled",
      noMaintenanceTasks: "No maintenance tasks scheduled",
      noInspections: "No inspections scheduled",
    },
    history: {
      title: "Vehicle History",
      maintenanceTitle: "Completed Maintenance",
      inspectionTitle: "Completed Inspections",
      noRecords: "No history records found",
      noMaintenanceRecords: "No completed maintenance records",
      noInspectionRecords: "No completed inspection records",
      inspection: "Inspection",
      maintenance: "Maintenance",
    },
    deleteDialog: {
      title: "Delete Vehicle",
      description: "This action cannot be undone. This will permanently delete the vehicle and remove it from our servers."
    },
    inProgress: {
      title: "In Progress Tasks",
      maintenanceTitle: "Maintenance In Progress",
      inspectionsTitle: "Inspections In Progress",
      noTasks: "No tasks in progress",
      noMaintenanceTasks: "No maintenance tasks in progress",
      noInspections: "No inspections in progress",
    },
  },
  maintenance: {
    title: "Maintenance",
    description: "Schedule and track vehicle maintenance",
    addTask: "Add Maintenance",
    newTask: "New Maintenance Task",
    editTask: "Edit Maintenance Task",
    searchPlaceholder: "Search maintenance tasks...",
    noTasks: "No maintenance tasks found",
    schedule: {
      title: "Schedule Maintenance",
      details: "Maintenance Task Details",
      description: "Schedule a new maintenance task",
      button: "Schedule Maintenance"
    },
    createDirect: "Create Directly",
    status: {
      pending: "Pending",
      scheduled: "Scheduled",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled"
    },
    priority: {
      title: "Priority",
      high: "High",
      medium: "Medium",
      low: "Low"
    },
    fields: {
      title: "Task Title",
      titlePlaceholder: "e.g., Oil Change",
      titleDescription: "A clear name for the maintenance task",
      description: "Description",
      descriptionPlaceholder: "e.g., Regular oil change and filter replacement",
      descriptionDescription: "Detailed description of the maintenance task",
      vehicle: "Vehicle",
      vehicleDescription: "Select the vehicle for this maintenance task",
      dueDate: "Due Date",
      dueDateDescription: "When this task should be completed",
      priority: "Priority",
      priorityDescription: "Task priority level",
      status: "Status",
      statusDescription: "Current status of the task",
      estimatedDuration: "Estimated Duration (hours)",
      estimatedDurationPlaceholder: "e.g., 2",
      estimatedDurationDescription: "Expected time to complete the task in hours",
      cost: "Estimated Cost",
      costDescription: "Expected cost of the maintenance",
      estimatedCost: "Estimated Cost",
      estimatedCostPlaceholder: "e.g., 150.00",
      estimatedCostDescription: "Expected cost for this maintenance task",
      selectVehicle: "Select Vehicle",
      selectVehiclePlaceholder: "Choose a vehicle",
      notes: "Additional Notes",
      notesPlaceholder: "Enter any additional notes or requirements",
      notesDescription: "Any extra information about the maintenance task",
      dueDatePlaceholder: "Pick a date",
    },
    details: {
      taskDetails: "Task Details",
      vehicleDetails: "Vehicle Details",
      vehicleInfo: {
        noImage: "No image available"
      },
      scheduledFor: "Due {date}",
      estimatedCompletion: "Estimated completion: {duration} hours",
      estimatedCost: "Estimated cost: ${cost}",
      assignedVehicle: "Assigned Vehicle",
      taskHistory: "Task History",
      noHistory: "No history available",
      taskProgress: "Task Progress",
      hours: "hours",
      overdueDays: "{days} days overdue",
      daysUntilDue: "{days} days until due",
      recommendations: "Maintenance Recommendations",
      recommendationItems: {
        checkRelated: "Check Related Systems",
        checkRelatedDesc: "Consider inspecting related vehicle systems during this maintenance task.",
        trackCosts: "Track Maintenance Costs",
        trackCostsDesc: "Keep records of all costs associated with this maintenance for future reference."
      },
      progressStatus: {
        completed: "This task has been completed.",
        inProgress: "This task is currently in progress.",
        scheduled: "This task is scheduled and pending.",
        overdue: "This task is overdue and requires attention."
      }
    },
    messages: {
      createSuccess: "Maintenance task created successfully",
      updateSuccess: "Maintenance task updated successfully",
      deleteSuccess: "Maintenance task deleted successfully",
      taskStarted: "Maintenance task started successfully",
      error: "Failed to save maintenance task"
    },
    actions: {
      markComplete: "Mark as Complete",
      markInProgress: "Mark In Progress",
      startTask: "Start Task",
      cancel: "Cancel Task",
      edit: "Edit Task",
      delete: "Delete Task"
    }
  },
  inspections: {
    title: "Inspections",
    description: "Schedule and track vehicle inspections",
    addInspection: "Add Inspection",
    newInspection: "New Inspection",
    editInspection: "Edit Inspection",
    searchPlaceholder: "Search inspections...",
    noInspections: "No inspections found",
    createDirect: "Create Directly",
    defaultType: "Standard Inspection",
    status: {
      scheduled: "Scheduled",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled"
    },
    type: {
      select: "Select Inspection Type",
      routine: "Routine Inspection",
      safety: "Safety Inspection",
      maintenance: "Maintenance Inspection",
      description: {
        routine: "Complete vehicle system check",
        safety: "Critical safety systems inspection",
        maintenance: "Scheduled maintenance inspection"
      }
    },
    sections: {
      steering_system: {
        title: "Steering System",
        description: "Steering components and operation inspection",
        items: {
          steering_wheel: {
            title: "Steering Wheel",
            description: "Check for play, alignment, and smooth operation"
          },
          power_steering: {
            title: "Power Steering",
            description: "Inspect fluid level, leaks, and operation"
          },
          steering_column: {
            title: "Steering Column",
            description: "Inspect for proper movement and security"
          }
        }
      },
      brake_system: {
        title: "Brake System",
        description: "Brake system inspection",
        items: {
          brake_pedal: {
            title: "Brake Pedal",
            description: "Check brake pedal height, free play, and operation"
          },
          brake_discs: {
            title: "Brake Discs",
            description: "Inspect brake discs for wear, scoring, and thickness"
          },
          brake_fluid: {
            title: "Brake Fluid",
            description: "Check brake fluid level and condition in master cylinder"
          }
        }
      },
      safety_equipment: {
        title: "Safety Equipment",
        description: "Vehicle safety systems inspection",
        items: {
          seatbelt_operation: {
            title: "Seatbelt Operation",
            description: "Check all seatbelts for proper operation and condition"
          },
          airbag_system: {
            title: "Airbag System",
            description: "Verify airbag warning lights and system status"
          },
          wiper_operation: {
            title: "Wiper Operation",
            description: "Check windshield wiper function and washer fluid operation"
          }
        }
      },
      electrical: {
        title: "Electrical System",
        description: "Vehicle electrical systems inspection",
        items: {
          battery_condition: {
            title: "Battery Condition",
            description: "Test battery voltage and check terminals"
          },
          alternator_output: {
            title: "Alternator Output",
            description: "Verify charging system operation"
          },
          starter_operation: {
            title: "Starter Operation",
            description: "Check starter motor function and engagement"
          }
        }
      },
      suspension: {
        title: "Suspension System",
        description: "Inspection of suspension components and operation",
        items: {
          shock_absorbers: {
            title: "Shock Absorbers",
            description: "Check for leaks, damage, and proper operation"
          },
          springs: {
            title: "Springs",
            description: "Inspect for cracks, breaks, and proper height"
          },
          bushings: {
            title: "Bushings",
            description: "Check for wear, deterioration, and alignment"
          },
          ball_joints: {
            title: "Ball Joints",
            description: "Test for play and wear in joints"
          }
        }
      },
      lighting: {
        title: "Lighting System",
        description: "Vehicle lighting system inspection",
        items: {
          headlights: {
            title: "Headlights",
            description: "Check high and low beam operation, aim, and brightness"
          },
          taillights: {
            title: "Tail Lights",
            description: "Check brake lights, running lights, and reverse lights operation"
          },
          turn_indicators: {
            title: "Turn Indicators",
            description: "Verify turn signals and hazard lights operation"
          }
        }
      },
      tires: {
        title: "Tire System",
        description: "Tire and wheel inspection",
        items: {
          tread_depth: {
            title: "Tread Depth",
            description: "Measure and check tire tread depth"
          },
          tire_pressure: {
            title: "Tire Pressure",
            description: "Check and adjust air pressure"
          },
          tire_condition: {
            title: "Tire Condition",
            description: "Inspect for cuts, bulges, and wear patterns"
          },
          wheel_alignment: {
            title: "Wheel Alignment",
            description: "Check tire alignment and balance"
          },
          wear_pattern: {
            title: "Wear Pattern",
            description: "Inspect tire wear patterns for alignment or balance issues"
          }
        }
      },
      engine: {
        title: "Engine System",
        description: "Engine and related components inspection",
        items: {
          oil_level: {
            title: "Oil Level",
            description: "Check engine oil level and condition"
          },
          coolant_level: {
            title: "Coolant Level",
            description: "Check coolant level and condition in reservoir"
          },
          belts: {
            title: "Belts",
            description: "Check all belt conditions and tension"
          },
          drive_belts: {
            title: "Drive Belts",
            description: "Inspect condition and tension of all drive belts"
          },
          hoses: {
            title: "Hoses",
            description: "Inspect all hoses for leaks and wear"
          },
          fluid_leaks: {
            title: "Fluid Leaks",
            description: "Check for any oil, coolant, or other fluid leaks"
          }
        }
      },
      transmission: {
        title: "Transmission System",
        description: "Transmission and drivetrain inspection",
        items: {
          transmission_fluid: {
            title: "Transmission Fluid",
            description: "Check fluid level, color, and condition"
          },
          shifting_operation: {
            title: "Shifting Operation",
            description: "Test smooth operation of all gear shifts"
          },
          clutch_operation: {
            title: "Clutch Operation",
            description: "Verify clutch engagement and release"
          },
          leaks: {
            title: "Leaks",
            description: "Inspect for transmission fluid leaks"
          }
        }
      },
      scheduled_maintenance: {
        title: "Scheduled Maintenance",
        description: "Regular maintenance service items",
        items: {
          oil_change: {
            title: "Oil Change",
            description: "Change engine oil and filter according to schedule"
          },
          filter_replacement: {
            title: "Filter Replacement",
            description: "Replace air, fuel, and cabin filters as needed"
          },
          fluid_levels: {
            title: "Fluid Levels",
            description: "Check and top up all vehicle fluids to proper levels"
          }
        }
      },
      wear_items: {
        title: "Wear Items",
        description: "Inspection of components subject to normal wear",
        items: {
          brake_pads: {
            title: "Brake Pads",
            description: "Measure brake pad thickness and wear patterns"
          },
          tire_rotation: {
            title: "Tire Rotation",
            description: "Rotate tires to ensure even wear and optimal performance"
          },
          belt_condition: {
            title: "Belt Condition",
            description: "Inspect all drive belts for wear, tension, and alignment"
          }
        }
      },
      diagnostics: {
        title: "Diagnostics",
        description: "Electronic systems diagnostic testing",
        items: {
          computer_scan: {
            title: "Computer Scan",
            description: "Perform electronic diagnostic scan for error codes"
          },
          sensor_check: {
            title: "Sensor Check",
            description: "Verify operation of all vehicle sensors and modules"
          },
          emissions_test: {
            title: "Emissions Test",
            description: "Check exhaust emissions and system performance"
          }
        }
      },
      brake_safety: {
        title: "Brake Safety",
        description: "Advanced brake system safety inspection",
        items: {
          emergency_brake: {
            title: "Emergency Brake",
            description: "Check parking brake operation and holding ability"
          },
          brake_lines: {
            title: "Brake Lines",
            description: "Inspect brake lines and hoses for leaks or damage"
          },
          abs_system: {
            title: "ABS System",
            description: "Verify anti-lock brake system operation and warning lights"
          }
        }
      },
      restraint_systems: {
        title: "Restraint Systems",
        description: "Vehicle occupant safety systems inspection",
        items: {
          seatbelt_condition: {
            title: "Seatbelt Condition",
            description: "Inspect seatbelt webbing, buckles, and retractors"
          },
          airbag_indicators: {
            title: "Airbag Indicators",
            description: "Check airbag warning lights and system indicators"
          },
          child_locks: {
            title: "Child Locks",
            description: "Test rear door child safety locks operation"
          }
        }
      },
      visibility: {
        title: "Visibility",
        description: "Vehicle visibility and glass inspection",
        items: {
          windshield_condition: {
            title: "Windshield Condition",
            description: "Check for cracks, chips, and visibility obstructions"
          },
          mirror_condition: {
            title: "Mirror Condition",
            description: "Inspect all mirrors for clarity and proper adjustment"
          },
          window_operation: {
            title: "Window Operation",
            description: "Test all power windows for smooth operation"
          }
        }
      },
    },
    templates: {
      routine: {
        title: "Routine Vehicle Inspection",
        description: "Comprehensive inspection of all vehicle systems"
      },
      safety: {
        title: "Safety Systems Inspection",
        description: "Critical safety components check"
      },
      maintenance: {
        title: "Maintenance Inspection",
        description: "Scheduled maintenance verification"
      }
    },
    categories: {
      steering_system: {
        name: "Steering System",
        description: "Steering system inspection"
      },
      brake_system: {
        name: "Brake System",
        description: "Brake system inspection"
      },
      suspension_system: {
        name: "Suspension System",
        description: "Suspension system inspection"
      },
      lighting_system: {
        name: "Lighting System",
        description: "Vehicle lighting inspection"
      },
      tire_system: {
        name: "Tire System",
        description: "Tire inspection"
      },
      engine_system: {
        name: "Engine System",
        description: "Engine inspection"
      },
      transmission_system: {
        name: "Transmission System",
        description: "Transmission inspection"
      },
      electrical_system: {
        name: "Electrical System",
        description: "Electrical system inspection"
      },
      safety_equipment: {
        name: "Safety Equipment",
        description: "Safety equipment inspection"
      }
    },
    actions: {
      pass: "Pass",
      fail: "Fail",
      complete: "Complete Inspection",
      markComplete: "Mark as Complete",
      markInProgress: "Start Inspection",
      cancel: "Cancel Inspection",
      edit: "Edit Inspection",
      delete: "Delete Inspection",
      addPhoto: "Add Photo",
      addNotes: "Add Notes",
      resume: "Resume Inspection",
      scheduleRepair: "Schedule Repair",
      needsRepair: "Repairs Needed",
      scheduleRepairDescription: "Schedule maintenance tasks for the failed items to keep your vehicle in optimal condition."
    },
    details: {
      title: "Inspection Details",
      description: "View inspection details and results",
      inspectionProgress: "Inspection Progress",
      inspectionDetails: "Inspection Details",
      vehicleDetails: "Vehicle Details",
      inspectionItems: "Inspection Items",
      noItems: "No inspection items added",
      scheduledFor: "Scheduled for {date}",
      vehicleInfo: {
        title: "Vehicle Information",
        plateNumber: "License Plate",
        brand: "Brand",
        model: "Model",
        year: "Year",
        vin: "VIN",
        noImage: "No image available"
      },
      photos: {
        title: "Inspection Photos",
        noPhotos: "No photos added",
        viewOriginal: "View Original",
        downloadPhoto: "Download Photo",
        deletePhoto: "Delete Photo",
        confirmDelete: "Are you sure you want to delete this photo?",
        addMore: "Add More Photos"
      },
      status: {
        title: "Status",
        completed: "Completed on {date}",
        in_progress: "Started on {date}",
        scheduled: "Scheduled for {date}",
        cancelled: "Cancelled on {date}"
      },
      inspector: {
        title: "Inspector",
        assigned: "Assigned to {name}",
        contact: "Contact Information",
        phone: "Phone",
        email: "Email"
      },
      results: {
        title: "Inspection Results",
        summary: "Summary",
        passCount: "{count} items passed",
        failCount: "{count} items failed",
        pendingCount: "{count} items pending",
        photoCount: "{count} photos taken",
        notesCount: "{count} notes added",
        completionRate: "Completion Rate",
        lastUpdated: "Last Updated",
        allPassed: "All Items Passed",
        noFailedItems: "No failed items found in this inspection. All items have passed successfully.",
        failedItemsFound: "{count} failed items found",
        failedItemsDescription: "The following items have failed inspection and may require attention or repair."
      },
      sections: {
        title: "Inspection Sections",
        noSections: "No sections found",
        viewAll: "View All Sections",
        collapse: "Collapse All",
        expand: "Expand All"
      },
      actions: {
        edit: "Edit Inspection",
        delete: "Delete Inspection",
        print: "Print Report",
        export: "Export Results",
        share: "Share Results"
      },
      tabs: {
        details: "Inspection Details",
        failed: "Failed Items",
        passed: "Passed Items"
      }
    },
    fields: {
      vehicle: "Vehicle",
      vehicleDescription: "Select a vehicle to inspect",
      vehiclePlaceholder: "Select a vehicle",
      date: "Inspection Date",
      dateDescription: "When the inspection should be performed",
      datePlaceholder: "Select a date",
      type: "Inspection Type",
      typeDescription: "Type of inspection to perform",
      status: "Status",
      statusDescription: "Current status of the inspection",
      notes: "Notes",
      notesPlaceholder: "Add notes about this item...",
      notesDescription: "Additional notes about the inspection",
      generalNotesPlaceholder: "Add general notes about this inspection...",
      photoRequired: "Photo Required",
      photo: "Photo",
      photos: "Photos",
      photoDescription: "Photo evidence of inspection",
      inspector: "Inspector",
      inspectorDescription: "Person performing the inspection"
    },
    messages: {
      error: "Error",
      createSuccess: "Inspection created successfully",
      updateSuccess: "Inspection updated successfully",
      selectVehicle: "Please select a vehicle",
      loginRequired: "You must be logged in to create an inspection",
      tryAgain: "Please try again",
      photoAdded: "Photo added",
      photoUploadError: "Failed to upload photo. Please try again.",
    },
    schedule: {
      title: "Schedule Inspection",
      description: "Schedule a new inspection for {vehicle}",
      selectDate: "Select Date",
      datePlaceholder: "Pick a date",
      cancel: "Cancel",
      button: "Schedule Inspection",
      details: "Schedule Details"
    },
  },
  dashboard: {
    title: "Dashboard",
    description: "Monitor your fleet's performance and activities",
    quickActions: {
      title: "Quick Actions",
      description: "Common tasks and actions",
      addVehicle: "Add Vehicle",
      scheduleMaintenance: "Schedule Maintenance",
      scheduleInspection: "Schedule Inspection",
      viewReports: "View Reports"
    },
    maintenance: {
      title: "Maintenance",
      description: "Overview of maintenance tasks"
    },
    inspections: {
      title: "Inspections",
      description: "Overview of vehicle inspections"
    },
    stats: {
      totalVehicles: "Total Vehicles",
      maintenanceTasks: "Maintenance Tasks",
      inspections: "Inspections",
      activeVehicles: "Active Vehicles"
    },
    sections: {
      maintenanceSchedule: {
        title: "Maintenance Schedule",
        noPending: "No pending maintenance"
      },
      inspectionSchedule: {
        title: "Inspection Schedule",
        noPending: "No pending inspections"
      },
      recentMaintenance: {
        title: "Recent Maintenance",
        noCompleted: "No completed maintenance"
      },
      recentInspections: {
        title: "Recent Inspections",
        noCompleted: "No completed inspections"
      }
      }
    },
    labels: {
      due: "Due {date}",
      priority: {
        high: "High",
        medium: "Medium",
        low: "Low"
      },
      status: {
      scheduled: "Scheduled",
      inProgress: "In Progress"
    }
  },
  fuel: {
    title: "Fuel Logs",
    description: "Track your vehicle's fuel consumption and expenses.",
    new: {
      title: "Add Fuel Log",
      description: "Record a new fuel fill-up for your vehicle.",
    },
    edit: {
      title: "Edit Fuel Log",
      description: "Update the details of your fuel log.",
    },
    fields: {
      date: "Date",
      odometer_reading: "Odometer Reading",
      fuel_amount: "Fuel Amount (Liters)",
      fuel_cost: "Fuel Cost",
      fuel_type: "Fuel Type",
      station_name: "Station Name",
      full_tank: "Full Tank",
      notes: "Notes",
    },
    messages: {
      created: "Fuel log created successfully",
      updated: "Fuel log updated successfully",
      deleted: "Fuel log deleted successfully",
      error: "Something went wrong",
    },
  },
  mileage: {
    title: "Mileage Logs",
    description: "Track your vehicle's mileage and trips.",
    new: {
      title: "Add Mileage Log",
      description: "Record a new trip for your vehicle.",
    },
    edit: {
      title: "Edit Mileage Log",
      description: "Update the details of your mileage log.",
    },
    fields: {
      date: "Date",
      start_odometer: "Start Odometer",
      end_odometer: "End Odometer",
      distance: "Distance",
      purpose: "Purpose",
      notes: "Notes",
    },
    messages: {
      created: "Mileage log created successfully",
      updated: "Mileage log updated successfully",
      deleted: "Mileage log deleted successfully",
      error: "Something went wrong",
    },
  },
  reporting: {
    title: "Reports & Analytics",
    description: "View detailed reports and analytics for your vehicle fleet.",
    filters: {
      vehicleType: "Vehicle Type",
      status: "Status",
      apply: "Apply Filters",
      reset: "Reset",
    },
    export: {
      title: "Export",
      pdf: "Export as PDF",
      excel: "Export as Excel",
    },
    fromPreviousPeriod: "from previous period",
    sections: {
      overview: "Overview",
      analytics: "Analytics",
      reports: {
        title: "Reports",
        maintenance: "Maintenance History Report",
        maintenanceDescription: "Detailed maintenance records for each vehicle",
        fuel: "Fuel Efficiency Report",
        fuelDescription: "Fuel consumption and efficiency analysis",
        cost: "Cost Analysis Report",
        costDescription: "Detailed breakdown of all vehicle-related costs",
        downloadCSV: "Download CSV",
        downloadPDF: "Download PDF",
        customReport: "Custom Report",
        customReportDescription: "Combine data from multiple sources into a single report",
        recentReports: "Recent Reports",
        createCustomReport: "Create Custom Report",
        generateReport: "Generate Report",
        reportName: "Report Name",
        reportType: "Report Type",
        includeData: "Include Data",
        vehicleInformation: "Vehicle Information",
        maintenanceData: "Maintenance Data",
        fuelData: "Fuel Data",
        costAnalysis: "Cost Analysis",
        cancel: "Cancel"
      },
      fleetOverview: {
        title: "Fleet Overview",
        totalVehicles: "Total Vehicles",
        activeVehicles: "Active Vehicles",
        inMaintenance: "In Maintenance",
        inactive: "Inactive",
      },
      maintenanceMetrics: {
        title: "Maintenance Metrics",
        totalTasks: "Total Tasks",
        completedTasks: "Completed Tasks",
        averageCompletionTime: "Average Completion Time (Days)",
        upcomingTasks: "Upcoming Tasks",
        tasksByPriority: "Tasks by Priority",
        tasksByStatus: "Tasks by Status",
        costOverTime: "Maintenance Cost Over Time",
        totalCost: "Total Maintenance Cost",
        scheduledCost: "Scheduled Maintenance",
        unscheduledCost: "Unscheduled Maintenance"
      },
      inspectionMetrics: {
        title: "Inspection Metrics",
        totalInspections: "Total Inspections",
        passRate: "Pass Rate",
        failRate: "Fail Rate",
        commonFailures: "Common Failures",
        inspectionsByStatus: "Inspections by Status",
      },
      vehicleUtilization: {
        title: "Vehicle Utilization",
        maintenanceCostPerVehicle: "Maintenance Cost per Vehicle",
        inspectionPassRateByVehicle: "Inspection Pass Rate by Vehicle",
        vehicleStatus: "Vehicle Status Distribution",
      },
      vehiclePerformance: {
        title: "Vehicle Performance",
        description: "Performance metrics for each vehicle",
        vehicle: "Vehicle",
        utilization: "Utilization",
        distance: "Distance (km)",
        fuelUsed: "Fuel Used (L)",
        efficiency: "Efficiency (km/L)",
        costPerKm: "Cost/km",
        noData: "No performance data available for the selected period",
        search: "Search vehicles...",
        filterByBrand: "Filter by brand",
        allBrands: "All Brands",
        noVehiclesFound: "No vehicles found matching your criteria",
        scheduled: "Scheduled",
        unscheduled: "Unscheduled",
        consumption: "Consumption",
        maintenance: "Maintenance",
        fuel: "Fuel"
      },
      costPerKm: {
        title: "Cost Per Kilometer",
        description: "Maintenance and fuel costs per kilometer by vehicle"
      },
      fuelConsumption: {
        title: "Fuel Consumption Trend",
        description: "Monthly fuel consumption by vehicle type",
        noData: "No fuel consumption data available for the selected period"
      },
      monthlyMileage: {
        title: "Monthly Mileage Trend",
        description: "Monthly distance traveled by vehicle type",
        noData: "No mileage data available for the selected period"
      },
      maintenanceFrequency: {
        title: "Maintenance Frequency",
        description: "Frequency of scheduled vs unscheduled maintenance"
      },
      vehicleAvailability: {
        title: "Vehicle Availability",
        description: "Vehicle uptime and maintenance periods"
      },
      maintenanceCosts: {
        title: "Maintenance Cost Distribution",
        range: "Cost Range",
        count: "Tasks",
        total: "Total Cost",
        average: "Average Cost"
      }
    },
    noData: "No data available for the selected filters",
  },
} as const 

export default en 