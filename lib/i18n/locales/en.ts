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
    previous: "Previous",
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
    notAssigned: "Not Assigned",
    noImage: "No image",
    minutes: "Minutes",
    call: "Call",
    text: "TEXT",
    line: "LINE",
    exporting: "Exporting...",
    email: "Email",
    send: "Send Email",
    sending: "Sending...",
    selected: "Selected",
    current: "Current",
    updated: "Updated",
    day: "Day",
    week: "Week",
    month: "Month",
    today: "Today",
    booking: "Booking",
    unassign: "Unassign",
    cannotBeUndone: "This action cannot be undone.",
    updateAndSend: "Update & Send",
    processing: "Processing...",
    copy: "Copy",
    dateFormat: {
      short: "MM/DD/YYYY",
      medium: "MMM D, YYYY",
      long: "MMMM D, YYYY",
      monthYear: "MMMM YYYY"
    },
    formHasErrors: "Please fix the errors in the form before submitting",
    exportPDF: "Export PDF",
    exportCSV: "Export CSV",
    notAvailable: "N/A"
  },
  auth: {
    logout: "Logout"
  },
  navigation: {
    dashboard: "Dashboard",
    vehicles: "Vehicles",
    drivers: "Drivers",
    bookings: "Bookings",
    quotations: "Quotations",
    pricing: "Pricing",
    dispatch: "Dispatch",
    maintenance: "Maintenance",
    inspections: "Inspections",
    reporting: "Reporting",
    settings: "Settings",
    fleet: "Fleet",
    sales: "Sales",
    operations: "Operations",
    logout: "Logout"
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
      booking: "Booking",
      unassign: "Unassign",
      unassignSuccess: "Booking unassigned",
      unassignSuccessDescription: "The booking has been removed from this driver.",
      unassignError: "Failed to unassign booking"
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
        loadError: "Failed to load driver availability",
        editDisabledTooltip: "Cannot edit booking assignments",
        deleteDisabledTooltip: "Cannot delete booking assignments"
      },
      loading: "Loading...",
      setAvailability: "Set Availability",
      setAvailabilityFor: "Set Availability for {date}",
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
      noUpcomingSchedule: "No upcoming schedule changes.",
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
      },
      returnMessage: "This driver will return to work on {date}.",
      onBookingMessage: "This driver is currently on a booking until {endTime}."
    },
    vehicles: {
      title: "Assigned Vehicles",
      description: "Vehicles assigned to this driver",
      noVehicles: "No vehicles assigned to this driver"
    },
    pagination: {
      showing: "Showing {start}-{end} of {total} items",
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
    createNewInspection: "Create New Inspection",
    createNewInspectionDescription: "Create a new inspection by filling out the form below",
    editInspection: "Edit Inspection",
    searchPlaceholder: "Search inspections...",
    noInspections: "No inspections found",
    createInspection: "Create Inspection",
    defaultType: "Routine",
    groupBy: "Group by",
    addNew: "Click the button above to create your first inspection",
    groupByOptions: {
      none: "None",
      date: "Date",
      vehicle: "Vehicle"
    },
    steps: {
      selectVehicle: "Select Vehicle",
      selectType: "Select Inspection Type"
    },
    labels: {
      progress: "Inspection Progress",
      estimatedTime: "Est. time remaining",
      model: "Model",
      photoNumber: "Photo {{number}}",
      currentSection: "Current Section",
      showingVehicles: "Showing {{start}}-{{end}} of {{total}} vehicles"
    },
    actions: {
      pass: "Pass",
      fail: "Fail",
      complete: "Complete Inspection",
      markComplete: "Mark as Complete",
      markInProgress: "Start Inspection",
      startInspection: "Start Inspection",
      addPhoto: "Add Photo",
      addNote: "Add Note",
      viewDetails: "View Details",
      previousSection: "Previous Section",
      nextSection: "Next Section",
      completeInspection: "Complete Inspection",
      takePhoto: "Take Photo",
      photos: "{{count}} Photos",
      needsRepair: "Items Need Repair",
      scheduleRepair: "Schedule Repair",
      scheduleRepairDescription: "Create a maintenance task for the failed items"
    },
    status: {
      pending: "Pending",
      inProgress: "In Progress",
      completed: "Completed",
      failed: "Failed"
    },
    type: {
      routine: "Routine",
      safety: "Safety",
      maintenance: "Maintenance",
      description: {
        routine: "Comprehensive check of vehicle systems.",
        safety: "Focused check on safety-critical components."
      }
    },
    fields: {
      date: "Date",
      type: "Type",
      status: "Status",
      vehicle: "Vehicle",
      inspector: "Inspector",
      inspectorEmail: "Inspector Email",
      notes: "Notes",
      notesPlaceholder: "Add notes about this item...",
      photos: "Photos",
      photo: "Photo"
    },
    messages: {
      saveSuccess: "Inspection saved successfully",
      saveError: "Error saving inspection",
      exportSuccess: "Inspection exported successfully",
      exportError: "Error exporting inspection",
      completeSuccess: "Inspection marked as complete",
      completeError: "Error completing inspection",
      printStarted: "Print started"
    },
    details: {
      title: "Inspection Details",
      printTitle: "Inspection Report",
      scheduledFor: "Scheduled for {date}",
      inspectionItems: "Inspection Items",
      sections: {
        vehicle: "Vehicle Information",
        inspection: "Inspection Information",
        summary: "Summary",
        items: "Inspection Items",
        steering_system: "Steering System",
        brake_system: "Brake System",
        suspension: "Suspension System",
        lighting: "Lighting System",
        tires: "Tires",
        engine: "Engine",
        transmission: "Transmission",
        electrical: "Electrical System",
        safety_equipment: "Safety Equipment",
        brake_safety: "Brake Safety",
        scheduled_maintenance: "Scheduled Maintenance",
        wear_items: "Wear Items",
        visibility: "Visibility",
        restraint_systems: "Restraint Systems",
        diagnostics: "Diagnostics",
        other: "Other"
      },
      vehicleInfo: {
        title: "Vehicle Information",
        plateNumber: "Plate Number",
        brand: "Brand",
        model: "Model",
        year: "Year",
        noImage: "No image available"
      },
      inspectionDetails: "Inspection Details",
      inspector: {
        title: "Inspector",
        name: "Inspector Name",
        email: "Inspector Email"
      },
      results: {
        title: "Inspection Summary",
        passCount: "Passed Items: {count}",
        failCount: "Failed Items: {count}",
        photoCount: "Photos Taken: {count}",
        notesCount: "Notes Added: {count}",
        completionRate: "Completion Rate",
        lastUpdated: "Last Updated",
        failedItemsFound: "Failed Items Found",
        failedItemsDescription: "The following items did not meet inspection standards.",
        allPassed: "All Items Passed",
        noFailedItems: "No failed items found in this inspection.",
        passedLabel: "Items Passed",
        failedLabel: "Items Failed",
        notesLabel: "Notes Added",
        photosLabel: "Photos Taken"
      },
      tabs: {
        details: "Details",
        failed: "Failed Items",
        passed: "Passed Items",
        photos: "Photos",
        notes: "Notes"
      },
      photos: {
        title: "Photos",
        downloadPhoto: "Download Photo"
      },
      vehicleDetails: "Vehicle Details",
      exportResult: "Export Result",
      actions: {
        exportResult: "Export Result",
        needsRepair: "Items Need Repair",
        scheduleRepair: "Schedule Repair",
        scheduleRepairDescription: "Create a maintenance task for the failed items"
      },
      dateLabel: "Inspection Date"
    },
    dateLabel: "Inspection Date",
    templates: {
      itemNameLabel: "Item Name"
    },
    notesPlaceholder: "Add notes about this item...",
    noVehicle: "No Vehicle Assigned",
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
      count: "{{count}} inspections",
      vehicleCount: "{{count}} inspections"
    },
    sections: {
      lighting: {
        title: "Lighting System",
        items: {
          taillights: { title: "Taillights", description: "Check taillight operation and condition." },
          turn_indicators: { title: "Turn Indicators", description: "Check turn indicator operation and condition." },
          headlights: { title: "Headlights", description: "Check headlight operation and condition." },
          brake_lights: { title: "Brake Lights", description: "Check brake light operation and condition." }
        }
      },
      tires: {
        title: "Tires",
        items: {
          tire_pressure: { title: "Tire Pressure", description: "Check and adjust tire pressure to recommended levels." },
          tread_depth: { title: "Tread Depth", description: "Measure tire tread depth for sufficient grip." },
          wear_pattern: { title: "Wear Pattern", description: "Inspect tires for uneven wear patterns." }
        }
      },
      engine: {
        title: "Engine",
        items: {
          oil_level: { title: "Oil Level", description: "Check engine oil level and condition." },
          coolant_level: { title: "Coolant Level", description: "Check engine coolant level and condition." },
          drive_belts: { title: "Drive Belts", description: "Inspect drive belts for wear and tension." },
          fluid_leaks: { title: "Fluid Leakage", description: "Check for any engine fluid leaks." }
        }
      },
      transmission: {
        title: "Transmission",
        items: {
          shifting_operation: { title: "Shifting Operation", description: "Test transmission for smooth shifting." },
          clutch_operation: { title: "Clutch Operation", description: "Check clutch engagement and operation (if applicable)." }
        }
      },
      electrical: {
        title: "Electrical System",
        items: {
          battery_condition: { title: "Battery Condition", description: "Inspect battery terminals and overall condition." },
          alternator_output: { title: "Alternator Output", description: "Check alternator charging voltage." },
          starter_operation: { title: "Starter Operation", description: "Test starter motor operation." }
        }
      },
      safety_equipment: {
        title: "Safety Equipment",
        items: {
          seatbelt_operation: { title: "Seatbelt Operation", description: "Check all seatbelts for proper function and condition." },
          airbag_system: { title: "Airbag System", description: "Verify airbag warning light status (no active faults)." },
          wiper_operation: { title: "Wiper Operation", description: "Test windshield wiper and washer fluid operation." },
          horn_operation: { title: "Horn Operation", description: "Test horn operation." }
        }
      },
      steering_system: {
        title: "Steering System",
        items: {
          power_steering: { title: "Power Steering", description: "Check power steering fluid level and for leaks. Test operation." },
          steering_column: { title: "Steering Column", description: "Inspect steering column for looseness or play." }
        }
      },
      brake_system: {
        title: "Brake System",
        items: {
          brake_pedal: { title: "Brake Pedal", description: "Check brake pedal feel and travel." },
          brake_discs: { title: "Brake Discs/Pads", description: "Inspect brake discs and pads for wear." },
          brake_fluid: { title: "Brake Fluid", description: "Check brake fluid level and condition." }
        }
      },
      suspension: {
        title: "Suspension System",
        items: {
          shock_absorbers: { title: "Shock Absorbers", description: "Inspect shock absorbers for leaks or damage." },
          springs: { title: "Springs", description: "Inspect suspension springs for damage or sagging." },
          bushings: { title: "Bushings", description: "Inspect suspension bushings for wear or damage." }
        }
      },
      brake_safety: {
        title: "Brake Safety",
        items: {
          abs_system: { title: "ABS System", description: "Check ABS warning light and system operation." },
          emergency_brake: { title: "Emergency Brake", description: "Test parking brake for proper operation and holding ability." },
          brake_lines: { title: "Brake Lines", description: "Inspect brake lines and hoses for leaks, cracks or damage." }
        }
      },
      restraint_systems: {
        title: "Restraint Systems",
        items: {
          seatbelt_condition: { title: "Seatbelt Condition", description: "Inspect all seatbelts for damage or fraying." },
          airbag_indicators: { title: "Airbag Indicators", description: "Check airbag system indicators for proper operation." },
          child_locks: { title: "Child Locks", description: "Test rear door child locks for proper function." }
        }
      },
      visibility: {
        title: "Visibility",
        items: {
          windshield_condition: { title: "Windshield Condition", description: "Inspect windshield for cracks or chips." },
          mirror_condition: { title: "Mirror Condition", description: "Check all mirrors for proper adjustment and condition." },
          window_operation: { title: "Window Operation", description: "Test all windows for smooth operation." }
        }
      },
      other: {
        title: "Other",
        items: {
          lighting_device: { 
            title: "Lighting Device", 
            description: "Check operation of all external lights including license plate light" 
          },
          blinkers_hazards: { 
            title: "Blinkers, Hazards", 
            description: "Check operation of turn signals and hazard lights" 
          },
          brake_lights: { 
            title: "Brake Lights", 
            description: "Check brake light activation when pedal is pressed" 
          },
          engine_oil: { 
            title: "Engine Oil", 
            description: "Check oil level and condition using dipstick" 
          },
          brake_fluid_volume: { 
            title: "Brake Fluid Volume", 
            description: "Check fluid level in brake fluid reservoir" 
          },
          radiator_fluid: { 
            title: "Radiator Reservoir Tank Fluid Volume", 
            description: "Check coolant level in reservoir tank" 
          },
          liquid_leakage: { 
            title: "Liquid leakage (under the vehicle)", 
            description: "Inspect under the vehicle for signs of fluid leaks" 
          }
        }
      },
      items: {
        title: "Inspection Items",
        itemHeader: "Item",
        statusHeader: "Status",
        notesHeader: "Notes"
      }
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
      createQuotation: "Create Quotation",
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
      description: "Upcoming and recent maintenance tasks",
      noTasksScheduled: "No maintenance tasks scheduled",
      noTasksCompleted: "No completed maintenance tasks",
      noTasksInProgress: "No maintenance tasks in progress",
      viewAll: "View all maintenance tasks"
    },
    inspections: {
      title: "Inspections",
      description: "Upcoming and recent inspections",
      noInspectionsScheduled: "No inspections scheduled",
      noInspectionsCompleted: "No completed inspections",
      noInspectionsInProgress: "No inspections in progress",
      viewAll: "View all inspections"
    },
    stats: {
      totalVehicles: "Total Vehicles",
      maintenanceTasks: "Maintenance Tasks",
      inspections: "Inspections",
      activeVehicles: "Active Vehicles",
      vehiclesInMaintenance: "In Maintenance",
      scheduledInspections: "Scheduled",
      inProgressInspections: "In Progress",
      completedInspections: "Completed",
      pendingTasks: "Pending",
      inProgressTasks: "In Progress",
      completedTasks: "Completed"
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
      },
      inProgress: {
        title: "In Progress",
        maintenance: "Maintenance In Progress",
        inspections: "Inspections In Progress",
        noTasks: "No tasks in progress"
      }
    },
    tabs: {
      recent: "Recent",
      upcoming: "Upcoming",
      inProgress: "In Progress"
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
    description: "View and manage your vehicle bookings",
    search: {
      text: "Search bookings...",
      placeholder: "Search bookings..."
    },
    addBooking: "New Booking",
    newBooking: "New Booking",
    editBooking: "Edit Booking",
    viewOptions: {
      grid: "Grid View",
      list: "List View"
    },
    actions: {
      sync: "Sync Bookings",
      refresh: "Refresh",
      generateInvoice: "Generate Invoice",
      emailInvoice: "Email Invoice"
    },
    cancelDialog: {
      title: "Cancel Booking",
      description: "Are you sure you want to cancel this booking? This action cannot be undone.",
      cancel: "Keep Booking",
      confirm: "Yes, Cancel Booking"
    },
    invoice: {
      emailDescription: "Send the invoice as a PDF attachment to the customer's email address.",
      includeDetails: "Include booking details"
    },
    billing: {
      title: "Billing Information",
      details: "Enter billing information for invoicing",
      companyName: "Company Name",
      taxNumber: "Tax Number / VAT ID",
      streetName: "Street Name",
      streetNumber: "Street Number / Building",
      city: "City",
      state: "State / Province",
      postalCode: "Postal / ZIP Code",
      country: "Country",
      address: "Address"
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
      assignFailed: "Failed to complete assignment",
      notAssigned: "Not assigned",
      pickupDate: "Pickup Date",
      pickupTime: "Pickup Time",
      pickupLocation: "Pickup Location",
      dropoffLocation: "Dropoff Location",
      edit: "Edit",
      saving: "Saving...",
      licensePlate: "License Plate",
      vehicleBrand: "Vehicle Brand",
      vehicleModel: "Vehicle Model",
      alternativeVehicles: "Alternative Vehicles",
      notAvailable: "Not Available",
      name: "Name",
      phone: "Phone",
      email: "Email"
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
        assignment: "Driver & Vehicle Assignment",
        billingAddress: "Billing Address",
        billing: "Billing Information",
        coupon: "Coupon Information"
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
        vehicleBrand: "Vehicle Brand",
        vehicleModel: "Vehicle Model",
        serviceType: "Service Type",
        serviceName: "Service Name",
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
        amount: "Amount",
        originalPrice: "Original Price",
        finalAmount: "Final Amount",
        name: "Name",
        customerName: "Customer Name",
        driver: "Driver",
        companyName: "Company Name",
        taxNumber: "Tax Number / VAT ID",
        street: "Street",
        city: "City",
        state: "State / Province",
        postalCode: "Postal / ZIP Code",
        country: "Country",
        coupon: "Coupon",
        couponCode: "Coupon Code",
        couponDiscount: "Discount Percentage",
        discount: "Discount",
        address: "Address",
        cityState: "City/State/Postal",
        billingCompany: "Billing Company"
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
        confirmCancel: "Yes, Cancel Booking",
        confirmCancellation: "Cancel Booking?",
        cancellationWarning: "Are you sure you want to cancel this booking? This action cannot be undone.",
        cancelSuccess: "Booking Cancelled",
        cancelError: "Error Cancelling Booking",
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
        exportPdf: "Export PDF",
        generateInvoice: "Generate Invoice",
        emailInvoice: "Email Invoice",
        emailCustomer: "Email Customer",
        callCustomer: "Call Customer",
        textCustomer: "Text Customer"
      },
      driverActions: {
        title: "Driver Actions",
        tripManagement: "Trip Management",
        shareBooking: "Share Booking",
        addToGoogleCalendar: "Add to Google Calendar"
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
        notAvailable: "No forecast available for {date}",
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
      },
      quickCustomerActions: "Quick Customer Actions",
      tooltips: {
        emailTo: "Send email to",
        callTo: "Call to",
        textTo: "Send text to"
      },
      flightInformation: "Flight Information",
      notesAndInstructions: "Notes & Instructions",
      googleMapsApiKeyMissing: "Google Maps API Key Missing",
      googleMapsApiKeyMissingDescription: "The Google Maps API key is not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables. Manual address entry will still work."
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
      successWithCount: "Successfully synced {count} bookings ({created} created, {updated} updated)",
      confirmUpdates: "Confirm Booking Updates",
      confirmUpdatesDescription: "The following bookings have changes. Select which bookings you want to update.",
      syncSummary: "Found {newCount} new bookings to create and {updateCount} bookings to update.",
      newBookingsAutomatically: "New bookings will be created automatically.",
      confirmAndSync: "Confirm & Sync",
      cancelled: "Sync cancelled by user",
      changesSummary: "Changes Summary",
      searchPlaceholder: "Search bookings...",
      allChanges: "All Changes",
      perPage: "{count} per page",
      previous: "Previous",
      next: "Next",
      current: "Current",
      afterUpdate: "After Update",
      dateTime: "Date/Time",
      importedBy: "Imported By"
    },
    calculateRoute: "Calculate Route Distance & Duration",
    autoCalculateAvailable: "Auto-calculate available"
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
      confirmed: "Confirmed",
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
      confirmed: "Confirmed",
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
  },
  settings: {
    title: "Settings",
    description: "Manage account settings and preferences",
    selectTab: "Select settings tab",
    profile: {
      title: "Profile",
      description: "Manage your profile information",
      name: "Name",
      email: "Email",
      emailDescription: "Your email is used for login and notifications."
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
        ja: "日本語"
      }
    },
    menu: {
      title: "Menu Settings",
      description: "Customize the menu items displayed in the navigation",
      menuItem: "Menu Item",
      desktop: "Desktop",
      mobile: "Mobile",
      desktopSettingsHidden: "Desktop settings are only visible on larger screens.",
      alwaysVisible: "Always Visible",
      dashboard: "Dashboard",
      vehicles: "Vehicles",
      drivers: "Drivers",
      bookings: "Bookings",
      maintenance: "Maintenance",
      inspections: "Inspections",
      reporting: "Reporting",
      settings: "Settings",
      quotations: "Quotations",
      dispatch: "Dispatch Board",
      save: "Save Changes"
    },
    templates: {
      title: "Inspection Templates",
      description: "Manage the structure (sections and items) of your inspection forms."
    },
    tabs: {
      profile: "Profile",
      preferences: "Preferences",
      menu: "Menu",
      templates: "Templates",
      account: "Account"
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
    }
  },
  notifications: {
    sendSuccess: "Item sent successfully",
    error: "An error occurred",
    createSuccess: "Item created successfully",
    updateSuccess: "Item updated successfully",
    deleteSuccess: "Item deleted successfully"
  },
  system: {
    notifications: {
      error: "An error occurred",
      success: "Operation completed successfully",
      warning: "Warning",
      info: "Information"
    }
  },
  quotations: {
    title: "Quotations",
    description: "Manage your customer quotations",
    create: "Create Quotation",
    edit: "Edit Quotation",
    view: "View Quotation",
    duplicate: "Duplicate Quotation",
    placeholder: "No quotations found",
    list: "All Quotations",
    listDescription: "Manage and track your customer quotations",
    filters: {
      all: "All Quotations",
      searchPlaceholder: "Search quotations...",
      clearFilters: "Clear Filters",
      noResults: "No quotations match your search criteria"
    },
    form: {
      create: "Create New Quotation",
      update: "Update Quotation",
      customerSection: "Customer Information",
      detailsSection: "Quotation Details",
      servicesSection: "Services Information",
      serviceSection: "Services Information",
      priceSection: "Price Details",
      pricingSection: "Pricing Information",
      notesSection: "Notes & Comments",
      previewSection: "Preview",
      saveAsDraft: "Save as Draft",
      sendToCustomer: "Send to Customer",
      title: "Title",
      placeholders: {
        title: "Enter a title for this quotation",
        customerName: "Enter customer name",
        customerEmail: "Enter customer email",
        customerPhone: "Enter customer phone number",
        merchantNotes: "Internal notes (only visible to you)",
        customerNotes: "Notes for the customer (visible to customer)"
      },
      customerName: "Customer Name",
      customerEmail: "Customer Email",
      customerPhone: "Customer Phone",
      discountPercentage: "Discount Percentage",
      taxPercentage: "Tax Percentage",
      merchantNotes: "Internal Notes",
      customerNotes: "Customer Notes",
      serviceUpdated: "Service Updated",
      serviceUpdatedDescription: "The service details have been updated successfully."
    },
    pricing: {
      total: "Total Amount",
      subtotal: "Subtotal",
      tax: "Tax",
      discount: "Discount" 
    },
    listColumns: {
      id: "ID",
      customer: "Customer",
      date: "Date",
      amount: "Amount",
      status: "Status",
      expiresOn: "Expires On",
      actions: "Actions"
    },
    notifications: {
      createSuccess: "Quotation created successfully",
      updateSuccess: "Quotation updated successfully",
      deleteSuccess: "Quotation deleted successfully",
      error: "Error",
      sendSuccess: "Your Quotation has been sent",
      updateAndSendSuccess: "Your Updated Quotation has been sent",
      partialSuccess: "Partial success",
      emailFailed: "Email sent but status update failed",
      approveSuccess: "Quotation approved successfully",
      rejectSuccess: "Quotation rejected successfully",
      convertSuccess: "Quotation converted to booking successfully"
    },
    messageBlock: {
      title: "Conversation",
      noMessages: "No messages yet",
      startConversation: "Start a conversation with the customer about this quotation",
      typePlaceholder: "Type your message...",
      send: "Send Message",
      pressEnterHint: "Press Ctrl+Enter to send",
      messageCounter: "{count} messages",
      loadMore: "Load more",
      unreadMessages: "{count} unread messages"
    },
    activities: {
      created: "Quotation created",
      updated: "Quotation updated",
      sent: "Quotation sent to customer",
      approved: "Quotation approved by customer",
      rejected: "Quotation rejected by customer",
      converted: "Quotation converted to booking",
      message: "Message added",
      refresh: "Refresh activities",
      loadMore: "Load More ({count} more)",
      filters: {
        all: "All Activities",
        updates: "Updates",
        messages: "Messages"
      },
      empty: {
        all: "No activities recorded yet",
        updates: "No updates found",
        messages: "No messages found"
      },
      feed: {
        created: "{userName} created this quotation",
        updated: "{userName} updated the quotation details",
        sent: "{userName} sent the quotation to the customer",
        approved: "{userName} approved the quotation",
        rejected: "{userName} rejected the quotation: \"{reason}\"",
        converted: "{userName} converted the quotation to a booking",
        message: "{userName} sent a message: \"{message}\"",
        default: "{userName} performed action: {action}"
      }
    },
    details: {
      title: "Quotation Details",
      description: "View and manage quotation details",
      quotationNumber: "Quotation Number #{id}",
      customerInfo: "Customer Information",
      contactInfo: "Contact Information",
      billingAddress: "Billing Address",
      taxId: "Tax ID",
      serviceInfo: "Service Information",
      serviceDetails: "Service Details",
      serviceType: "Service Type",
      vehicleType: "Vehicle Type",
      duration: "Duration",
      hours: "hours",
      days: "days",
      hoursPerDay: "hours per day",
      schedule: "Schedule",
      pickupDate: "Pickup Date",
      pickupTime: "Pickup Time",
      priceDetails: "Price Details",
      validUntil: "Valid until {date}",
      created: "Created",
      expiry: "Expiry",
      validFor: "Valid for",
      locations: "Locations",
      pickup: "Pickup",
      dropoff: "Dropoff",
      notes: "Notes",
      notesAndTerms: "Notes and Terms",
      termsAndConditions: "Terms and Conditions",
      activities: "Activity Feed",
      untitled: "Untitled Quotation",
      expires: "Expires",
      expired: "Expired on {date}",
      info: "Quotation Information",
      status: "Quotation Status",
      noActivities: "No activities recorded yet",
      noFilteredActivities: "No activities of this type found",
      approvalPanel: {
        title: "Quotation Approval",
        approveButton: "Approve Quotation",
        rejectButton: "Reject Quotation",
        approveConfirmation: "Are you sure you want to approve this quotation?",
        rejectConfirmation: "Are you sure you want to reject this quotation?",
        description: "Review this quotation and either approve to proceed or reject with detailed feedback.",
        notesLabel: "Notes (Optional)",
        notesPlaceholder: "Add any notes or comments about your decision",
        reasonLabel: "Reason for Rejection",
        reasonPlaceholder: "Please provide a reason for rejecting this quotation",
        approvalSuccess: "Quotation approved successfully",
        rejectionSuccess: "Quotation rejected successfully"
      }
    },
    status: {
      draft: "Draft",
      sent: "Sent",
      approved: "Approved", 
      rejected: "Rejected",
      expired: "Expired",
      converted: "Converted to Booking"
    },
    actions: {
      view: "View",
      edit: "Edit",
      delete: "Delete",
      send: "Send",
      copy: "Duplicate",
      remind: "Send Reminder",
      print: "Print",
      download: "Download PDF",
      email: "Email Quotation"
    },
    emailDescription: "Send the quotation as a PDF attachment to the customer's email address.",
    includeDetails: "Include quotation details",
    editSection: {
      title: "Edit Quotation",
      description: "Modify the quotation details",
      notEditable: "This quotation cannot be edited",
      notEditableDescription: "Only quotations in Draft or Sent status can be edited."
    },
    empty: {
      title: "No Quotations Found",
      description: "No quotations found for the selected filters.",
      cta: "Create Quotation"
    }
  },
  email: {
    quotation: {
      approved: {
        subject: "Quotation Approved"
      },
      rejected: {
        subject: "Quotation Rejected"
      }
    }
  },
  notAuthorized: {
    title: "Access Denied",
    description: "You don't have permission to access this area. Only Japan Driver staff can access this section.",
    loginButton: "Log in with a different account"
  },
  pricing: {
    title: "Pricing Management",
    description: "Manage service pricing, promotions, and packages",
    categories: {
      title: "Categories",
      description: "Manage pricing categories",
      createSuccess: "Category created successfully",
      createSuccessDescription: "The new category has been added",
      createError: "Failed to create category",
      updateSuccess: "Category updated successfully",
      updateSuccessDescription: "The category has been updated",
      updateError: "Failed to update category",
      deleteSuccess: "Category deleted successfully",
      deleteSuccessDescription: "The category has been removed",
      deleteError: "Failed to delete category"
    },
    items: {
      title: "Pricing Items",
      description: "Manage individual pricing items",
      createSuccess: "Pricing item created successfully",
      createSuccessDescription: "The new pricing item has been added",
      createError: "Failed to create pricing item",
      updateSuccess: "Pricing item updated successfully",
      updateSuccessDescription: "The pricing item has been updated",
      updateError: "Failed to update pricing item",
      deleteSuccess: "Pricing item deleted successfully",
      deleteSuccessDescription: "The pricing item has been removed",
      deleteError: "Failed to delete pricing item"
    },
    promotions: {
      title: "Promotions",
      description: "Manage promotional codes and discounts",
      createSuccess: "Promotion created successfully",
      createSuccessDescription: "The new promotion has been added",
      createError: "Failed to create promotion",
      updateSuccess: "Promotion updated successfully",
      updateSuccessDescription: "The promotion has been updated",
      updateError: "Failed to update promotion",
      deleteSuccess: "Promotion deleted successfully",
      deleteSuccessDescription: "The promotion has been removed",
      deleteError: "Failed to delete promotion"
    },
    packages: {
      title: "Packages",
      description: "Manage package deals and bundles",
      createSuccess: "Package created successfully",
      createSuccessDescription: "The new package has been added",
      createError: "Failed to create package",
      updateSuccess: "Package updated successfully",
      updateSuccessDescription: "The package has been updated",
      updateError: "Failed to update package",
      deleteSuccess: "Package deleted successfully",
      deleteSuccessDescription: "The package has been removed",
      deleteError: "Failed to delete package"
    }
  }
}

export default en 