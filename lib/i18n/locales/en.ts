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
      type: "Type",
      pass: "Pass",
      fail: "Fail",
      pending: "Pending"
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
    actions: {
      default: "Actions",
      goHome: "Go Home",
      tryAgain: "Try Again",
      chat: "Chat"
    },
    actionsMenu: {
      default: "Actions",
      goHome: "Go Home",
      tryAgain: "Try Again",
      chat: "Chat"
    },
    booking: "Booking",
    viewDetails: "View details",
    addNew: "Add new",
    backTo: "Back to",
    backToList: "Back to list",
    saving: "Saving...",
    update: "Update",
    create: "Create",
    created: "Created",
    deleting: "Deleting...",
    creating: "Creating...",
    menu: "Menu",
    login: "Login",
    logout: "Logout",
    darkMode: "Dark mode",
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
    unassign: "Unassign",
    assign: "Assign",
    none: "None",
    cannotBeUndone: "This action cannot be undone.",
    updateAndSend: "Update & Send",
    processing: "Processing...",
    copy: "Copy",
    activate: "Activate",
    deactivate: "Deactivate",
    dateFormat: {
      short: "MM/DD/YYYY",
      medium: "MMM D, YYYY",
      long: "MMMM D, YYYY",
      monthYear: "MMMM YYYY"
    },
    formHasErrors: "Please fix the errors in the form before submitting",
    exportPDF: "Export PDF",
    exportCSV: "Export CSV",
    notAvailable: "N/A",
    notAvailableShort: "N/A",
    recentActivity: "Recent Activity",
    date: "Date",
    cost: "Cost",
    forms: {
      required: "Required"
    },
    notifications: {
      success: "Success",
      error: "Error"
    },
    // Flat keys for direct access
    duplicate: "Duplicate",
    time: "Time",
    showingResults: "Showing {start}-{end} of {total} results",
    nameEn: "Name (English)",
    nameJa: "Name (Japanese)", 
    descriptionEn: "Description (English)",
    descriptionJa: "Description (Japanese)",
    order: "Order",
    add: "Add",
    clearFilters: "Clear Filters"
  },
  
  calendar: {
    weekdays: {
      mon: "Mon",
      tue: "Tue",
      wed: "Wed", 
      thu: "Thu",
      fri: "Fri",
      sat: "Sat",
      sun: "Sun"
    },
    months: {
      january: "January",
      february: "February",
      march: "March",
      april: "April",
      may: "May",
      june: "June",
      july: "July",
      august: "August",
      september: "September",
      october: "October",
      november: "November",
      december: "December"
    }
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
    assignments: "Assignments",
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
    backToDriver: "Back to Driver",
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
      notes: "Notes",
      idLabel: "ID"
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
      title: "Status",
      active: "Active",
      inactive: "Inactive",
      on_leave: "On Leave",
      training: "Training",
      available: "Available",
      unavailable: "Unavailable",
      leave: "On Leave"
    },
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
    upcomingBookings: {
      title: "Upcoming Bookings",
      description: "Scheduled bookings for this driver",
      unassign: "Unassign",
      unassignSuccess: "Booking unassigned",
      unassignSuccessDescription: "The booking has been removed from this driver.",
      unassignError: "Failed to unassign booking",
      empty: {
        title: "No Upcoming Bookings",
        description: "This driver has no upcoming bookings scheduled.",
        booking: "Booking #{id}"
      }
    },
    inspections: {
      empty: {
        title: "No Recent Inspections",
        description: "This driver hasn't performed any inspections recently."
      }
    },
    currentStatus: {
      title: "Current Status"
    },
    keyInformation: {
      title: "Key Information"
    },
    tabs: {
      overview: "Overview",
      availability: "Availability",
      assignedVehicles: "Assigned Vehicles",
      activityLog: "Activity Log"
    },
    recentActivity: {
      title: "Recent Activity",
      description: "Latest activities and assignments"
    },
    activity: {
      empty: {
        title: "No Recent Activity",
        description: "This driver has no recent activity to display."
      }
    },
    bookingHistory: {
      title: "Booking History",
      description: "A list of all bookings assigned to this driver.",
      table: {
        dateTime: "Date & Time",
        service: "Service",
        customer: "Customer",
        status: "Status",
        actions: "Actions"
      },
      viewButton: "View",
      empty: {
        title: "No Bookings Found",
        description: "This driver has no assigned bookings."
      }
    },
    pagination: {
      showing: "Showing {start}-{end} of {total} items",
    },
    errors: {
      loadFailed: {
        title: "Could Not Load Driver",
        description: "We couldn\'t retrieve the details for driver ID {driverId}. Please try again or contact support if the issue persists."
      },
      consoleDriverIdError: "Driver ID is missing or invalid in server component.",
      consoleLoadError: "Error loading driver data for ID {driverId} in server component:"
    },
    messages: {
      refreshError: "Failed to refresh driver data",
      consoleRefreshError: "Error refreshing driver data",
      couldNotSaveViewPreference: "Could not save view preference",
      loadError: "Failed to load driver data",
      loadErrorDescription: "Could not retrieve driver information. Please try again.",
      noVehicleSelected: "No vehicle selected",
      noVehicleSelectedDescription: "Please select at least one vehicle to assign.",
      noVehicleSelectedToUnassign: "Please select at least one vehicle to unassign.",
      assignSuccess: "Vehicle assigned successfully",
      assignSuccessDescription: "The vehicle has been assigned to this driver.",
      multipleAssignSuccessDescription: "{count} vehicles have been assigned to this driver.",
      assignError: "Failed to assign vehicle",
      assignErrorDescription: "Could not assign vehicle to driver. Please try again.",
      unassignSuccess: "Vehicle unassigned successfully",
      unassignSuccessDescription: "The vehicle has been unassigned from this driver.",
      multipleUnassignSuccessDescription: "{count} vehicles have been unassigned from this driver.",
      unassignError: "Failed to unassign vehicle",
      unassignErrorDescription: "Could not unassign vehicle from driver. Please try again."
    }
  },
  vehicles: {
    title: "Vehicles",
    description: "Manage your vehicle fleet",
    addVehicle: "Add Vehicle",
    newVehicle: "New Vehicle",
    editVehicle: "Edit Vehicle",
    backToVehicle: "Back to Vehicle",
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
      plateNumberLabel: "Plate Number",
      brand: "Brand",
      brandLabel: "Brand",
      brandDescription: "The manufacturer of the vehicle",
      brandPlaceholder: "e.g., Toyota",
      model: "Model",
      modelLabel: "Model",
      modelPlaceholder: "e.g., Camry",
      year: "Year",
      yearLabel: "Year",
      yearPlaceholder: "e.g., 2024",
      vin: "VIN",
      vinLabel: "VIN",
      vinDescription: "17-character vehicle identification number",
      status: "Status",
      statusLabel: "Status",
      statusDescription: "Current operational status of the vehicle",
      addedOnLabel: "Added On",
      passengerCapacityLabel: "Passenger Capacity",
      luggageCapacityLabel: "Luggage Capacity",
      nameLabel: "Name",
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
      type: "Vehicle Type",
      luggageCapacity: "Luggage Capacity",
      luggageCapacityDescription: "Maximum number of luggage pieces",
      luggageCapacityPlaceholder: "e.g., 4",
      passengerCapacity: "Passenger Capacity", 
      passengerCapacityDescription: "Maximum number of passengers",
      passengerCapacityPlaceholder: "e.g., 8"
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
      additionalInfo: "Additional Information",
      imageUpload: "Vehicle Image",
      uploadImageButton: "Upload Image",
      uploadImageDragText: "Drag and drop an image here, or click to select",
      uploadImageSizeLimit: "Maximum file size: 5MB"
    },
    tabs: {
      info: "Information",
      history: "History",
      bookings: "Bookings",
      inspections: "Inspections",
      historyEmpty: "No history available",
      bookingsEmpty: "No bookings found",
      inspectionsEmpty: "No inspections found",
      allHistory: "All History",
      maintenanceHistory: "Maintenance History",
      inspectionHistory: "Inspection History",
      bookingHistory: "Booking History",
      filterBy: "Filter by",
      allTypes: "All Types",
      maintenance: "Maintenance",
      inspection: "Inspection",
      booking: "Booking",
      vehicleBookings: "Vehicle Bookings",
      vehicleInspections: "Vehicle Inspections",
      noBookingsForVehicle: "No bookings found for this vehicle",
      noInspectionsForVehicle: "No inspections found for this vehicle",
      dailyInspections: "Daily Inspections",
      routineInspections: "Routine Inspections"
    },
    messages: {
      createSuccess: "Vehicle created successfully",
      updateSuccess: "Vehicle updated successfully",
      deleteSuccess: "Vehicle deleted successfully",
      error: "An error occurred",
      deleteError: "Cannot delete vehicle",
      hasAssociatedRecords: "This vehicle has associated inspections or maintenance tasks and cannot be deleted",
      imageUploadError: "Failed to upload image",
      prefetchMileageError: "Failed to prefetch mileage logs",
      prefetchFuelError: "Failed to prefetch fuel logs"
    },
    addNewTitle: "Add New Vehicle",
    addNewDescription: "Add a new vehicle to the fleet",
    vehicleInformation: "Vehicle Information",
    vehicleDetails: "Vehicle Details",
    vehicleStatus: "Vehicle Status",
    basicInformation: "Basic Information",
    specifications: "Specifications",
    quickActions: "Quick Actions",
    actions: {
      viewAllHistory: "View All History",
      viewBookings: "View Bookings", 
      viewInspections: "View Inspections",
      editVehicle: "Edit Vehicle",
      viewDetails: "View Details"
    },
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
      noTasks: "No tasks in progress"
    },
    allVehicles: "All Vehicles",
    status: {
      active: "Active",
      inactive: "Inactive",
      maintenance: "In Maintenance"
    },
    noImage: "No image",
    detailsPage: { // New object for details page specific translations
      titleFallback: "Vehicle Details",
      descriptionFallback: "View vehicle details"
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
      createSuccessDescription: "The new maintenance task has been added.",
      updateSuccess: "Maintenance task updated successfully",
      updateSuccessDescription: "The maintenance task details have been updated.",
      deleteSuccess: "Maintenance task deleted successfully",
      taskStarted: "Maintenance task started",
      error: "An error occurred",
      createErrorDescription: "There was a problem creating the maintenance task. Please try again.",
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
    description: "Manage and track vehicle inspections.",
    searchPlaceholder: "Search inspections by vehicle or type...",
    createInspection: "Create Inspection",
    createNewInspection: "Create New Inspection",
    createNewInspectionDescription: "Fill in the details to create a new inspection record.",
    viewDetails: "View Details",
    performInspection: "Perform Inspection",
    noInspections: "No inspections found.",
    addNew: "Add a new inspection to get started.",
    unnamedInspection: "Unnamed Inspection",
    noVehicle: "No Vehicle Assigned",
    noVehicleAssigned: "No Vehicle Assigned",
    overallNotes: "Overall Notes",
    selectDate: "Select Date Range",
    groupBy: "Group By",
    defaultType: "Routine",
    typeLabel: "Type",
    statusLabel: "Status",
    inspectorLabel: "Inspector",
    inspectorEmailLabel: "Inspector Email",
    groupByOptions: {
      date: "Date",
      vehicle: "Vehicle",
      none: "None"
    },
    quickStats: {
      title: "Inspection Overview",
      todaysInspections: "Today's Inspections",
      pendingInspections: "Pending Inspections", 
      weeklyCompleted: "Completed This Week",
      failedInspections: "Failed Inspections",
      totalInspections: "Total Inspections",
      averageCompletionTime: "Avg. Completion Time",
      passRate: "Pass Rate",
      upcomingInspections: "Upcoming Inspections"
    },
    calendar: {
      title: "Inspection Calendar",
      viewMode: "View Mode",
      month: "Month",
      week: "Week",
      day: "Day",
      today: "Today",
      previousMonth: "Previous Month",
      nextMonth: "Next Month",
      previousWeek: "Previous Week",
      nextWeek: "Next Week",
      previousDay: "Previous Day",
      nextDay: "Next Day",
      noInspectionsOnDate: "No inspections scheduled for this date",
      inspectionsOnDate: "{count} inspection(s) on {date}",
      scheduleInspection: "Schedule Inspection",
      viewInspection: "View Inspection"
    },
    status: {
      pending: "Pending",
      inProgress: "In Progress",
      in_progress: "In Progress",
      completed: "Completed",
      failed: "Failed",
      scheduled: "Scheduled",
      cancelled: "Cancelled"
    },
    type: {
      routine: "Routine",
      safety: "Safety",
      maintenance: "Maintenance",
      daily: "Daily",
      test: "Test Inspection",
      unspecified: "Unspecified",
      daily_checklist_toyota: "Daily Checklist (Toyota)",
      "Daily Checklist Toyota": "Daily Checklist (Toyota)",
      daily_checklist_mercedes: "Daily Checklist (Mercedes)",
      "Daily Checklist Mercedes": "Daily Checklist (Mercedes)",
      description: {
        routine: "Comprehensive check of vehicle systems.",
        safety: "Focused check on safety-critical components.",
        maintenance: "Detailed mechanical system inspection.",
        daily: "Quick daily inspection of essential components.",
        test: "Test inspection template for development and training purposes."
      }
    },
    typeValues: {
      routine: "Routine",
      safety: "Safety",
      maintenance: "Maintenance",
      daily: "Daily",
      unspecified: "Unspecified"
    },
    statusValues: {
      pass: "Pass",
      fail: "Fail",
      pending: "Pending",
      inProgress: "In Progress",
      completed: "Completed",
      failed: "Failed",
      scheduled: "Scheduled",
      cancelled: "Cancelled"
    },
    fields: {
      vehicle: "Vehicle",
      selectVehiclePlaceholder: "Select a vehicle",
      date: "Date",
      type: "Type",
      status: "Status",
      inspector: "Inspector",
      inspectorEmail: "Inspector Email",
      notes: "Notes",
      notesPlaceholder: "Add notes about this item...",
      photos: "Photos",
      photo: "Photo"
    },
    notifications: {
      createSuccess: "Inspection created successfully.",
      createError: "Failed to create inspection.",
      updateSuccess: "Inspection updated successfully.",
      updateError: "Failed to update inspection.",
      deleteSuccess: "Inspection deleted successfully.",
      deleteError: "Failed to delete inspection."
    },
    meta: {
      createTitle: "Create Inspection",
      createDescription: "Create a new vehicle inspection."
    },
    dateGroup: {
      today: "Today",
      yesterday: "Yesterday",
      thisWeek: "This Week",
      thisMonth: "This Month",
      upcoming: "Upcoming",
      older: "Older"
    },
    stats: {
      count: "{{count}} inspections",
      vehicleCount: "{{count}} inspections"
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
      scheduleRepairDescription: "Create a maintenance task for the failed items",
      start: "Start Inspection",
      continueEditing: "Continue Editing",
      markAsCompleted: "Mark as Completed",
      printReport: "Print Report",
      exportHtml: "Export HTML",
      exportPdf: "Export PDF",
      continueInspection: "Continue Inspection"
    },
    templateDuplicated: "Template duplicated successfully",
    templateDeleted: "Template deleted successfully",
    searchTemplates: "Search templates...",
    manageAssignments: "Manage Assignments",
    addSection: "Add Section",
    editSection: "Edit Section",
    addItem: "Add Item",
    editItem: "Edit Item",
    items: "items",
    sectionAdded: "Section added successfully",
    sectionUpdated: "Section updated successfully",
    sectionDeleted: "Section deleted successfully",
    itemAdded: "Item added successfully",
    itemUpdated: "Item updated successfully",
    itemDeleted: "Item deleted successfully",
    templateUpdated: "Template updated successfully",
    requiresPhoto: "Requires Photo",
    requiresNotes: "Requires Notes",
    noSections: "No sections found",
    createFirstSection: "Create your first section to get started",
    adjustFilters: "Try adjusting your search or filters",
    templateManager: {
      routineTemplateTitle: "Routine Inspection Template",
      safetyTemplateTitle: "Safety Inspection Template",
      maintenanceTemplateTitle: "Maintenance Inspection Template",
      dailyTemplateTitle: "Daily Checklist Template",
      testTemplateTitle: "Test Inspection Template",
      description: "Manage inspection template sections and items"
    },
    confirmDeleteTemplate: "Are you sure you want to delete this entire template? This action cannot be undone.",
    confirmDeleteSection: "Are you sure you want to delete this section? This action cannot be undone.",
    confirmDeleteItem: "Are you sure you want to delete this item? This action cannot be undone.",
    templateInstanceCreated: "Template instance created successfully",
    sections: {
      vehicle: "Vehicle Information",
      inspection: "Inspection Information",
      summary: "Summary",
      items: "Inspection Items",
      steering_system: {
        title: "Steering System",
        items: {
          steering_wheel: { title: "Steering Wheel", description: "Check steering wheel condition and play." },
          power_steering: { title: "Power Steering", description: "Check power steering fluid and operation." },
          steering_column: { title: "Steering Column", description: "Inspect steering column for looseness." }
        }
      },
      brake_system: {
        title: "Brake System",
        items: {
          brake_pedal: { title: "Brake Pedal", description: "Check brake pedal feel and travel." },
          brake_discs: { title: "Brake Discs/Pads", description: "Inspect brake discs and pads for wear." },
          brake_fluid: { title: "Brake Fluid", description: "Check brake fluid level and condition." },
          brake_oil: { title: "Brake Oil", description: "Check brake oil level and condition." },
          braking_condition: { title: "Braking Condition", description: "Test overall braking performance." }
        }
      },
      suspension: {
        title: "Suspension System",
        items: {
          shock_absorbers: { title: "Shock Absorbers", description: "Inspect shock absorbers for leaks or damage." },
          springs: { title: "Springs", description: "Inspect suspension springs for damage or sagging." },
          bushings: { title: "Bushings", description: "Inspect suspension bushings for wear or damage." },
          ball_joints: { title: "Ball Joints", description: "Inspect ball joints for wear or play." }
        }
      },
      lighting: {
        title: "Lighting System",
        items: {
          headlights: { title: "Headlights", description: "Check operation and alignment of headlights." },
          taillights: { title: "Taillights", description: "Check operation of taillights and brake lights." },
          turn_indicators: { title: "Turn Indicators", description: "Check operation of all turn indicators and hazard lights." },
          reverse_lights: { title: "Reverse Lights", description: "Check operation of reverse lights." },
          brake_lights: { title: "Brake Lights", description: "Check operation of brake lights." },
          hazard_lights: { title: "Hazard Lights", description: "Check operation of hazard lights." }
        }
      },
      engine: {
        title: "Engine",
        items: {
          oil_level: { title: "Oil Level", description: "Check engine oil level and condition." },
          coolant_level: { title: "Coolant Level", description: "Check engine coolant level and condition." },
          belts: { title: "Belts", description: "Inspect engine belts for wear and tension." },
          drive_belts: { title: "Drive Belts", description: "Inspect drive belts for wear and tension." },
          hoses: { title: "Hoses", description: "Inspect engine hoses for leaks or damage." },
          fluid_leaks: { title: "Fluid Leaks", description: "Check for any fluid leaks from the engine." },
          engine_oil: { title: "Engine Oil", description: "Check engine oil level and quality." },
          radiator_coolant: { title: "Radiator Coolant", description: "Check radiator coolant level and condition." },
          engine_starting_condition: { title: "Engine Starting Condition", description: "Verify engine starts correctly and runs smoothly." }
        }
      },
      transmission: {
        title: "Transmission",
        items: {
          transmission_fluid: { title: "Transmission Fluid", description: "Check transmission fluid level and condition." },
          shifting_operation: { title: "Shifting Operation", description: "Test transmission for smooth shifting." },
          clutch_operation: { title: "Clutch Operation", description: "Check clutch engagement and operation (if applicable)." },
          leaks: { title: "Leaks", description: "Check for any fluid leaks from the transmission." }
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
          airbag_system: { title: "Airbag System", description: "Check airbag warning light status (no active faults)." },
          wiper_operation: { title: "Wiper Operation", description: "Test windshield wipers and washer fluid operation." }
        }
      },
      brake_safety: {
        title: "Brake Safety",
        items: {
          emergency_brake: { title: "Emergency Brake", description: "Test emergency brake operation." },
          brake_lines: { title: "Brake Lines", description: "Inspect brake lines for leaks or damage." },
          abs_system: { title: "ABS System", description: "Check ABS warning light status." }
        }
      },
      scheduled_maintenance: {
        title: "Scheduled Maintenance",
        items: {
          oil_change: { title: "Oil Change", description: "Verify last oil change and next due." },
          filter_replacement: { title: "Filter Replacement", description: "Check air, oil, and fuel filters." },
          fluid_levels: { title: "Fluid Levels", description: "Check all essential fluid levels." }
        }
      },
      wear_items: {
        title: "Wear Items",
        items: {
          brake_pads: { title: "Brake Pads", description: "Inspect brake pad thickness." },
          tire_rotation: { title: "Tire Rotation", description: "Verify last tire rotation and next due." },
          belt_condition: { title: "Belt Condition", description: "Check condition of serpentine and other belts." }
        }
      },
      visibility: {
        title: "Visibility",
        items: {
          windshield_condition: { title: "Windshield Condition", description: "Inspect windshield for cracks or chips." },
          mirror_condition: { title: "Mirror Condition", description: "Check condition and adjustment of all mirrors." },
          window_operation: { title: "Window Operation", description: "Test operation of all windows." }
        }
      },
      restraint_systems: {
        title: "Restraint Systems",
        items: {
          seatbelt_condition: { title: "Seatbelt Condition", description: "Inspect seatbelt webbing and buckles." },
          airbag_indicators: { title: "Airbag Indicators", description: "Check status of airbag warning lights." },
          child_locks: { title: "Child Locks", description: "Test operation of child safety locks." }
        }
      },
      diagnostics: {
        title: "Diagnostics",
        items: {
          computer_scan: { title: "Computer Scan", description: "Perform a diagnostic computer scan for error codes." },
          sensor_check: { title: "Sensor Check", description: "Verify operation of key sensors." },
          emissions_test: { title: "Emissions Test", description: "Check emissions system components (if applicable)." }
        }
      },
      exterior: {
        title: "Exterior Condition",
        items: {
          dirt_and_damage: { title: "Dirt and Damage", description: "Inspect vehicle exterior for dirt accumulation and any physical damage." },
          cracks_and_damage: { title: "Cracks and Damage", description: "Inspect vehicle body for cracks, dents, and other structural damage." }
        }
      },
      other: { title: "Other" },
      tires: {
        title: "Tires",
        items: {
          tire_pressure: { 
            title: "Tire Pressure", 
            description: "Check and adjust tire pressure to recommended levels." 
          },
          tread_depth: { 
            title: "Tread Depth", 
            description: "Measure tire tread depth to ensure sufficient grip." 
          },
          wear_pattern: { 
            title: "Wear Pattern", 
            description: "Inspect tires for uneven wear patterns." 
          }
        }
      },
    },
    messages: {
      saveSuccess: "Inspection saved successfully",
      saveError: "Error saving inspection",
      exportSuccess: "Inspection exported successfully",
      exportError: "Error exporting inspection",
      completeSuccess: "Inspection marked as complete",
      completeError: "Error completing inspection",
      printStarted: "Print started",
      errorLoadingTemplate: "Error loading inspection template",
      defaultRepairDescription: "Repair task for items that failed inspection.",
      unknownItem: "Unknown Item",
      repairNeededFor: "Repair needed for",
      andMoreItems: "and {count} more items",
      pdfDownloaded: "PDF downloaded successfully",
      csvDownloaded: "CSV downloaded successfully",
      submitSuccessTitle: "Inspection Submitted",
      submitSuccessDescription: "The inspection results have been submitted successfully.",
      submitErrorTitle: "Submission Failed",
      genericSubmitError: "An error occurred while submitting the inspection. Please try again."
    },
    errors: {
      selectVehicle: "Please select a vehicle",
      completeOneItem: "Please complete at least one item",
      completeOneItemBeforeSubmit: "Please complete at least one item before submitting",
      authError: "Authentication Error",
      mustBeLoggedIn: "You must be logged in to submit an inspection",
      storageAccessError: "Storage Access Error",
      unableToAccessStorage: "Unable to access the storage system",
      creatingInspectionError: "Error Creating Inspection",
      updatingInspectionError: "Error Updating Inspection",
      photoUploadFailed: "Photo Upload Failed",
      noCompletedItems: "No Completed Items",
      genericSubmitError: "An error occurred. Please try again."
    },
    details: {
      title: "Inspection Details",
      printTitle: "Inspection Report",
      scheduledFor: "Scheduled for {date}",
      inspectionItems: "Inspection Items",
      vehicleInfoTitle: "Vehicle Information",
      overviewTitle: "Inspection Overview",
      summaryTitle: "Inspection Summary",
      summaryPassed: "Passed Items",
      summaryFailed: "Failed Items",
      summaryNotes: "Items with Notes",
      summaryPhotos: "Photos Taken",
      passRate: "Pass Rate",
      attentionRequired: "Attention Required",
      itemsNeedAttention: "{count} item{plural} need{pluralVerb} attention",
      allItemsTitle: "All Inspection Items ({count})",
      failedItemsTitle: "Failed Items ({count})",
      passedItemsTitle: "Passed Items ({count})",
      repairNeededTitle: "Items Need Repair",
      repairNeededDescription: "The following items failed inspection and require attention. Click below to schedule a maintenance task.",
      repairTaskTitle: "Post-Inspection Repair for {inspectionName} ({vehicleName})",
      photosTitle: "Photos ({count})",
      photosTabDescription: "View all photos taken during this inspection.",
      noPhotosMessage: "No photos were taken for this inspection.",
      viewPhotoAria: "View photo for {itemName}",
      photoItemAlt: "Photo for {itemName}",
      inspectionInfo: {
        title: "Inspection Information"
      },
      summary: {
        title: "Summary",
        passedItems: "Passed Items",
        failedItems: "Failed Items",
        itemsWithNotes: "Items with Notes",
        photosTaken: "Photos Taken"
      },
      items: {
        title: "Inspection Items",
        itemHeader: "Item",
        statusHeader: "Status",
        notesHeader: "Notes"
      },
      pdfFooter: {
        generatedOn: "Generated on {date}",
        vehicleName: "Vehicle: {name}"
      },
      vehicleInfo: {
        title: "Vehicle Information",
        plateNumber: "Plate Number",
        brand: "Brand",
        model: "Model",
        year: "Year",
        noImage: "No image available"
      },
      inspector: {
        title: "Inspector",
        name: "Inspector Name",
        email: "Inspector Email"
      },
      results: {
        title: "Inspection Summary",
        passedLabel: "Passed Items",
        failedLabel: "Failed Items",
        notesLabel: "Items with Notes",
        photosLabel: "Photos Taken",
        passCount: "Passed Items: {count}",
        failCount: "Failed Items: {count}",
        notesCount: "Notes Added: {count}",
        photoCount: "Photos Taken: {count}",
        completionRate: "Completion Rate",
        lastUpdated: "Last Updated",
        failedItemsFound: "Failed Items Found",
        failedItemsDescription: "The following items did not meet inspection standards.",
        allPassed: "All Items Passed",
        noFailedItems: "No failed items found in this inspection.",
        noItemsInStatus: "No items with {status} status found",
        noPassedItems: "No passed items found",
        noPendingItems: "No pending items found"
      },
      tabs: {
        details: "Details",
        failed: "Failed Items",
        passed: "Passed Items",
        photos: "Photos",
        notes: "Notes"
      },
      photosModal: {
        altText: "Inspection photo {index}",
        downloadPhoto: "Download Photo",
        counter: "{current} of {total}"
      },
      notes: {
        title: "Overall Inspection Notes"
      },
      dateLabel: "Inspection Date",
      isScheduled: "Is Scheduled",
      isScheduledDescription: "Indicates if the inspection is part of a recurring schedule.",
      overallNotes: "Overall Notes",
      overallNotesPlaceholder: "Enter any overall notes for the inspection..."
    },
    dateLabel: "Inspection Date",
    templates: {
      title: "Inspection Templates",
      itemNameLabel: "Item Name",
      addItem: "Add Item",
      deleteSectionConfirm: "Are you sure you want to delete this section?",
      requiresPhoto: "Requires Photo",
      requiresNotes: "Requires Notes",
      deleteItemConfirm: "Are you sure you want to delete this item?",
      newItemTitle: "Add New Inspection Item",
      newItemDescription: "Add a new item to this inspection section",
      itemNamePlaceholder: "Enter item name",
      itemNamePlaceholderJa: "項目名を入力（日本語）",
      itemDescriptionLabel: "Item Description",
      itemDescriptionPlaceholder: "Enter item description",
      itemDescriptionPlaceholderJa: "項目の説明を入力（日本語）",
      editSectionTitle: "Edit Section",
      editSectionDescription: "Update section information",
      sectionNameLabel: "Section Name",
      sectionDescriptionLabel: "Section Description",
      editItemTitle: "Edit Inspection Item",
      editItemDescription: "Update inspection item details",
      manageTitle: "Manage {type} Templates",
      managerDescription: "Configure and customize your {type} inspection templates. Add sections and items to streamline your inspection process.",
      managementSummary: "{count} sections configured",
      noSectionsConfigured: "No sections configured yet",
      emptyStateDescription: "This template doesn't have any sections yet. Sections help organize inspection items and make the process more efficient.",
      emptyStateNote: "Contact your administrator to configure this template.",
      addSection: "Add Section",
      newSectionTitle: "Add New Section",
      newSectionDescription: "Create a new section for this inspection template",
      sectionNamePlaceholder: "Enter section name",
      sectionNamePlaceholderJa: "セクション名を入力（日本語）",
      sectionDescriptionPlaceholder: "Enter section description",
      sectionDescriptionPlaceholderJa: "セクションの説明を入力（日本語）",
      noSections: "No sections found. Add a section to get started.",
      addItemError: "Error adding inspection item",
      addSectionSuccess: "Section added successfully",
      addSectionError: "Error adding section",
      editSectionSuccess: "Section updated successfully",
      editSectionError: "Error updating section",
      deleteSectionSuccess: "Section deleted successfully",
      deleteSectionError: "Error deleting section",
      deleteSectionErrorNotEmpty: "Cannot delete section that contains items",
      addItemSuccess: "Item added successfully",
      editItemSuccess: "Item updated successfully",
      editItemError: "Error updating item",
      deleteItemSuccess: "Item deleted successfully",
      deleteItemError: "Error deleting item",
      deleteItemErrorInUse: "Cannot delete item that is being used in inspections",
      itemNameRequired: "Item name is required in at least one language",
      sectionNameRequired: "Section name is required in at least one language",
      itemNotFound: "Item not found",
      assign: "Assign",
      tabs: {
        templates: "Templates",
        assignments: "Assignments"
      },
      assignments: {
        title: "Template Assignments",
        description: "Manage which vehicles and groups use specific inspection templates",
        templateDescription: "Configure which vehicles and groups will use the {template} inspection template",
        assignTemplateTitle: "Assign {template} Template",
        assignTemplateDescription: "Select vehicles and vehicle groups that should use the {template} template for inspections",
        manage: "Manage Assignment",
        assignedCount: "{count} assignments",
        notAssigned: "Not assigned to any vehicles or groups",
        selectVehicles: "Select Vehicles",
        selectVehiclesPlaceholder: "Choose vehicles...",
        vehiclesHelpText: "Select individual vehicles that will use this template",
        selectGroups: "Select Vehicle Groups",
        selectGroupsPlaceholder: "Choose vehicle groups...",
        groupsHelpText: "Select vehicle groups - all vehicles in these groups will use this template",
        assignedVehicles: "Assigned Vehicles",
        assignedGroups: "Assigned Vehicle Groups",
        saveSuccess: "Template assignments saved successfully",
        saveError: "Failed to save template assignments"
      },
      activation: {
        title: "Template Activation",
        activate: "Activate Template",
        deactivate: "Deactivate Template",
        activateConfirm: "Are you sure you want to activate this template?",
        deactivateConfirm: "Are you sure you want to deactivate this template?",
        activateSuccess: "Template activated successfully",
        deactivateSuccess: "Template deactivated successfully",
        activateError: "Error activating template",
        deactivateError: "Error deactivating template",
        status: "Status",
        active: "Active",
        inactive: "Inactive",
        activeDescription: "This template is currently active and available for use",
        inactiveDescription: "This template is currently inactive and hidden from users"
      },
      vehicleAssignment: {
        title: "Vehicle Assignment",
        description: "Assign this template to specific vehicles or vehicle groups",
        assignToAll: "Available to All Vehicles",
        assignToGroup: "Assign to Vehicle Group",
        assignToVehicles: "Assign to Specific Vehicles",
        selectGroup: "Select Vehicle Group",
        selectVehicles: "Select Vehicles",
        noGroupsFound: "No vehicle groups found",
        noVehiclesFound: "No vehicles found",
        createGroup: "Create Vehicle Group",
        manageGroups: "Manage Vehicle Groups",
        assignmentType: "Assignment Type",
        currentAssignments: "Current Assignments",
        noAssignments: "Not assigned to any vehicles or groups",
        assignSuccess: "Template assigned successfully",
        assignError: "Error assigning template",
        unassignSuccess: "Template unassigned successfully",
        unassignError: "Error unassigning template"
      },
      vehicleGroups: {
        title: "Vehicle Groups",
        description: "Organize vehicles into groups for easier template management",
        create: "Create Vehicle Group",
        edit: "Edit Vehicle Group",
        delete: "Delete Vehicle Group",
        name: "Group Name",
        nameDescription: "A descriptive name for this vehicle group",
        namePlaceholder: "e.g., Sedan Fleet, Delivery Trucks",
        groupDescription: "Description",
        descriptionPlaceholder: "Enter a description for this group",
        color: "Color",
        colorDescription: "Choose a color to identify this group",
        vehicles: "Vehicles",
        vehicleCount: "{count} vehicles",
        noVehicles: "No vehicles in this group",
        addVehicles: "Add Vehicles",
        removeVehicle: "Remove from Group",
        createSuccess: "Vehicle group created successfully",
        updateSuccess: "Vehicle group updated successfully",
        deleteSuccess: "Vehicle group deleted successfully",
        createError: "Error creating vehicle group",
        updateError: "Error updating vehicle group",
        deleteError: "Error deleting vehicle group",
        deleteConfirm: "Are you sure you want to delete this vehicle group?",
        deleteWarning: "This will remove the group assignment from all vehicles, but won't delete the vehicles themselves.",
        assignVehicles: "Assign Vehicles to Group",
        unassignVehicle: "Remove Vehicle from Group",
        groupAssignments: "Group Assignments",
        moveToGroup: "Move to Group",
        ungrouped: "Ungrouped Vehicles"
      },
      copyTemplate: {
        title: "Copy Template",
        description: "Create a copy of this template for specific vehicles or groups",
        copyForGroup: "Copy for Vehicle Group",
        copyForVehicle: "Copy for Specific Vehicle",
        selectTarget: "Select Target",
        copySuccess: "Template copied successfully",
        copyError: "Error copying template",
        customizeAfterCopy: "You can now customize this template for the selected target"
      },
      masterTemplate: {
        title: "Master Template",
        description: "This is a master template that can be copied and customized",
        isMaster: "Master Template",
        basedOn: "Based on: {templateName}",
        viewMaster: "View Master Template",
        customizedFor: "Customized for: {target}"
      }
    },
    photoForItem: "Photo for {itemName}"
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
    expiringQuotations: {
      title: "Expiring Quotations",
      description: "Quotations that are expiring within the next 7 days.",
      amount: "Amount",
      expiringTomorrow: "Expiring tomorrow",
      expiringInDays: "Expiring in {days} days",
      viewAll: "View All Expiring"
    },
    activityFeed: {
      title: "Activity Feed",
      description: "Recent and upcoming activities",
      noUpcoming: "No upcoming activities",
      noRecent: "No recent activities",
      viewAll: "View All Activities"
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
    vehicleStats: {
      title: "Vehicle Overview",
      description: "Quick stats about your vehicles",
      fuelLevel: "Fuel Level",
      mileage: "Mileage",
      viewAllVehicles: "View all vehicles",
      previousVehicle: "Previous vehicle",
      nextVehicle: "Next vehicle"
    },
    upcomingBookings: {
      title: "Upcoming Bookings",
      description: "Bookings pending review and assignment",
      viewAll: "View All Bookings",
      loadError: "Failed to load upcoming bookings",
      empty: {
        message: "No upcoming bookings"
      }
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
      },
      tires: {
        title: "Tires",
        items: {
          tire_pressure: { 
            title: "Tire Pressure", 
            description: "Check and adjust tire pressure to recommended levels." 
          },
          tread_depth: { 
            title: "Tread Depth", 
            description: "Measure tire tread depth to ensure sufficient grip." 
          },
          wear_pattern: { 
            title: "Wear Pattern", 
            description: "Inspect tires for uneven wear patterns." 
          }
        }
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
    noData: "No fuel log data available",
    loadingLogs: "Loading Fuel Logs..." // New key
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
    },
    loadingLogs: "Loading Mileage Logs..." // New key
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
        generate: {
          title: "Generate Custom Report",
          description: "Configure and generate a custom report.",
          button: "Generate Report",
          dialog: {
            title: "Create Custom Report",
            description: "Select options for your custom report.",
            createButton: "Create and Generate Report"
          }
        },
        customReport: {
          nameLabel: "Report Name",
          namePlaceholder: "Enter a name for your report",
          reportTypeLabel: "Report Type",
          selectTypePlaceholder: "Select report type",
          typeCombined: "Combined Summary",
          typeVehicleSummary: "Vehicle Summary",
          typeMaintenanceDetail: "Maintenance Details",
          typeFuelLog: "Fuel Usage",
          typeCostAnalysis: "Cost Breakdown",
          includeDataLabel: "Include Data Sections",
          includeVehiclesLabel: "Vehicle Information",
          includeMaintenanceLabel: "Maintenance Records",
          includeFuelLabel: "Fuel Logs",
          includeCostsLabel: "Cost Analysis",
          cancel: "Cancel"
        },
        recent: {
          title: "Recent Reports",
          description: "Recently generated and downloaded reports.",
          empty: "No recent reports found.",
          viewAll: "View All Reports"
        }
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
  schedules: {
    selectDate: "Select Date",
    tooltips: {
      immediateTaskTitle: "Create Immediate Task",
      immediateTaskDescription: "Create this task immediately, in addition to any recurring schedule."
    }
  },
  bookings: {
    title: "Bookings",
    description: "View and manage your vehicle bookings",
    backToBooking: "Back to Booking",
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
      cancelled: "Cancelled",
      assigned: "Assigned"
    },
    filters: {
      status: 'Status',
      all: 'All',
      confirmed: 'Confirmed',
      assigned: 'Assigned',
      pending: 'Pending',
      cancelled: 'Cancelled',
      completed: 'Completed',
      statusPlaceholder: 'Filter by status...',
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
        coupon: "Coupon Information",
        pricing: "Pricing Information"
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
        completed: "Completed",
        assigned: "Assigned"
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
      error: "An error occurred",
      confirmSuccess: "Booking confirmed successfully",
      confirmError: "Error confirming booking",
      createError: "Error creating booking"
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
    autoCalculateAvailable: "Auto-calculate available",
    bookingManagement: "Booking Management",
    createBooking: "Create Booking",
    confirmBooking: "Confirm Booking",
    messageCustomer: "Message Customer",
    youCanNowCreateBooking: "You can now create a booking for this service",
    invoiceMustBePaidBeforeCreatingBooking: "The invoice must be paid before creating a booking",
    createdOn: "Created on {date}",
    confirmedOn: "Confirmed on {date}",
    serviceDate: "Service Date",
    pickupTime: "Pickup Time",
    vehicle: "Vehicle",
    duration: "Duration"
  },
  dispatch: {
    title: "Real-Time Dispatch Center",
    description: "Manage assignments and track vehicles in real-time",
    assignments: {
      title: "Assignment Center", 
      description: "Manage driver and vehicle assignments for bookings",
      resourceAvailability: "Resource Availability",
      availableDrivers: "Available Drivers",
      availableVehicles: "Available Vehicles",
      pendingBookings: "Pending",
      assignedBookings: "Assigned",
      searchPlaceholder: "Search bookings by customer, booking ID...",
      allDates: "All Dates",
      today: "Today",
      thisWeek: "This Week",
      thisMonth: "This Month",
      allBookings: "All Bookings",
      unassigned: "Unassigned",
      assigned: "Assigned",
      confirmed: "Confirmed",
      unknownCustomer: "Unknown Customer",
      vehicleService: "Vehicle Service",
      driver: "Driver",
      vehicle: "Vehicle",
      smartAssign: "Smart Assign",
      viewDetails: "View Details",
      unassignAll: "Unassign All",
      smartAssignmentFor: "Smart Assignment for #{id}",
      smartAssignmentDescription: "Intelligent matching based on service requirements and vehicle capabilities",
      availableDriversCount: "Available Drivers ({count})",
      noDriversAvailable: "No drivers available",
      statusAvailable: "Available",
      vehicleRecommendations: "Vehicle Recommendations ({count})",
      noVehiclesAvailable: "No vehicles available",
      matchPercentage: "{percentage}% match",
      assign: "Assign",
      bookingDetails: "Booking Details",
      customerInformation: "Customer Information",
      serviceDetails: "Service Details",
      from: "From:",
      to: "To:",
      assignmentStatus: "Assignment Status",
      notAssigned: "Not assigned",
      actions: "Actions",
      viewFullDetails: "View Full Details",
      editBooking: "Edit Booking",
      callCustomer: "Call Customer",
      loading: "Loading assignments...",
      noBookingsFound: "No bookings found",
      noBookingsFilter: "Try adjusting your search criteria",
      noBookingsAvailable: "No bookings available for assignment",
      messages: {
        unassignSuccess: "Booking unassigned successfully",
        unassignError: "Failed to unassign booking",
        assignSuccess: "Driver and vehicle assigned successfully",
        assignError: "Failed to assign driver and vehicle",
        loadError: "Failed to load assignment data"
      }
    },
    availability: {
      title: "Availability Overview",
      availableDrivers: "Available Drivers",
      availableVehicles: "Available Vehicles", 
      totalDrivers: "Total Drivers",
      totalVehicles: "Total Vehicles",
      driverUtilization: "Driver Utilization",
      vehicleUtilization: "Vehicle Utilization",
      nextAvailable: "Next Available",
      currentlyAssigned: "Currently Assigned",
      onBreak: "On Break",
      maintenance: "In Maintenance",
      unavailable: "Unavailable"
    },
    assignment: {
      title: "Assignment Management",
      quick: "Quick Assign",
      bulk: "Bulk Assignment",
      auto: "Auto Assignment",
      manual: "Manual Assignment",
      assignDriver: "Assign Driver",
      assignVehicle: "Assign Vehicle", 
      assignBooking: "Assign Booking",
      unassign: "Unassign",
      reassign: "Reassign",
      assignmentHistory: "Assignment History",
      currentAssignments: "Current Assignments",
      availableDrivers: "Available Drivers",
      availableVehicles: "Available Vehicles",
      pendingBookings: "Pending Bookings",
      assignmentConflict: "Assignment Conflict",
      resolveConflict: "Resolve Conflict",
      autoAssignmentRules: "Auto Assignment Rules",
      oneClickAssign: "One-Click Assign",
      smartAssignModal: "Smart Assignment",
      selectResources: "Select Resources",
      assignmentPreferences: "Assignment Preferences",
      notificationSettings: "Notification Settings"
    },
    smartModal: {
      title: "Smart Assignment for Booking #{id}",
      description: "Select the best available driver and vehicle for this booking",
      driverSection: "Available Drivers",
      vehicleSection: "Available Vehicles",
      preferredDrivers: "Preferred Drivers",
      alternativeDrivers: "Alternative Drivers",
      recommendedVehicles: "Recommended Vehicles",
      alternativeVehicles: "Alternative Vehicles",
      noDriversAvailable: "No drivers available for this time slot",
      noVehiclesAvailable: "No vehicles available",
      driverScore: "Match Score",
      nextAvailableTime: "Next available: {time}",
      currentLocation: "Current location",
      estimatedTravelTime: "Est. travel time: {time}",
      compatibility: "Compatibility",
      experience: "Experience",
      rating: "Rating",
      preferences: "Preferences"
    },
    notificationOptions: {
      title: "Notification Options",
      description: "Choose how to notify assigned resources",
      emailNotification: "Email Notification",
      emailDescription: "Send email to driver and customer",
      pushNotification: "Push Notification", 
      pushDescription: "Send push notification to driver's mobile app",
      smsNotification: "SMS Notification",
      smsDescription: "Send SMS to driver's phone",
      includeCustomer: "Include Customer",
      customerDescription: "Send confirmation to customer",
      customMessage: "Custom Message",
      customMessagePlaceholder: "Add a custom message (optional)"
    },
    filters: {
      status: "Status",
      date: "Date",
      driver: "Driver", 
      vehicle: "Vehicle",
      all: "All Entries",
      location: "Location",
      zone: "Zone",
      priority: "Priority",
      serviceType: "Service Type",
      dateRange: "Date Range",
      assignmentStatus: "Assignment Status",
      bookingStatus: "Booking Status",
      customerName: "Customer Name",
      bookingId: "Booking ID",
      filterByStatus: "Filter by Status",
      filterByDate: "Filter by Date",
      filterByDriver: "Filter by Driver",
      filterByVehicle: "Filter by Vehicle",
      clearAllFilters: "Clear All Filters",
      applyFilters: "Apply Filters"
    },
    search: {
      placeholder: "Search bookings by customer name or booking ID...",
      advanced: "Advanced Search",
      quickSearch: "Quick Search",
      searchResults: "Search Results",
      noResults: "No bookings match your search criteria",
      searchByCustomer: "Search by customer name",
      searchByBookingId: "Search by booking ID",
      searchByLocation: "Search by location"
    },
    mapView: {
      title: "Map View",
      showList: "Show List",
      hideList: "Hide List",
      todaysBookings: "Today's Bookings", 
      manage: "Assignments",
      manageAssignments: "Manage Assignments",
      satellite: "Satellite",
      roadmap: "Roadmap",
      hybrid: "Hybrid",
      terrain: "Terrain",
      traffic: "Traffic",
      vehicles: "Vehicles",
      routes: "Routes",
      autoCenter: "Auto Center",
      hideTraffic: "Hide Traffic",
      centerMap: "Center Map",
      fullscreen: "Fullscreen",
      exitFullscreen: "Exit Fullscreen",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      togglePanel: "Toggle Panel",
      expandPanel: "Expand Panel",
      collapsePanel: "Collapse Panel",
      showRoute: "Show Route",
      hideRoute: "Hide Route",
      liveTracking: "Live Tracking",
      offline: "Offline"
    },
    board: {
      view: "Board View",
      title: "Dispatch Board",
      pending: "Pending",
      confirmed: "Confirmed",
      assigned: "Assigned",
      enRoute: "En Route",
      arrived: "Arrived",
      inProgress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
      addEntry: "Add Assignment"
    },
    realTimeTracking: {
      title: "Live Vehicle Tracking",
      description: "Real-time location and status of all vehicles",
      lastUpdate: "Last Update",
      batteryLevel: "Battery",
      speed: "Speed",
      heading: "Heading",
      accuracy: "Accuracy",
      moving: "Moving",
      stationary: "Stationary",
      offline: "Offline",
      online: "Online",
      noLocation: "No location data",
      deviceOffline: "Device offline",
      trackingEnabled: "Real-time tracking enabled",
      trackingDisabled: "Real-time tracking disabled"
    },
    actions: {
      assignDriver: "Assign Driver",
      assignVehicle: "Assign Vehicle",
      assignBooking: "Assign Booking",
      updateStatus: "Update Status",
      addNote: "Add Note",
      viewDetails: "View Details",
      createEntry: "Create Entry",
      editEntry: "Edit Entry",
      deleteEntry: "Delete Entry",
      assignDriverTo: "Assign Driver to Booking #{id}",
      assignVehicleTo: "Assign Vehicle to Booking #{id}",
      startTrip: "Start Trip",
      endTrip: "End Trip",
      markArrived: "Mark as Arrived",
      sendNotification: "Send Notification",
      viewOnMap: "View on Map",
      trackVehicle: "Track Vehicle",
      contactDriver: "Contact Driver",
      emergencyAlert: "Emergency Alert"
    },
    status: {
      pending: "Pending",
      assigned: "Assigned",
      confirmed: "Confirmed",
      en_route: "En Route",
      arrived: "Arrived",
      in_progress: "In Progress", 
      completed: "Completed",
      cancelled: "Cancelled",
      emergency: "Emergency"
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
      updatedAt: "Updated At",
      assignedBy: "Assigned By",
      estimatedArrival: "Estimated Arrival",
      actualArrival: "Actual Arrival",
      pickupLocation: "Pickup Location",
      dropoffLocation: "Dropoff Location",
      distance: "Distance",
      priority: "Priority",
      deviceId: "Device ID",
      lastSeen: "Last Seen",
      batteryLevel: "Battery Level"
    },
    placeholders: {
      selectDriver: "Select a driver",
      selectVehicle: "Select a vehicle",
      selectBooking: "Select a booking",
      selectStatus: "Select a status",
      enterNotes: "Enter notes about this dispatch",
      startTime: "Select start time",
      endTime: "Select end time"
    },
    messages: {
      createSuccess: "Dispatch assignment created successfully",
      updateSuccess: "Dispatch assignment updated successfully",
      deleteSuccess: "Dispatch assignment deleted successfully",
      createError: "Error creating dispatch assignment",
      updateError: "Error updating dispatch assignment",
      deleteError: "Error deleting dispatch assignment",
      driverAssigned: "Driver assigned successfully",
      vehicleAssigned: "Vehicle assigned successfully",
      vehicleUnassigned: "Vehicle unassigned successfully",
      bookingAssigned: "Booking assigned successfully",
      statusUpdated: "Status updated successfully",
      notesAdded: "Notes added successfully",
      tripStarted: "Trip started successfully",
      tripEnded: "Trip completed successfully",
      arrivedAtDestination: "Marked as arrived at destination",
      locationUpdated: "Location updated",
      trackingError: "Error updating tracking data",
      assignmentConflict: "Assignment conflict detected",
      noAvailableDrivers: "No available drivers",
      noAvailableVehicles: "No available vehicles",
      deviceConnected: "Tracking device connected",
      deviceDisconnected: "Tracking device disconnected"
    },
    empty: {
      title: "No Dispatch Assignments Found",
      description: "There are no dispatch assignments for the selected filters.",
      searchResults: "No dispatch assignments match your search criteria.",
      noVehiclesOnline: "No vehicles are currently online",
      noActiveAssignments: "No active assignments"
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
    details: {
      title: "Assignment Details",
      bookingDetails: "Booking Details",
      driverDetails: "Driver Details",
      vehicleDetails: "Vehicle Details",
      trackingDetails: "Tracking Details",
      statusHistory: "Status History",
      notes: "Assignment Notes",
      timeline: "Trip Timeline",
      route: "Route Information",
      performance: "Performance Metrics"
    },
    timelineView: {
      title: "Dispatch Timeline",
      scale: "Scale",
      hour: "Hour",
      day: "Day",
      week: "Week",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out"
    },
    notifications: {
      newAssignment: "New assignment created",
      statusChanged: "Assignment status changed",
      vehicleArrived: "Vehicle arrived at destination",
      tripStarted: "Trip started",
      tripCompleted: "Trip completed",
      emergencyAlert: "Emergency alert",
      deviceOffline: "Tracking device offline",
      deviceOnline: "Tracking device online",
      assignmentOverdue: "Assignment overdue"
    },
    tracking: {
      devices: "Tracking Devices",
      setupDevice: "Setup Device",
      deviceStatus: "Device Status",
      lastLocation: "Last Location",
      route: "Route",
      geofence: "Geofence",
      alerts: "Tracking Alerts",
      history: "Location History",
      playback: "Route Playback"
    }
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
      pricing: "Pricing",
      assignments: "Assignments",
      save: "Save Changes"
    },
    templates: {
      title: "Inspection Templates",
      description: "Manage the structure (sections and items) of your inspection forms.",
      manageTitle: "Manage {type} Templates",
      managerDescription: "Configure and customize your {type} inspection templates. Add sections and items to streamline your inspection process.",
      createSuccess: "Template type created successfully",
      createError: "Failed to create template type",
      nameRequired: "Template name is required",
      slugRequired: "Template slug is required",
      invalidSlug: "Invalid slug format. Use only lowercase letters, numbers, and hyphens",
      slugExists: "This slug already exists. Please use a different one",
      add: "Add Template Type",
      addTemplate: "Add New Template Type",
      addTemplateDescription: "Create a new inspection template type",
      templateName: "Template Name",
      templateNamePlaceholder: "Enter template name in English",
      templateNamePlaceholderJa: "テンプレート名を日本語で入力",
      templateSlug: "Template Slug",
      templateSlugPlaceholder: "Enter URL-friendly identifier",
      templateSlugDescription: "Lowercase letters, numbers, and hyphens only",
      duplicate: "Duplicate Template",
      duplicateTemplate: "Duplicate Template",
      duplicateSuccess: "Template duplicated successfully",
      duplicateError: "Failed to duplicate template",
      deleteTemplate: "Delete Template",
      deleteTemplateConfirm: "Are you sure you want to delete this template? This action cannot be undone.",
      deleteSuccess: "Template deleted successfully",
      deleteError: "Failed to delete template"
    },
    tabs: {
      profile: "Profile",
      preferences: "Preferences",
      menu: "Menu",
      templates: "Templates",
      account: "Account",
      notifications: "Notifications",
      security: "Security",
      localization: "Language & Region",
      data: "Data Management"
    },
    selectTemplate: "Select template type",
    inspectionTypes: {
      routine: "Routine Inspection",
      safety: "Safety Inspection", 
      maintenance: "Maintenance Inspection",
      daily: "Daily Inspection",
      test: "Test Inspection",
      select: "Select Inspection Type",
      description: {
        routine: "Regular periodic inspection of vehicle components",
        safety: "Comprehensive safety system evaluation",
        maintenance: "Detailed mechanical system inspection",
        daily: "Daily inspection checklist",
        test: "Test inspection template"
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
    edit: {
      title: "Edit Quotation",
      description: "Modify the quotation details"
    },
    view: "View Quotation",
    viewAll: "View All Quotations",
    duplicate: "Duplicate",
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
      previewSection: "Preview & Send",
      saveAsDraft: "Save as Draft",
      sendToCustomer: "Send to Customer",
      title: "Title",
      error: "Error",
      errorAddingService: "Failed to add service. Please try again.",
      errorUpdatingService: "Failed to update service. Please try again.",
      serviceAdded: "Service Added",
      serviceAddedDescription: "Service has been added to the quotation successfully.",
      placeholders: {
        title: "Enter a title for this quotation",
        customerName: "Enter customer name",
        customerEmail: "Enter customer email",
        customerPhone: "Enter customer phone number",
        merchantNotes: "Internal notes (only visible to you)",
        customerNotes: "Notes for the customer (visible to customer)",
        companyName: "Enter company name",
        taxNumber: "Enter tax number or VAT ID",
        streetName: "Enter street name",
        streetNumber: "Enter street number or building",
        city: "Enter city",
        state: "Enter state or province",
        postalCode: "Enter postal or ZIP code",
        country: "Enter country"
      },
      customerName: "Customer Name",
      customerEmail: "Customer Email",
      customerPhone: "Customer Phone",
      discountPercentage: "Discount Percentage",
      taxPercentage: "Tax Percentage",
      merchantNotes: "Internal Notes",
      customerNotes: "Customer Notes",
      serviceUpdated: "Service Updated",
      serviceUpdatedDescription: "The service details have been updated successfully.",
      currencySettings: "Currency Settings",
      estimatedPricing: "Estimated Pricing",
      services: {
        individual: "Individual Services",
        configure: "Configure custom services",
        configureService: "Configure Service",
        addService: "Add This Service",
        addAnotherService: "Add Another Service",
        selectedServices: "Selected Services",
        noServicesAdded: "No services added yet. Add your first service using the button below.",
        serviceType: "Service Type",
        vehicleCategory: "Vehicle Category",
        vehicleType: "Vehicle Type",
        serviceDays: "Service Days",
        hoursPerDay: "Hours Per Day",
        serviceDateTime: "Service Date & Time",
        packageDateTime: "Package Date & Time",
        date: "Date",
        time: "Time",
        pickDate: "Pick date",
        days: "Days",
        hours: "Hours",
        duration: "Duration",
        active: "Active",
        orSeparator: "OR",
        editService: "Edit Service",
        updateService: "Update Service",
        cancelEdit: "Cancel Edit",
        removeService: "Remove Service",
        duplicateService: "Duplicate Service",
        packageIncludes: "Package Includes:",
        allServicesAtPackageRate: "All services at package rate",
        timeBasedPricingAdjustments: "Time-based pricing adjustments",
        servicesIncluded: "{count} service{plural} included",
        basePrice: "Base Price",
        timeAdjustment: "Time Adjustment",
        total: "Total",
        pickupDate: "Pickup Date",
        pickupTime: "Pickup Time",
        vehicle: "Vehicle",
        unitPrice: "Unit Price"
      },
      pricingTabs: {
        basic: "Basic Pricing",
        packages: "Packages",
        promotions: "Promotions",
        timepricing: "Time-based Pricing"
      },
      packages: {
        title: "Available Packages",
        selected: "Selected",
        featured: "Featured",
        includes: "Package includes:",
        packageIncludes: "Package Includes:",
        noPackages: "No packages available",
        select: "Select Package",
        packagePrice: "Package Price",
        packagesCount: "packages",
        moreItems: "more items",
        selectToSeePricing: "Select services or a package to see pricing",
        addThisPackage: "Add This Package",
        allServicesAtPackageRate: "All services at package rate",
        timeBasedPricingAdjustments: "Time-based pricing adjustments",
        servicesIncluded: "{count} service{plural} included"
      },
      promotions: {
        title: "Promotions",
        description: "Manage promotional codes and discounts",
        create: "Create Promotion",
        createSuccess: "Promotion created successfully",
        createError: "Failed to create promotion",
        updateSuccess: "Promotion updated successfully",
        updateSuccessDescription: "The promotion has been updated",
        updateError: "Failed to update promotion",
        deleteSuccess: "Promotion deleted successfully",
        deleteSuccessDescription: "The promotion has been removed",
        deleteError: "Failed to delete promotion"
      },
      timePricing: {
        title: "Time-based Pricing",
        automatic: "Automatic Time-based Adjustments",
        description: "Time-based pricing rules are automatically applied based on your pickup date and time.",
        features: {
          peakHours: "Peak hours (morning/evening rush)",
          nightSurcharge: "Night surcharges (late evening/early morning)",
          weekendPricing: "Weekend pricing adjustments",
          holidayPricing: "Holiday and special event periods"
        },
        status: {
          title: "Current status",
          active: "Time-based rules will be applied automatically",
          inactive: "Set pickup date and time to apply time-based pricing"
        },
        howItWorks: {
          title: "How it works",
          description: "When you set a pickup date and time, our system automatically checks for applicable time-based pricing rules and applies the appropriate adjustments to your base price. The adjusted price is reflected in the final quotation."
        }
      },
      steps: {
        customerDetails: "Customer Details",
        serviceVehicle: "Service & Vehicle",
        pricingOptions: "Pricing & Options",
        notes: "Notes",
        previewSend: "Preview & Send"
      },
      stepTitles: {
        customerDetails: "Customer Details",
        serviceVehicle: "Service & Vehicle", 
        pricingOptions: "Pricing & Options",
        notes: "Notes",
        previewSend: "Preview & Send"
      },
      billing: {
        title: "Billing Information",
        optional: "Optional",
        companyName: "Company Name",
        taxNumber: "Tax Number / VAT ID",
        streetName: "Street Name",
        streetNumber: "Street Number / Building",
        city: "City",
        state: "State / Province",
        postalCode: "Postal / ZIP Code",
        country: "Country",
        address: "Address",
        billingInformation: "Billing Information (Optional)"
      },
      descriptions: {
        merchantNotes: "Internal notes, not visible to the customer.",
        customerNotes: "Notes visible to the customer on the quotation."
      },
      previewDescription: "Please review all details carefully before sending the quotation to the customer.",
      preview: {
        quotationOverview: "Quotation Overview",
        selectedPackage: "Selected Package",
        packageIncludes: "Package includes:",
        packageTotal: "Package Total:",
        includedServices: "Included Services",
        serviceDetails: "Service Details",
        timeBasedAdjustments: "Time-based Pricing Adjustments",
        baseDuration: "Base Duration",
        basePrice: "Base Price",
        totalHours: "Total Hours",
        overtimeHours: "Overtime Hours",
        adjustment: "Adjustment",
        finalPrice: "Final:",
        totalTimeBasedAdjustment: "Total Time-based Adjustment:",
        appliedToServices: "Applied to {count} service(s)",
        readyToSend: "Ready to Send",
        reviewMessage: "Please review all information above before sending this quotation to the customer. Once sent, they will receive an email with the quotation details and a link to view or respond.",
        pricingSummary: "Pricing Summary",
        appliedPromotion: "Applied Promotion",
        afterDiscount: "After Discount",
        totalSavings: "Total Savings:",
        currency: "Currency:",
        finalReview: "Final Review"
      }
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
      deleteConfirmation: "Are you sure you want to delete this quotation?",
      error: "Error",
      success: "Success",
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
      quotationSummary: "Quotation Summary",
      customerInfo: "Customer Information",
      contactInfo: "Contact Information",
      primaryContact: "Primary contact information",
      customerName: "Customer Name",
      email: "Email Address",
      phone: "Phone Number",
      billingAddress: "Billing Address",
      invoicingDetails: "Billing and invoicing details",
      companyName: "Company Name",
      address: "Address",
      taxId: "Tax ID",
      noBillingInfo: "No billing information provided",
      noBillingAddress: "No billing address information provided for this quotation",
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
      pricingFeatures: "Pricing Features",
      timeBasedPricing: "Time-Based Pricing",
      adjustment: "Adjustment",
      timeBasedNote: "Applied based on pickup time and date",
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
      packageSelected: "Package Selected",
      packagePrice: "Package Price",
      includedServices: "Included Services",
      moreServices: "more services",
      promotionApplied: "Promotion Applied",
      discount: "Discount",
      // New enhanced details translations
      serviceConfiguration: "Service configuration and details",
      serviceDuration: "Service Duration",
      total: "total",
      passengerCount: "Passenger Count",
      serviceSchedule: "Service schedule and timing",
      serviceDescription: "Service Description",
      multipleServices: "Multiple Services Requested",
      multipleServicesDesc: "{count} services included in this quotation",
      services: "services",
      charter: "Charter",
      transfer: "Transfer", 
      daysShort: "d",
      hoursShort: "h",
      servicePrice: "Service Price",
      charterHourly: "Charter Services (Hourly)",
      mercedesVClass: "Mercedes Benz V Class",
      specialOffer: "Special package deal with savings",
      discountApplied: "Discount successfully applied",
      validPeriod: "Valid period",
      automaticAdjustments: "Automatic pricing adjustments based on time",
      approvalPanel: {
        title: "Quotation Approval",
        approveButton: "Approve Quotation",
        rejectButton: "Reject Quotation",
        approveConfirmation: "Are you sure you want to approve this quotation?",
        rejectConfirmation: "Are you sure you want to reject this quotation?",
        description: "Review this quotation and either approve to proceed or reject with detailed feedback.",
        approveDescription: "Review this quotation and approve to proceed with the booking.",
        rejectDescription: "Review this quotation and reject with detailed feedback.",
        notesLabel: "Notes (Optional)",
        notesPlaceholder: "Add any notes or comments about your decision",
        reasonLabel: "Reason for Rejection",
        reasonPlaceholder: "Please provide a reason for rejecting this quotation",
        approvalSuccess: "Quotation approved successfully",
        rejectionSuccess: "Quotation rejected successfully"
      },
      pricingSummary: "Pricing Summary",
      pricingBreakdown: "Pricing Breakdown", 
      detailedBreakdown: "Detailed Breakdown",
      selectedServices: "Selected Services",
      subtotal: "Subtotal",
      totalAmount: "Total Amount",
      activityFeed: "Activity Feed",
      // Additional details translations
      vehicle: "Vehicle",
      date: "Date",
      time: "Time",
      timeAdjustment: "Time Adjustment",
      overtime: "Overtime",
      packageService: "Package Service",
      servicesBaseTotal: "Services Base Total",
      timeBasedAdjustments: "Time-based Adjustments",
      packageTotal: "Package Total",
      promotionDiscount: "Promotion Discount",
      regularDiscount: "Regular Discount",
      quotationInfoStatus: "Quotation Info Status",
      finalPricingBreakdown: "Final pricing breakdown"
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
      copy: "Copy",
      duplicate: "Duplicate",
      remind: "Send Reminder",
      print: "Print",
      download: "Download PDF",
      downloadPdf: "Download PDF",
      email: "Email Quotation",
      emailQuote: "Email Quotation",
      generating: "Generating..."
    },
    emailDescription: "Send the quotation as a PDF attachment to the customer's email address.",
    includeDetails: "Include quotation details",
    emailModal: {
      title: "Send Quotation by Email",
      description: "Send this quotation to the customer via email",
      emailLabel: "Customer Email",
      emailPlaceholder: "Enter customer email address",
      subjectLabel: "Email Subject",
      messageLabel: "Additional Message (Optional)",
      messagePlaceholder: "Add a personal message to the customer",
      sendButton: "Send Email",
      cancelButton: "Cancel"
    },
    editSection: {
      title: "Edit Quotation",
      description: "Modify the quotation details",
      notEditable: "This quotation cannot be edited",
      notEditableDescription: "Only quotations in Draft or Sent status can be edited."
    },
    pricingSummary: "Pricing Summary",
    pricingBreakdown: "Pricing Breakdown", 
    detailedBreakdown: "Detailed Breakdown",
    selectedServices: "Selected Services",
    subtotal: "Subtotal",
    totalAmount: "Total Amount",
    activityFeed: "Activity Feed",
    empty: {
      title: "No Quotations Yet",
      description: "There are no quotations in the system.",
      noResultsTitle: "No Quotations Found",
      noResultsDescription: "We couldn't find any quotations matching your filters.",
      clearFilters: "Clear Filters",
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
    tabs: {
      categories: "Categories",
      items: "Items",
      serviceTypes: "Service Types",
      timeBasedPricing: "Time-based Pricing",
      promotions: "Promotions",
      packages: "Packages"
    },
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
      deleteError: "Failed to delete category",
      deleteConfirmTitle: "Delete Category?",
      deleteConfirmDescription: "This action cannot be undone. This will permanently delete this pricing category and may affect existing pricing items.",
      activateConfirmTitle: "Activate Category?",
      activateConfirmDescription: "This will make the category visible and available for selection.",
      deactivateConfirmTitle: "Deactivate Category?",
      deactivateConfirmDescription: "This will hide the category from selection in new quotations and pricing forms.",
      toast: {
        serviceTypesFixedTitle: "Service Types Fixed",
        serviceTypesFixedDescription: "Successfully updated {count} categories.",
        fixServiceTypesError: "Failed to fix service types",
        nameRequiredError: "Category name is required",
        vehiclesUpdated: "Vehicles updated successfully",
        vehiclesUpdateError: "Failed to update vehicles"
      },
      buttons: {
        fixServiceTypes: "Fix Service Types",
        addCategory: "Add Category"
      },
      emptyState: "No pricing categories found. Create your first category.",
      table: {
        id: "ID",
        details: "Details",
        services: "Services",
        status: "Status",
        order: "Order",
      },
      editDialog: {
        title: "Edit Category",
        description: "Edit the details of this pricing category"
      },
      createDialog: {
        title: "Add New Category",
        description: "Create a new pricing category for your services"
      },
      deleteDialog: {
        title: "Delete Category?",
        description: "This action cannot be undone. This will permanently delete this pricing category and may affect existing pricing items."
      },
      activateDialog: {
        title: "Activate Category?",
        description: "This will make the category visible and available for selection."
      },
      deactivateDialog: {
        title: "Deactivate Category?",
        description: "This will hide the category from selection in new quotations and pricing forms."
      },
      fields: {
        name: "Category Name",
        descriptionOptional: "Description (Optional)",
        sortOrder: "Display Order",
        isActive: "Active",
        serviceTypes: "Service Types"
      },
      placeholders: {
        name: "Enter category name",
        description: "Enter category description"
      },
      linkDialog: {
        title: "Manage Service Types for {categoryName}",
        description: "Link or unlink service types from this category.",
        available: "Available Service Types",
        linked: "Linked Service Types",
        unlink: "Unlink",
        saveLinks: "Save Links",
        noLinkedServiceTypes: "No service types linked yet.",
        noSelectedServiceTypes: "No service types selected."
      },
      actions: {
        manageVehicles: "Manage Vehicles"
      },
      vehicleDialog: {
        title: "Manage Vehicles for {categoryName}",
        description: "Link or unlink vehicles from this category.",
        available: "Available Vehicles",
        selected: "Selected Vehicles",
        noVehicles: "No vehicles available",
        save: "Save Vehicles"
      },
      toast: {
        vehiclesUpdated: "Vehicles updated successfully",
        vehiclesUpdateError: "Failed to update vehicles",
        vehiclesLoaded: "Vehicles loaded successfully",
        vehiclesLoadError: "Failed to load vehicles"
      }
    },
    items: {
      title: "Pricing Items",
      description: "Manage individual pricing items for selected category",
      active: "Active",
      inactive: "Inactive",
      toast: {
        fetchFailed: "Failed to fetch pricing items",
        initialLoadFailed: "Failed to load initial categories/services for pricing setup",
        saveFailed: "Failed to save pricing item",
        deleteFailed: "Failed to delete pricing item",
        statusToggleFailed: "Failed to toggle item status",
        deleteSuccess: "Pricing item deleted successfully",
        statusUpdateSuccess: "Item status updated successfully"
      },
      errors: {
        categoryRequired: "Category is required for pricing item",
        serviceTypeRequired: "Service type is required for pricing item",
        priceRequired: "Price is required and must be a valid number"
      },
      filters: {
        title: "Filters & Actions",
        categoryLabel: "Pricing Category",
        categoryPlaceholder: "Select category",
        noCategoriesAvailable: "No categories available",
        selectCategoryPrompt: "Please select a category to see items.",
        noCategoriesFound: "No pricing categories exist. Please create one first.",
        durationLabel: "Duration",
        durationPlaceholder: "Filter by duration",
        allDurations: "All Durations",
        customDuration: "Custom Duration",
        customDurationLabel: "Custom Duration (hours)",
        customDurationPlaceholder: "Enter hours"
      },
      buttons: {
        addNew: "Add New Pricing Item",
        addItemToCategory: "Add Item to {categoryName}"
      },
      emptyState: {
        selectCategory: "Please select a pricing category to view or add items.",
        selectCategoryPrompt: "Select a category above to manage its pricing items.",
        noItemsFound: "No pricing items found for the selected category/filters."
      },
      loadingItemsFor: "Loading pricing items for {categoryName}...",
      table: {
        serviceType: "Service Type",
        durationHours: "Duration (hrs)",
        price: "Price",
        status: "Status"
      },
      dialog: {
        createTitle: "Create New Pricing Item",
        editTitle: "Edit Pricing Item",
        descriptionCreate: "Add a new pricing item to the selected category.",
        descriptionEdit: "Edit the details of this pricing item.",
        serviceTypeLabel: "Service Type",
        serviceTypePlaceholder: "Select service type",
        noServiceTypesInCategory: "Selected category has no service types. Edit category to add them.",
        durationLabel: "Duration (Hours)",
        durationPlaceholder: "Select or enter duration",
        customDurationLabel: "Custom Duration (Hours)",
        priceLabel: "Price",
        currencyLabel: "Currency",
        statusLabel: "Status",
        commentsLabel: "Comments (Optional)",
        commentsPlaceholder: "Internal notes about this pricing item"
      },
      deleteDialog: {
        title: "Delete Pricing Item?",
        description: "This action cannot be undone. This will permanently delete this pricing item."
      },
      statusDialog: {
        activateTitle: "Activate Pricing Item?",
        activateDescription: "This item will become available for use in quotations.",
        deactivateTitle: "Deactivate Pricing Item?",
        deactivateDescription: "This item will be hidden and cannot be used in new quotations."
      },
      durations: { // For dynamic duration options
        hour: "{count} hour",
        hours: "{count} hours",
        day: "{count} day",
        days: "{count} days" 
      },
      timeBasedPricing: {
        title: "Time-Based Pricing Rules",
        description: "Define rules to adjust pricing based on time of day or week.",
        allCategories: "All Categories",
        createSuccess: "Time-based pricing rule created successfully",
        updateSuccess: "Time-based pricing rule updated successfully", 
        deleteSuccess: "Time-based pricing rule deleted successfully",
        addRule: "Add New Time-Based Rule",
        editRule: "Edit Time-based Rule",
        deleteRule: "Delete Time-based Rule",
        deleteRuleConfirm: "Are you sure you want to delete this time-based pricing rule? This action cannot be undone.",
        ruleName: "Rule Name",
        ruleNamePlaceholder: "e.g., Night Surcharge",
        startTime: "Start Time",
        endTime: "End Time",
        adjustmentPercentage: "Adjustment Percentage (%)",
        categoryLabel: "Category (Optional)",
        serviceTypeLabel: "Service Type (Optional)",
        allServiceTypes: "All Service Types in Category",
        priority: "Priority",
        active: "Active",
        toast: {
          fetchFailed: "Failed to load time-based pricing rules",
          saveSuccess: "Rule saved successfully",
          saveFailed: "Failed to save rule",
          deleteSuccess: "Rule deleted successfully",
          deleteFailed: "Failed to delete rule"
        },
        filters: {
          categoryLabel: "Filter by Category",
          allCategoriesPlaceholder: "All Categories",
          allCategories: "All Categories"
        },
        buttons: {
          addRule: "Add New Rule"
        },
        emptyState: {
          noRulesForCategory: "No time-based rules found for this category.",
          selectCategoryOrAddRule: "Select a category to view rules, or add a new global rule."
        },
        table: {
          ruleName: "Rule Name",
          appliesTo: "Applies To",
          timeRange: "Time Range",
          days: "Days",
          adjustment: "Adjustment",
          priority: "Priority",
          status: "Status"
        },
        days: {
          sunday: "Sunday",
          monday: "Monday",
          tuesday: "Tuesday",
          wednesday: "Wednesday",
          thursday: "Thursday",
          friday: "Friday",
          saturday: "Saturday",
          all: "All Days",
          weekdays: "Weekdays",
          weekends: "Weekends"
        }
      }
    },
    promotions: {
      title: "Promotions",
      description: "Manage promotional codes and discounts",
      create: "Create Promotion",
      createSuccess: "Promotion created successfully",
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
      addPackage: "Add Package",
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
  },
  invoices: {
    title: "Invoices",
    description: "Manage and track customer invoices",
    invoiceManagement: "Invoice Management",
    createInvoice: "Create Invoice",
    noInvoiceCreatedYet: "No Invoice Created Yet",
    createInvoiceToSendPayment: "Create an invoice to send to the customer for payment",
    sendInvoiceWithPaymentLink: "Send Invoice with Payment Link",
    downloadPDF: "Download PDF",
    markAsPaid: "Mark as Paid",
    status: {
      created: "Created",
      sent: "Sent",
      paid: "Paid",
      payment_failed: "Payment Failed",
      payment_expired: "Payment Expired",
      payment_cancelled: "Payment Cancelled"
    },
    messages: {
      createSuccess: "Invoice created successfully",
      createError: "Error creating invoice",
      sendSuccess: "Invoice sent successfully",
      sendError: "Error sending invoice",
      markPaidSuccess: "Invoice marked as paid",
      markPaidError: "Error marking invoice as paid"
    }
  },
  
  payments: {
    title: "Payments",
    description: "Track and process customer payments",
    paymentLinkGenerated: "Payment Link Generated",
    shareWithCustomer: "Share this link with your customer to collect payment",
    regeneratePaymentLink: "Regenerate Payment Link",
    paymentRequired: "Payment Required",
    paymentConfirmed: "Payment Confirmed",
    messages: {
      regenerateSuccess: "Payment link regenerated successfully",
      regenerateError: "Error regenerating payment link"
    }
  },
  tabs: {
    overview: "Overview",
    assignedVehicles: "Assigned Vehicles",
    inspections: "Inspections",
    activityLog: "Activity Log",
    notes: "Notes",
    settings: "Settings"
  },
  activityLog: {
    title: "Activity Log",
    description: "View all activities for this driver"
  },

  errors: {
    failedToLoadData: "Failed to load {entity}",
    pleaseTryAgainLater: "Please try again later."
  },

  vehicleGroups: {
    title: "Vehicle Groups",
    noGroups: "No vehicle groups found",
    allGroups: "All Groups",
    filter: "Filter by Group"
  },

  inspectionTemplates: {
    title: "Inspection Templates",
    description: "Manage inspection templates and assignments",
    createTemplate: "Create Template",
    editTemplate: "Edit Template",
    duplicateTemplate: "Duplicate Template",
    deleteTemplate: "Delete Template",
    renameTemplate: "Rename Template",
    templateType: "Template Type",
    templateName: "Template Name",
    newTemplateName: "New Template Name",
    newTemplateType: "New Template Type",
    searchTemplates: "Search templates by type...",
    noTemplatesFound: "No templates found",
    noTemplatesDescription: "Get started by creating your first inspection template.",
    noSearchResults: "No templates match your search criteria.",
    addSection: "Add Section",
    
    template: {
      sections: "sections",
      items: "items", 
      vehicles: "vehicles",
      groups: "groups",
      active: "Active",
      inactive: "Inactive"
    },

    assignment: {
      title: "Template Assignments",
      description: "Assign templates to vehicles or groups",
      vehicleGroups: "Vehicle Groups",
      individualVehicles: "Individual Vehicles",
      addGroup: "Add Group",
      noGroupsAvailable: "No vehicle groups available",
      noVehiclesAvailable: "No vehicles available",
      assignSuccess: "Template assigned successfully",
      unassignSuccess: "Template unassigned successfully",
      assignError: "Failed to assign template",
      unassignError: "Failed to unassign template"
    },

    sections: {
      title: "Template Sections",
      addSection: "Add Section",
      editSection: "Edit Section",
      deleteSection: "Delete Section",
      deleteSections: "Delete {count} sections",
      sectionName: "Section Name",
      sectionDescription: "Section Description",
      activeSection: "Active Section",
      unnamedSection: "Unnamed Section",
      noItemsInSection: "No items in this section",
      orderNumber: "Order Number"
    },

    items: {
      addItem: "Add Item",
      editItem: "Edit Item", 
      deleteItem: "Delete Item",
      itemName: "Item Name",
      itemDescription: "Item Description",
      requiresPhoto: "Requires Photo",
      requiresNotes: "Requires Notes",
      photo: "Photo",
      notes: "Notes",
      unnamedItem: "Unnamed Item",
      manageItems: "Manage Items"
    },

    groups: {
      title: "Vehicle Groups",
      create: "Create Vehicle Group",
      edit: "Edit Vehicle Group",
      delete: "Delete Vehicle Group",
      manage: "Manage Vehicles",
      groupName: "Group Name",
      groupDescription: "Description",
      groupColor: "Color",
      noGroups: "No vehicle groups found",
      vehicleCount: "{count} vehicles",
      addVehicles: "Add Vehicles",
      removeVehicles: "Remove Vehicles",
      manageVehiclesInGroup: "Manage Vehicles in Group",
      vehiclesInGroup: "Vehicles in Group",
      availableVehicles: "Available Vehicles",
      ungroupedVehicles: "Ungrouped Vehicles",
      groupColorDescription: "Choose a color to identify this group"
    },

    dialogs: {
      createTemplate: {
        title: "Create New Template",
        description: "Create a new inspection template type",
        templateTypePlaceholder: "e.g., routine, safety, maintenance"
      },
      
      editTemplate: {
        title: "Rename Template",
        description: "Change the template type name",
        currentName: "Current Name",
        newName: "New Name"
      },

      duplicateTemplate: {
        title: "Duplicate Template",
        description: "Create a copy of this template",
        sourceTemplate: "Source Template",
        targetType: "New Template Type",
        targetTypePlaceholder: "Enter new template type name"
      },

      deleteConfirm: {
        title: "Delete {type}?",
        template: "Delete Template \"{name}\"?",
        section: "Delete Section \"{name}\"?",
        item: "Delete Item \"{name}\"?",
        templateDescription: "This will permanently delete all {sections} sections and {items} items in this template. This action cannot be undone.",
        sectionDescription: "This will permanently delete this section and all {items} items within it. This action cannot be undone.",
        itemDescription: "This will permanently delete this inspection item. This action cannot be undone.",
        cannotBeUndone: "This action cannot be undone."
      },

      section: {
        create: "Create New Section",
        edit: "Edit Section",
        nameEn: "Name (English)",
        nameJa: "Name (Japanese)",
        nameEnPlaceholder: "e.g., Engine Check",
        nameJaPlaceholder: "e.g., エンジン点検",
        descriptionEn: "Description (English)",
        descriptionJa: "Description (Japanese)",
        isActive: "Active Section"
      },

      vehicleGroup: {
        create: "Create Vehicle Group", 
        edit: "Edit Vehicle Group",
        name: "Group Name",
        namePlaceholder: "e.g., Delivery Trucks",
        description: "Description",
        descriptionPlaceholder: "Optional description",
        color: "Color",
        selectColor: "Select group color"
      },

      manageVehicles: {
        title: "Manage Vehicles in {groupName}",
        description: "Add or remove vehicles from this group",
        currentVehicles: "Current Vehicles ({count})",
        availableVehicles: "Available Vehicles",
        noCurrentVehicles: "No vehicles in this group",
        noAvailableVehicles: "No vehicles available to add",
        addSelected: "Add Selected",
        removeSelected: "Remove Selected"
      }
    },

    actions: {
      showAssignments: "Show Assignments",
      hideAssignments: "Hide Assignments",
      selectAll: "Select All",
      deselectAll: "Deselect All",
      bulkDelete: "Bulk Delete"
    },

    messages: {
      templateCreated: "Template created successfully",
      templateRenamed: "Template renamed successfully",
      templateDuplicated: "Template duplicated successfully",
      templateDeleted: "Template deleted successfully",
      sectionCreated: "Section created successfully",
      sectionUpdated: "Section updated successfully",
      sectionDeleted: "Section deleted successfully",
              sectionsDeleted: "{count} sections deleted successfully",
        sectionsReordered: "Sections reordered successfully",
        vehicleGroupCreated: "Vehicle group created successfully",
        vehicleGroupUpdated: "Vehicle group updated successfully",
        vehicleGroupDeleted: "Vehicle group deleted successfully",
        itemCreated: "Item created successfully",
        itemAdded: "Item added successfully",
        itemUpdated: "Item updated successfully",
        itemDeleted: "Item deleted successfully",
        itemsReordered: "Items reordered successfully",
        vehiclesAdded: "{count} vehicles added to group",
        vehiclesRemoved: "{count} vehicles removed from group",
      
            errors: {
        templateNameRequired: "Template type is required",
        sectionNameRequired: "Section name (English) is required",
        groupNameRequired: "Group name is required",
        templateCreateFailed: "Failed to create template",
        templateUpdateFailed: "Failed to update template",
        templateDeleteFailed: "Failed to delete template",
        templateDuplicateFailed: "Failed to duplicate template",
        sectionCreateFailed: "Failed to create section",
        sectionUpdateFailed: "Failed to update section",
        sectionDeleteFailed: "Failed to delete section",
        itemCreateFailed: "Failed to create item",
        itemAddFailed: "Failed to add item",
        itemUpdateFailed: "Failed to update item",
        itemDeleteFailed: "Failed to delete item",
        vehicleGroupCreateFailed: "Failed to create vehicle group",
        vehicleGroupUpdateFailed: "Failed to update vehicle group", 
        vehicleGroupDeleteFailed: "Failed to delete vehicle group",
        vehicleGroupHasAssignments: "Cannot delete group with active template assignments",
        loadTemplatesFailed: "Failed to load templates",
        loadVehiclesFailed: "Failed to load vehicles",
        loadAssignmentsFailed: "Failed to load assignments",
        assignmentFailed: "Failed to update assignment",
        reorderFailed: "Failed to reorder items",
        deleteMultipleFailed: "Failed to delete multiple sections",
        partialDeleteSuccess: "Some sections were deleted successfully"
      },

      confirmations: {
        noSectionsSelected: "No sections selected for deletion",
        deleteMultipleSections: "Are you sure you want to delete {count} sections? This will also delete all items in these sections.",
        deleteTemplate: "Are you sure you want to delete this template? This will delete all sections and items.",
        deleteSection: "Are you sure you want to delete this section? This will delete all items in this section.",
        deleteItem: "Are you sure you want to delete this item?",
        deleteVehicleGroup: "Are you sure you want to delete this vehicle group?"
      },

      mobile: {
        showAssignments: "Assignments",
        showSections: "Sections",
        backToTemplates: "Back to Templates",
        templateInfo: "Template Info",
        assignTo: "Assign To",
        manageItems: "Manage Items"
      }
    },

    // Additional inspection keys needed for components
    inspections: {
      title: "Inspections",
      description: "Manage and track vehicle inspections",
      createInspection: "Create Inspection",
      noInspections: "No inspections found",
      dateLabel: "Date",
      typeLabel: "Type",
      statusLabel: "Status",
      inspectorLabel: "Inspector",
      inspectorEmailLabel: "Inspector Email",
      unnamedInspection: "Unnamed Inspection",
      noVehicle: "No Vehicle",
      noVehicleAssigned: "No vehicle assigned to this inspection",
      searchPlaceholder: "Search by vehicle, plate number, or type...",
      defaultType: "General Inspection",
      
      fields: {
        vehicle: "Vehicle",
        type: "Type",
        date: "Date",
        status: "Status",
        inspector: "Inspector"
      },

      type: {
        routine: "Routine Inspection",
        safety: "Safety Inspection",
        maintenance: "Maintenance Inspection",
        daily: "Daily Inspection",
        test: "Test Inspection",
        unspecified: "Unspecified",
        daily_checklist_toyota: "Daily Checklist (Toyota)",
        "Daily Checklist Toyota": "Daily Checklist (Toyota)",
        daily_checklist_mercedes: "Daily Checklist (Mercedes)",
        "Daily Checklist Mercedes": "Daily Checklist (Mercedes)",
      },

      status: {
        scheduled: "Scheduled",
        inProgress: "In Progress",
        completed: "Completed",
        failed: "Failed",
        cancelled: "Cancelled"
      },

      statusValues: {
        completed: "Completed"
      },

      messages: {
        exportSuccess: "Export successful",
        pdfDownloaded: "PDF downloaded successfully"
      },

      quickStats: {
        todaysInspections: "Today's Inspections",
        pendingInspections: "Pending Inspections",
        weeklyCompleted: "Completed This Week",
        failedInspections: "Failed Inspections"
      },

      calendar: {
        title: "Inspection Calendar",
        month: "Month",
        week: "Week",
        today: "Today",
        inspectionsOnDate: "{count} inspections on {date}",
        noInspectionsOnDate: "No inspections on this date",
        viewInspection: "View Inspection"
      },

      details: {
        printTitle: "Vehicle Inspection Report",
        vehicleInfoTitle: "Vehicle Information",
        overviewTitle: "Inspection Overview",
        summaryTitle: "Inspection Summary",
        photosTitle: "Photos ({count})",
        photosTabDescription: "All photos captured during this inspection",
        noPhotosMessage: "No photos were taken during this inspection",
        photoForItem: "Photo for {itemName}",
        photoItemAlt: "Inspection photo for {itemName}",
        viewPhotoAria: "View photo for {itemName}",
        
        tabs: {
          details: "All Items",
          failed: "Failed",
          passed: "Passed",
          photos: "Photos"
        },

        allItemsTitle: "All Inspection Items ({count})",
        failedItemsTitle: "Failed Items ({count})",
        passedItemsTitle: "Passed Items ({count})",

        summaryPassed: "Passed",
        summaryFailed: "Failed",
        summaryNotes: "With Notes",
        summaryPhotos: "Photos",
        passRate: "Pass Rate",
        attentionRequired: "Attention Required",
        itemsNeedAttention: "{count} items need attention",

        vehicleInfo: {
          title: "Vehicle Information"
        },

        summary: {
          title: "Inspection Summary",
          passedItems: "Passed Items",
          failedItems: "Failed Items",
          itemsWithNotes: "Items with Notes",
          photosTaken: "Photos Taken"
        },

        items: {
          title: "Inspection Items"
        },

        results: {
          allPassed: "All items passed",
          noPassedItems: "No items passed",
          noItems: "No inspection items found",
          noItemsInStatus: "No items with {status} status found",
          itemStatus: "Item Status",
          passed: "Passed",
          failed: "Failed",
          pending: "Pending",
          withNotes: "Has Notes",
          withPhotos: "Has Photos",
          expandPhotos: "View Photos",
          collapsePhotos: "Hide Photos"
        },

        pdfFooter: {
          generatedOn: "Generated on {date}",
          vehicleName: "Vehicle: {name}"
        },

        repairNeededTitle: "Repair Required",
        repairNeededDescription: "This inspection has failed items that require repair or maintenance.",
        repairNeededFor: "Repair needed for",
        defaultRepairDescription: "Repair required based on inspection results",
        repairTaskTitle: "Repair for {inspectionName} - {vehicleName}",
        andMoreItems: "and {count} more items",
        unknownItem: "Unknown Item"
      },

      actions: {
        pass: "Pass",
        fail: "Fail",
        takePhoto: "Take Photo",
        previousSection: "Previous Section",
        nextSection: "Next Section",
        startInspection: "Start Inspection",
        continueInspection: "Continue Inspection",
        completeInspection: "Complete Inspection",
        scheduleRepair: "Schedule Repair",
        printReport: "Print Report",
        exportHtml: "Export CSV",
        exportPdf: "Export PDF",
        viewDetails: "View Details"
      },

      notes: {
        title: "Inspector Notes",
        placeholder: "Add notes about this inspection...",
        itemNotes: "Item Notes"
      },

      photos: {
        title: "Inspection Photos",
        addPhoto: "Add Photo",
        viewPhoto: "View Photo",
        deletePhoto: "Delete Photo",
        noPhotos: "No photos added"
      },

      form: {
        title: "Vehicle Inspection",
        selectVehicle: "Select Vehicle",
        selectType: "Select Inspection Type",
        searchVehicles: "Search vehicles...",
        filterByBrand: "Filter by Brand",
        filterByModel: "Filter by Model", 
        filterByGroup: "Filter by Group",
        allBrands: "All Brands",
        allModels: "All Models",
        allGroups: "All Groups",
        clearFilters: "Clear Filters",
        noVehiclesFound: "No vehicles found",
        vehicleSelected: "Vehicle Selected",
        typeSelected: "Type Selected",
        startInspection: "Start Inspection",
        
        progress: {
          vehicleSelection: "Vehicle Selection",
          typeSelection: "Type Selection", 
          inspection: "Inspection",
          completion: "Completion"
        },

        steps: {
          selectVehicle: "Select a vehicle to inspect",
          selectType: "Choose the type of inspection to perform",
          performInspection: "Complete the inspection checklist",
          reviewAndSubmit: "Review and submit your inspection"
        },

        inspection: {
          section: "Section {current} of {total}",
          item: "Item {current} of {total}",
          progress: "Progress: {percent}%",
          estimatedTime: "Est. {minutes} min remaining",
          pass: "Pass",
          fail: "Fail",
          addNote: "Add Note",
          takePhoto: "Take Photo",
          next: "Next",
          previous: "Previous",
          previousSection: "Previous Section",
          nextSection: "Next Section",
          complete: "Complete Inspection",
          notes: "Notes",
          photos: "Photos",
          requiredPhoto: "Photo required",
          requiredNotes: "Notes required",
          optionalPhoto: "Photo optional",
          optionalNotes: "Notes optional"
        }
      },

      // Add labels section for backward compatibility
      labels: {
        model: "Model",
        currentSection: "Current Section",
        estimatedTime: "Estimated Time"
      }
    }
  },
  board: {
    view: "Board View",
    title: "Dispatch Board",
    pending: "Pending",
    confirmed: "Confirmed",
    assigned: "Assigned",
    enRoute: "En Route",
    arrived: "Arrived",
    inProgress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    addEntry: "Add Assignment"
  },
  notificationOptions: {
    title: "Notification Options",
    description: "Choose how to notify assigned resources",
    emailNotification: "Email Notification",
    emailDescription: "Send email to driver and customer",
    pushNotification: "Push Notification", 
    pushDescription: "Send push notification to driver's mobile app",
    smsNotification: "SMS Notification",
    smsDescription: "Send SMS to driver's phone",
    includeCustomer: "Include Customer",
    customerDescription: "Send confirmation to customer",
    customMessage: "Custom Message",
    customMessagePlaceholder: "Add a custom message (optional)"
  },
  mapView: {
    title: "Map View",
    showList: "Show List",
    hideList: "Hide List",
    todaysBookings: "Today's Bookings", 
    manage: "Assignments",
    manageAssignments: "Manage Assignments",
    satellite: "Satellite",
    roadmap: "Roadmap",
    hybrid: "Hybrid",
    terrain: "Terrain",
    traffic: "Traffic",
    vehicles: "Vehicles",
    routes: "Routes",
    autoCenter: "Auto Center",
    hideTraffic: "Hide Traffic",
    centerMap: "Center Map",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit Fullscreen",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    togglePanel: "Toggle Panel",
    expandPanel: "Expand Panel",
    collapsePanel: "Collapse Panel",
    showRoute: "Show Route",
    hideRoute: "Hide Route",
    liveTracking: "Live Tracking",
    offline: "Offline"
  },
  boardView: {
    title: "Board View",
    pending: "Pending",
    assigned: "Assigned",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled"
  }
}

export default en 