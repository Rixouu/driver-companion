import { TranslationValue } from "../types"

export const en: TranslationValue = {
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
    next: "Next",
    search: "Search",
    filter: "Filter",
    all: "All",
    noResults: "No results found",
    details: "Details",
    actions: "Actions",
    viewDetails: "View details",
    addNew: "Add new",
    backTo: "Back to",
    backToList: "Back to list",
    saving: "Saving...",
    update: "Update",
    create: "Create",
    created: "Created",
    deleting: "Deleting...",
    menu: "Menu",
    login: "Login",
    logout: "Logout",
    darkMode: "Dark mode",
    inProgress: "In progress",
    upcoming: "Upcoming",
    recent: "Recent",
    total: "Total",
    type: "Type",
    saveChanges: "Save changes",
    confirmDelete: "Confirm deletion",
    untitled: "Untitled",
    grid: "Grid",
    list: "List",
    submitting: "Submitting...",
    notAssigned: "Not assigned",
    noImage: "No image",
    minutes: "Minutes",
    call: "Call",
    text: "Text",
    line: "LINE",
    exporting: "Exporting..."
  },
  auth: {
    logout: "Logout"
  },
  navigation: {
    dashboard: "Dashboard",
    vehicles: "Vehicles",
    drivers: "Drivers",
    bookings: "Bookings",
    maintenance: "Maintenance",
    inspections: "Inspections",
    settings: "Settings",
    reporting: "Reporting",
    dispatch: "Dispatch Board"
  },
  drivers: {
    title: "Drivers",
    description: "Manage your drivers information",
    search: "Search drivers...",
    filters: {
      status: "Status",
      all: "All Drivers",
      searchPlaceholder: "Search drivers...",
      brand: "Filter by Status",
      model: "Filter by Type",
      allBrands: "All Statuses",
      allModels: "All Types",
      noResults: "No results found",
      clearFilters: "Clear Filters"
    },
    actions: {
      addDriver: "Add Driver",
      editDriver: "Edit Driver",
      updateDriver: "Update Driver",
      viewDetails: "View Details",
      deleteDriver: "Delete Driver",
      assignVehicle: "Assign Vehicle",
      assignVehicleTo: "Assign Vehicle to {name}",
      assignMultipleVehicles: "Assign {count} Vehicles",
      unassignVehicle: "Unassign Vehicle",
      unassignMultipleVehicles: "Unassign {count} Vehicles",
      manageVehiclesFor: "Manage Vehicles for {name}",
    },
    fields: {
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      phone: "Phone Number",
      lineId: "LINE ID",
      licenseNumber: "License Number",
      licenseExpiry: "License Expiry",
      expires: "Expires",
      status: "Status",
      address: "Address",
      emergencyContact: "Emergency Contact",
      notes: "Notes"
    },
    placeholders: {
      firstName: "Enter first name",
      lastName: "Enter last name",
      email: "Enter email address",
      phone: "Enter phone number",
      lineId: "Enter LINE ID",
      licenseNumber: "Enter license number",
      licenseExpiry: "Select expiry date",
      address: "Enter address",
      emergencyContact: "Enter emergency contact",
      notes: "Enter additional notes"
    },
    status: {
      active: "Active",
      inactive: "Inactive",
      on_leave: "On Leave",
      available: "Available",
      unavailable: "Unavailable",
      leave: "On Leave",
      training: "Training"
    },
    driverDetails: "Driver Details",
    editDriver: {
      description: "Update driver information"
    },
    newDriver: {
      description: "Enter information for the new driver"
    },
    unassignVehicle: {
      selectedVehicles: "Selected vehicles to unassign",
      noVehicles: "No assigned vehicles",
      noVehiclesDescription: "This driver doesn't have any vehicles assigned yet.",
      confirm: "Unassign vehicle?",
      confirmMultiple: "Unassign {count} vehicles?",
      confirmDescription: "This will unassign the selected vehicle(s) from this driver. This action can be undone later if needed.",
    },
    assignVehicle: {
      description: "Choose one or more vehicles to assign to this driver.",
      selectedVehicles: "Selected vehicles"
    },
    manageVehicles: {
      description: "Assign new vehicles or unassign existing ones from this driver."
    },
    empty: {
      title: "No Drivers Found",
      description: "No drivers have been added yet. Add a new driver to get started.",
      searchResults: "No drivers match your search criteria. Try modifying your search."
    },
    activity: {
      empty: {
        title: "No Activity Found",
        description: "This driver has no recorded activity yet."
      },
      title: "Driver Activity"
    },
    activityHistory: {
      title: "Activity History",
      description: "View all activities for this driver",
      empty: {
        title: "No History Found",
        description: "There is no activity history for this driver."
      }
    },
    recentActivity: {
      title: "Recent Activity",
      description: "Latest activities for this driver",
      empty: {
        title: "No Recent Activity",
        description: "This driver has no recent activity."
      }
    },
    upcomingBookings: {
      title: "Upcoming Bookings",
      description: "Scheduled bookings for this driver",
      empty: {
        title: "No Upcoming Bookings",
        description: "This driver has no upcoming bookings scheduled.",
        message: "No upcoming bookings"
      },
      booking: "Booking"
    },
    messages: {
      createSuccess: "Driver created successfully",
      createSuccessDescription: "The driver has been created and is now available in the system.",
      updateSuccess: "Driver updated successfully",
      updateSuccessDescription: "The driver details have been updated.",
      deleteSuccess: "Driver deleted successfully",
      createError: "Error creating driver",
      createErrorDescription: "There was a problem creating the driver. Please try again.",
      updateError: "Error updating driver",
      updateErrorDescription: "There was a problem updating the driver details. Please try again.",
      deleteError: "Error deleting driver",
      loadError: "Error loading driver",
      loadErrorDescription: "Could not load driver details. Please try again.",
      assignSuccess: "Vehicle assigned successfully",
      assignSuccessDescription: "The vehicle has been assigned to this driver.",
      multipleAssignSuccessDescription: "{count} vehicles have been assigned to this driver.",
      assignError: "Error assigning vehicle",
      assignErrorDescription: "There was a problem assigning the vehicle. Please try again.",
      unassignSuccess: "Vehicle unassigned successfully",
      unassignSuccessDescription: "The vehicle has been unassigned from this driver.",
      multipleUnassignSuccessDescription: "{count} vehicles have been unassigned from this driver.",
      unassignError: "Error unassigning vehicle",
      unassignErrorDescription: "There was a problem unassigning the vehicle. Please try again.",
      noVehicleSelected: "No vehicle selected",
      noVehicleSelectedDescription: "Please select a vehicle to assign to this driver.",
      noVehicleSelectedToUnassign: "Please select a vehicle to unassign from this driver."
    },
    assignedVehicles: {
      title: "Assigned Vehicles",
      description: "Vehicles assigned to this driver",
      count: "{count} vehicles",
      noVehicles: "No vehicles assigned"
    },
    notFound: {
      title: "Driver Not Found",
      description: "The specified driver does not exist or has been deleted"
    },
    tabs: {
      overview: "Overview",
      activity: "Activity",
      inspections: "Inspections",
      availability: "Availability",
      assignVehicles: "Assign New",
      unassignVehicles: "Unassign Existing"
    },
    inspections: {
      title: "Driver Inspections",
      description: "View inspection history for this driver",
      noInspections: "No inspections found",
      viewInspection: "View Inspection",
      empty: {
        title: "No Inspections Found",
        description: "This driver has no inspection records yet."
      },
      inspectionDate: "Inspection Date",
      inspectionType: "Inspection Type",
      status: "Status"
    },
    since: "Driver since {date}",
    availability: {
      title: "Driver Availability",
      description: "Manage availability periods for this driver. Set when they are available, on leave, or in training.",
      setStatus: "Set Status",
      statusLabel: "Availability Status",
      selectStatus: "Select status",
      addAvailability: "Add Availability Period",
      editAvailability: "Edit Availability Period",
      deleteAvailability: "Delete Availability Period",
      calendarView: "Calendar View",
      listView: {
        title: "List View",
        noRecords: "No availability records found. Click the button above to add one.",
        loading: "Loading...",
        addAvailability: "Add Availability",
        editAvailability: "Edit Availability",
        deleteConfirmTitle: "Are you sure?",
        deleteConfirmMessage: "This action cannot be undone. This will permanently delete the availability record.",
        deleteSuccess: "Availability deleted",
        deleteSuccessMessage: "Driver availability has been deleted successfully",
        deleteError: "Failed to delete driver availability",
        loadError: "Failed to load driver availability"
      },
      noAvailabilityRecords: "No availability records",
      availabilityRecords: "Availability Records",
      calendar: "Availability Calendar",
      dateRange: "Date Range",
      startDate: "Start Date",
      endDate: "End Date",
      status: "Status",
      currentStatus: "Current Status",
      notes: "Notes",
      actions: "Actions",
      notesPlaceholder: "Add any comments about this availability period",
      statusActive: "Active",
      statusInactive: "Inactive",
      statusMessage: "This driver is currently {status} until {date}, and cannot be assigned to bookings.",
      availableMessage: "This driver is currently available for booking assignments.",
      upcomingSchedule: "Upcoming Schedule",
      returnsFromLeave: "Returns from leave",
      viewFullSchedule: "View Full Schedule",
      statuses: {
        available: "Available",
        unavailable: "Unavailable", 
        leave: "On Leave",
        training: "Training"
      },
      messages: {
        createSuccess: "Availability period created successfully",
        updateSuccess: "Availability period updated successfully",
        deleteSuccess: "Availability period deleted successfully",
        createError: "Failed to create availability period",
        updateError: "Failed to update availability period",
        deleteError: "Failed to delete availability period"
      }
    },
    vehicles: {
      title: "Assigned Vehicles",
      description: "Vehicles assigned to this driver",
      noVehicles: "No vehicles assigned to this driver"
    },
    pagination: {
      showing: "Showing {start}-{end} of {total} vehicles",
      page: "Page {page}",
      of: "of {total}"
    }
  },
  vehicles: {
    title: "Vehicles",
    description: "Manage your vehicle fleet",
    addVehicle: "Add Vehicle",
    newVehicle: "New Vehicle",
    editVehicle: "Edit Vehicle",
    searchPlaceholder: "Search vehicles...",
    noVehicles: "No vehicles found",
    filters: {
      search: "Search vehicles",
      searchPlaceholder: "Search by name or plate number",
      brand: "Filter by brand",
      model: "Filter by model",
      allBrands: "All brands",
      allModels: "All models",
      noResults: "No vehicles matched your search",
      clearFilters: "Clear filters"
    },
    pagination: {
      showing: "Showing {start}-{end} of {total} vehicles",
      loadMore: "Load more",
      page: "Page {page}",
      of: "of {total}"
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
      uploadImageSizeLimit: "Maximum file size: 5MB",
      type: "Vehicle Type"
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
      noInspections: "No inspections scheduled"
    },
    history: {
      title: "Vehicle History",
      maintenanceTitle: "Completed Maintenance",
      inspectionTitle: "Completed Inspections",
      noRecords: "No history records found",
      noMaintenanceRecords: "No completed maintenance records",
      noInspectionRecords: "No completed inspection records",
      inspection: "Inspection",
      maintenance: "Maintenance"
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
      noInspections: "No inspections in progress"
    },
    allVehicles: "All Vehicles",
    status: {
      active: "Active",
      inactive: "Inactive",
      maintenance: "In Maintenance"
    }
  },
  maintenance: {
    title: "Maintenance",
    description: "Manage maintenance tasks for your vehicles",
    addTask: "Add Task",
    newTask: "New Maintenance Task",
    editTask: "Edit Maintenance Task",
    searchPlaceholder: "Search maintenance tasks...",
    noTasks: "No maintenance tasks found",
    noTasksTitle: "No maintenance tasks",
    createImmediateTask: "Create immediate task",
    createImmediateTaskDescription: "Create a task immediately in addition to the recurring schedule",
    recurringTask: "Recurring Task",
    oneTime: "One-time Task",
    isRecurring: "Make this a recurring maintenance",
    isRecurringDescription: "Schedule this maintenance to repeat at regular intervals",
    form: {
      description: "Create a new maintenance task by filling out the form below",
      basicInfo: "Basic Info",
      scheduleInfo: "Schedule",
      additionalDetails: "Details",
      stepOneTitle: "Enter Basic Information",
      stepOneDescription: "Start by selecting a template (optional) and entering the basic task information.",
      stepTwoTitle: "Set Schedule",
      stepTwoDescription: "Define how often this task should repeat and when it should start.",
      stepThreeTitle: "Add Additional Details",
      stepThreeDescription: "Provide any additional details about this maintenance task."
    },
    schedule: {
      title: "Schedule Maintenance",
      details: "Schedule a new maintenance task",
      description: "Create a maintenance task for your vehicle",
      button: "Schedule",
      id: "Schedule ID"
    },
    createDirect: "Create Task",
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
    templates: {
      selectTemplate: "Select a Task Template",
      searchPlaceholder: "Search templates...",
      noResults: "No templates found",
      createCustomTask: "Create Custom Task",
      useTemplate: "Use Template",
      manualEntry: "Manual Entry",
      templateInfo: "Quick Task Creation",
      templateInfoDescription: "Select a predefined task template to quickly fill in common maintenance tasks with standard durations and costs.",
      templateApplied: "Template Applied",
      templateAppliedDescription: "The template has been applied. You can now customize the task details if needed."
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
      dueDatePlaceholder: "Pick a date"
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
      taskStarted: "Maintenance task started",
      error: "An error occurred",
      immediateTaskError: "Error creating immediate task",
      nextTaskCreated: "Next recurring task created",
      nextTaskScheduled: "Next task scheduled for {date}"
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
    description: "Manage vehicle inspections",
    addInspection: "Add Inspection",
    newInspection: "New Inspection",
    editInspection: "Edit Inspection",
    searchPlaceholder: "Search inspections...",
    noInspections: "No inspections found",
    createInspection: "Create Inspection",
    defaultType: "Routine",
    steps: {
      selectVehicle: "Select Vehicle",
      selectType: "Select Inspection Type"
    },
    labels: {
      progress: "Inspection Progress",
      estimatedTime: "Est. time remaining",
      model: "Model",
      photoNumber: "Photo {{number}}",
      currentSection: "Current Section"
    },
    actions: {
      pass: "Pass",
      fail: "Fail",
      complete: "Complete Inspection",
      markComplete: "Mark as Complete",
      markInProgress: "Start Inspection",
      startInspection: "Start Inspection",
      cancel: "Cancel Inspection",
      edit: "Edit Inspection",
      delete: "Delete Inspection",
      addPhoto: "Add Photo",
      addNotes: "Add Notes",
      resume: "Resume Inspection",
      scheduleRepair: "Schedule Repair",
      needsRepair: "Repairs Needed",
      scheduleRepairDescription: "Schedule maintenance tasks for the failed items to keep your vehicle in optimal condition.",
      takePhoto: "Take Photo",
      photos: "Photos ({{count}})",
      previousSection: "Previous Section",
      nextSection: "Next Section",
      completeInspection: "Complete Inspection"
    },
    status: {
      scheduled: "Scheduled",
      in_progress: "In Progress",
      pending: "Pending",
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
      }
    },
    templates: {
      title: "Inspection Template Management",
      manageTitle: "Manage {type} Template",
      managerDescription: "Configure and customize your {type} inspection templates. Add sections and items to streamline your inspection process.",
      loadError: "Failed to load {type} template data.",
      noSections: "No sections defined for this template yet.",
      addSection: "Add Section",
      newSectionTitle: "Add New Section",
      newSectionDescription: "Enter the details for the new inspection section.",
      sectionNameLabel: "Section Name",
      sectionNamePlaceholder: "e.g., Engine System",
      sectionNamePlaceholderJa: "e.g., Engine System",
      sectionDescriptionLabel: "Description (Optional)",
      sectionDescriptionPlaceholder: "Brief description of the section",
      sectionDescriptionPlaceholderJa: "Brief description of the section",
      addSectionSuccess: "Section added successfully",
      addSectionError: "Failed to add section",
      deleteSectionConfirm: "Are you sure you want to delete the section \"{name}\"? This will also delete all items within it.",
      deleteSectionSuccess: "Section deleted successfully",
      deleteSectionError: "Failed to delete section",
      addItem: "Add Item",
      newItemTitle: "Add New Item to {sectionName}",
      newItemDescription: "Enter the details for the new inspection item.",
      itemNameLabel: "Item Name",
      itemNamePlaceholder: "e.g., Check Oil Level",
      itemNamePlaceholderJa: "e.g., Check Oil Level",
      itemDescriptionLabel: "Item Description (Optional)",
      itemDescriptionPlaceholder: "Details about what to check",
      itemDescriptionPlaceholderJa: "Details about what to check",
      requiresPhoto: "Requires Photo",
      requiresNotes: "Requires Notes",
      addItemSuccess: "Item added successfully",
      addItemError: "Failed to add item",
      deleteItemConfirm: "Are you sure you want to delete the item \"{name}\"?",
      deleteItemSuccess: "Item deleted successfully",
      deleteItemError: "Failed to delete item",
      updateSuccess: "Template updated successfully",
      updateError: "Failed to update template",
      editSectionTitle: "Edit Section",
      editSectionDescription: "Update the section details below.",
      editItemTitle: "Edit Item",
      editItemDescription: "Update the item details below.",
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
    details: {
      title: "Inspection Details",
      description: "View inspection details and results",
      inspectionProgress: "Inspection Progress",
      inspectionDetails: "Inspection Details",
      vehicleDetails: "Vehicle Details",
      inspectionItems: "Inspection Items",
      noItems: "No inspection items added",
      scheduledFor: "Scheduled for {date}",
      printTitle: "Inspection Report",
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
        share: "Share Results",
        exportResult: "Export Result"
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
      printStarted: "Print dialog opened",
      exportSuccess: "Inspection exported successfully",
      exportError: "Error exporting inspection"
    },
    schedule: {
      title: "Schedule Inspection",
      description: "Schedule a new inspection by selecting a vehicle and date",
      selectDate: "Select Inspection Date",
      datePlaceholder: "Select date",
      cancel: "Cancel",
      button: "Schedule Inspection",
      details: "Inspection Details",
      backToInspections: "Back to inspections"
    },
    selectTemplate: "Select template type",
    inspectionTypes: {
      routine: "Routine Inspection",
      safety: "Safety Inspection",
      maintenance: "Maintenance Inspection",
      select: "Select Inspection Type",
      description: {
        routine: "Regular periodic inspection of vehicle components",
        safety: "Comprehensive safety system evaluation",
        maintenance: "Detailed mechanical system inspection"
      }
    },
    tabs: {
      list: "List",
      stats: "Stats"
    },
    groupBy: "Group By",
    groupByOptions: {
      none: "None",
      date: "Date",
      vehicle: "Vehicle"
    },
    gro: "Date",
    noGrouping: "No Grouping",
    allVehicles: "All Vehicles",
    resultsCount: "{count} results",
    noVehicle: "No Vehicle Assigned",
    selectVehiclePrompt: "Select a vehicle to view inspections",
    dateGroup: {
      today: "Today",
      yesterday: "Yesterday",
      thisWeek: "This Week",
      thisMonth: "This Month",
      upcoming: "Upcoming",
      older: "Older",
      unknown: "Unknown Date"
    },
    stats: {
      totalInspections: "Total Inspections",
      completed: "Completed",
      scheduled: "Scheduled",
      byVehicle: "Inspections by Vehicle",
      byType: "Inspections by Type",
      count: "{count} Inspection(s)",
      vehicleCount: "{count} Vehicle(s)"
    }
  },
  dashboard: {
    title: "Dashboard",
    description: "Overview of your vehicle fleet",
    quickActions: {
      title: "Quick Actions",
      description: "Common tasks and actions",
      addVehicle: "Add Vehicle",
      scheduleMaintenance: "Schedule Maintenance",
      scheduleInspection: "Create Inspection",
      viewReports: "View Reports"
    },
    activityFeed: {
      title: "Activity Feed",
      description: "Recent and upcoming activities",
      noUpcoming: "No upcoming activities",
      noRecent: "No recent activities",
      viewAll: "View all"
    },
    dailyChecklist: {
      title: "Daily Checklist",
      description: "Tasks to complete today",
      completeChecklist: "Complete Checklist",
      checkAllItems: "Check all items to complete",
      upcomingReminders: "Upcoming Reminders",
      completed: {
        title: "Checklist Completed!",
        message: "Great job! You've completed all your daily checks. See you tomorrow!",
        reset: "Reset Checklist"
      },
      items: {
        checkTires: "Check tire pressure and condition",
        checkLights: "Verify all lights are functioning",
        checkFluids: "Check oil and coolant levels",
        checkBrakes: "Test brakes and parking brake",
        visualInspection: "Perform visual inspection"
      }
    },
    upcomingBookings: {
      title: "Upcoming Bookings",
      description: "Bookings pending review and assignment",
      viewAll: "View All Bookings",
      empty: {
        title: "No Upcoming Bookings",
        description: "There are no bookings pending review or assignment.",
        message: "No upcoming bookings"
      }
    },
    vehicleStats: {
      title: "Vehicle Overview",
      description: "Quick stats about your vehicles",
      fuelLevel: "Fuel Level",
      mileage: "Mileage",
      viewAllVehicles: "View all vehicles"
    },
    maintenance: {
      title: "Maintenance",
      description: "Upcoming and recent maintenance tasks"
    },
    inspections: {
      title: "Inspections",
      description: "Upcoming and recent inspections"
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
        noPending: "No pending maintenance tasks"
      },
      inspectionSchedule: {
        title: "Inspection Schedule",
        noPending: "No pending inspections"
      },
      recentMaintenance: {
        title: "Recent Maintenance",
        noCompleted: "No completed maintenance tasks"
      },
      recentInspections: {
        title: "Recent Inspections",
        noCompleted: "No completed inspections"
      }
    }
  },
  fuel: {
    title: "Fuel Logs",
    description: "Track your vehicle's fuel consumption and expenses.",
    new: {
      title: "Add Fuel Log",
      description: "Record a new fuel fill-up for your vehicle."
    },
    edit: {
      title: "Edit Fuel Log",
      description: "Update the details of your fuel log."
    },
    fields: {
      date: "Date",
      odometer_reading: "Odometer Reading",
      fuel_amount: "Fuel Amount (Liters)",
      fuel_cost: "Fuel Cost",
      fuel_type: "Fuel Type",
      station_name: "Station Name",
      full_tank: "Full Tank",
      notes: "Notes"
    },
    messages: {
      created: "Fuel log created successfully",
      updated: "Fuel log updated successfully",
      deleted: "Fuel log deleted successfully",
      error: "Something went wrong"
    },
    noData: "No fuel log data available"
  },
  mileage: {
    title: "Mileage Logs",
    description: "Track your vehicle's mileage and trips.",
    new: {
      title: "Add Mileage Log",
      description: "Record a new trip for your vehicle."
    },
    edit: {
      title: "Edit Mileage Log",
      description: "Update the details of your mileage log."
    },
    fields: {
      date: "Date",
      start_odometer: "Start Odometer",
      end_odometer: "End Odometer",
      distance: "Distance",
      purpose: "Purpose",
      notes: "Notes"
    },
    messages: {
      created: "Mileage log created successfully",
      updated: "Mileage log updated successfully",
      deleted: "Mileage log deleted successfully",
      error: "Something went wrong"
    }
  },
  reporting: {
    title: "Reports & Analytics",
    description: "View detailed reports and analytics for your vehicle fleet.",
    filters: {
      vehicleType: "Vehicle Type",
      status: "Status",
      apply: "Apply Filters",
      reset: "Reset"
    },
    export: {
      title: "Export",
      pdf: "Export as PDF",
      excel: "Export as Excel"
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
        inactive: "Inactive"
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
        inspectionsByStatus: "Inspections by Status"
      },
      vehicleUtilization: {
        title: "Vehicle Utilization",
        maintenanceCostPerVehicle: "Maintenance Cost per Vehicle",
        inspectionPassRateByVehicle: "Inspection Pass Rate by Vehicle",
        vehicleStatus: "Vehicle Status Distribution"
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
    noData: "No data available for the selected filters"
  },
  bookings: {
    title: "Bookings",
    description: "Manage booking information",
    search: {
      text: "Search bookings...",
      placeholder: "Search bookings..."
    },
    addBooking: "Add Booking",
    newBooking: "New Booking",
    editBooking: "Edit Booking",
    viewOptions: {
      grid: "Grid View",
      list: "List View"
    },
    actions: {
      sync: "Sync Bookings",
      refresh: "Refresh"
    },
    tableHeaders: {
      bookingId: "Booking ID",
      dateTime: "Date & Time",
      service: "Service",
      customer: "Customer",
      locations: "Locations",
      status: "Status",
      actions: "Actions"
    },
    labels: {
      from: "From",
      to: "To",
      bookingId: "Booking ID",
      at: "at",
      km: "km",
      min: "min"
    },
    status: {
      publish: "Published",
      pending: "Pending",
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled"
    },
    filters: {
      statusPlaceholder: "Filter by status",
      all: "All",
      pending: "Pending",
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
      advancedFilters: "Advanced Filters",
      clearFilters: "Clear Filters"
    },
    upcomingBookings: {
      title: "Upcoming Bookings",
      description: "Bookings pending review and assignments",
      empty: {
        title: "No Upcoming Bookings",
        description: "There are no bookings pending review or assignment."
      }
    },
    empty: {
      title: "No Bookings Found",
      description: "There are no bookings in the system yet."
    },
    unnamed: "Unnamed Customer",
    viewAll: "View All Bookings",
    assignment: {
      title: "Driver & Vehicle Assignment",
      summary: "Assign a driver and vehicle to this booking",
      bookingDetails: "Booking Details",
      confirmAssignment: "Confirm Assignment",
      driver: "Driver",
      vehicle: "Vehicle",
      selectDriver: "Select driver",
      selectVehicle: "Select vehicle",
      driverDetails: "Driver Details",
      vehicleDetails: "Vehicle Details",
      noDriversAvailable: "No drivers available for this booking time",
      noVehiclesAvailable: "No vehicles available",
      assignSuccess: "Assignment completed successfully",
      assignFailed: "Failed to complete assignment"
    },
    details: {
      title: "Booking Details",
      notFound: "Booking Not Found",
      notFoundDescription: "The booking you're looking for could not be found.",
      backToBookings: "Back to Bookings",
      createdOn: "Created on: {date}",
      lastUpdated: "Last updated: {date}",
      bookingNumber: "Booking Number #{id}",
      sections: {
        summary: "Booking Summary",
        vehicle: "Vehicle Information",
        route: "Route Information",
        client: "Client Details",
        additional: "Additional Information",
        payment: "Payment Link",
        assignment: "Driver & Vehicle Assignment"
      },
      fields: {
        bookingId: "Booking ID",
        orderTotal: "Order Total",
        pickupDate: "Pickup Date",
        paymentMethod: "Payment Method",
        pickupTime: "Pickup Time",
        paymentStatus: "Payment Status",
        vehicle: "Vehicle",
        capacity: "Capacity",
        vehicleId: "Vehicle ID",
        serviceType: "Service Type",
        pickupLocation: "Pickup Location",
        dropoffLocation: "Dropoff Location",
        distance: "Distance",
        duration: "Duration",
        flightNumber: "Flight Number",
        terminal: "Terminal",
        comment: "Comment",
        email: "Email",
        phone: "Phone",
        status: "Status",
        paymentLink: "Payment Link",
        amount: "Amount"
      },
      actions: {
        navigateToPickup: "Navigate to Pickup",
        navigateToDropoff: "Navigate to Dropoff",
        viewLargerMap: "View Larger Map",
        contactCustomer: "Contact Customer",
        call: "Call",
        sendMessage: "Send Message",
        openPaymentLink: "Open Payment Link",
        edit: "Edit",
        reschedule: "Reschedule",
        cancel: "Cancel",
        print: "Print",
        viewInvoice: "View Invoice",
        changeStatus: "Change Status",
        addToCalendar: "Add to Google Calendar",
        printDetails: "Print Details",
        copyClipboard: "Copy to Clipboard",
        tripChecklist: "Trip Checklist",
        sendArrivalNotification: "Send Arrival Notification",
        shareWhatsApp: "Share via WhatsApp",
        shareLine: "Share via LINE",
        shareEmail: "Share via Email",
        exportPdf: "Export PDF"
      },
      driverActions: {
        title: "Driver Actions",
        tripManagement: "Trip Management",
        shareBooking: "Share Booking"
      },
      bookingActions: {
        title: "Booking Actions",
        addToGoogleCalendar: "Add to Google Calendar",
        managementActions: "Management Actions",
        editBooking: "Edit Booking",
        rescheduleBooking: "Reschedule Booking",
        dangerZone: "DANGER ZONE",
        cancelBooking: "Cancel Booking"
      },
      weather: {
        title: "Weather Forecast for Departure Date",
        notAvailable: "Weather forecast not available",
        errorMessage: "Failed to fetch weather forecast",
        disclaimer: "* Weather data powered by WeatherAPI.com",
        forecastUnavailable: "No forecast available for {date}"
      },
      placeholders: {
        noRouteInfo: "No route information available",
        noPaymentLink: "No payment link available",
        notProvided: "Not provided",
        noComments: "No comments"
      },
      customerSince: "Customer since {date}",
      status: {
        confirmed: "Confirmed",
        pending: "Pending",
        cancelled: "Cancelled",
        completed: "Completed"
      }
    },
    edit: {
      title: "Edit Booking #{id}",
      description: "Update information for this booking",
      backToDetails: "Back to Details",
      saveChanges: "Save Changes",
      saving: "Saving...",
      success: "Success",
      error: "Error",
      successMessage: "Booking was updated successfully",
      errorMessage: "An error occurred while updating the booking"
    },
    messages: {
      createSuccess: "Booking created successfully",
      updateSuccess: "Booking updated successfully",
      deleteSuccess: "Booking deleted successfully",
      syncSuccess: "Bookings synced successfully",
      error: "An error occurred"
    },
    sync: {
      title: "Sync Bookings",
      description: "Synchronize bookings from external systems",
      connectionIssue: "There may be connection issues with the external booking system.",
      success: "Bookings synchronized successfully",
      failed: "Sync failed",
      syncing: "Synchronizing...",
      syncButton: "Sync Bookings",
      retrying: "Retrying...",
      retryButton: "Retry Connection",
      successWithCount: "Successfully synced {count} bookings ({created} created, {updated} updated)"
    }
  },
  dispatch: {
    title: "Dispatch Board",
    description: "Manage driver and vehicle assignments for bookings",
    search: "Search dispatch entries...",
    filters: {
      status: "Status",
      date: "Date",
      driver: "Driver",
      vehicle: "Vehicle",
      all: "All Entries"
    },
    actions: {
      assignDriver: "Assign Driver",
      assignVehicle: "Assign Vehicle",
      updateStatus: "Update Status",
      addNote: "Add Note",
      viewDetails: "View Details",
      createEntry: "Create Entry",
      editEntry: "Edit Entry",
      deleteEntry: "Delete Entry",
      assignDriverTo: "Assign Driver to Booking #{id}",
      assignVehicleTo: "Assign Vehicle to Booking #{id}"
    },
    status: {
      pending: "Pending",
      assigned: "Assigned",
      in_transit: "In Transit",
      completed: "Completed",
      cancelled: "Cancelled"
    },
    fields: {
      booking: "Booking",
      driver: "Driver",
      vehicle: "Vehicle",
      status: "Status",
      startTime: "Start Time",
      endTime: "End Time",
      duration: "Duration",
      notes: "Notes",
      createdAt: "Created At",
      updatedAt: "Updated At"
    },
    placeholders: {
      selectDriver: "Select a driver",
      selectVehicle: "Select a vehicle",
      selectStatus: "Select a status",
      enterNotes: "Enter notes about this dispatch",
      startTime: "Select start time",
      endTime: "Select end time"
    },
    messages: {
      createSuccess: "Dispatch entry created successfully",
      updateSuccess: "Dispatch entry updated successfully",
      deleteSuccess: "Dispatch entry deleted successfully",
      createError: "Error creating dispatch entry",
      updateError: "Error updating dispatch entry",
      deleteError: "Error deleting dispatch entry",
      driverAssigned: "Driver assigned successfully",
      vehicleAssigned: "Vehicle assigned successfully",
      statusUpdated: "Status updated successfully",
      notesAdded: "Notes added successfully"
    },
    empty: {
      title: "No Dispatch Entries Found",
      description: "There are no dispatch entries for the selected filters.",
      searchResults: "No dispatch entries match your search criteria. Try modifying your search."
    },
    calendar: {
      view: "Calendar View",
      title: "Dispatch Calendar",
      today: "Today",
      month: "Month",
      week: "Week",
      day: "Day",
      list: "List"
    },
    board: {
      view: "Board View",
      title: "Dispatch Board",
      pending: "Pending",
      assigned: "Assigned",
      inTransit: "In Transit",
      completed: "Completed",
      cancelled: "Cancelled",
      addEntry: "Add Entry"
    },
    details: {
      title: "Dispatch Details",
      bookingDetails: "Booking Details",
      driverDetails: "Driver Details",
      vehicleDetails: "Vehicle Details",
      statusHistory: "Status History",
      notes: "Dispatch Notes"
    },
    timelineView: {
      title: "Dispatch Timeline",
      scale: "Scale",
      hour: "Hour",
      day: "Day",
      week: "Week",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out"
    }
  },
  schedules: {
    title: "Schedule",
    createSchedule: "Create Schedule",
    frequency: "Frequency",
    selectFrequency: "Select Frequency",
    frequencyDescription: "How often this task should be performed",
    intervalDays: "Interval (Days)",
    intervalDaysPlaceholder: "Enter number of days",
    intervalDaysDescription: "Number of days between each occurrence",
    startDate: "Start Date",
    startDateDescription: "When to start generating tasks",
    endDate: "End Date (Optional)",
    endDatePlaceholder: "No end date",
    endDateDescription: "When to stop generating tasks",
    selectDate: "Select Date"
  }
} as const

export default en 