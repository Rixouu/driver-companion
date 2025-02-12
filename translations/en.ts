export const en = {
  common: {
    back: "Back",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    loading: "Loading...",
    required: "Required",
    logout: "Logout",
    search: "Search",
    filter: "Filter",
    clear: "Clear",
    apply: "Apply",
    actions: "Actions",
    confirm: "Confirm",
    success: "Success",
    noData: "No data available",
    optional: "Optional",
    select: "Select",
    view: "View",
    date: "Date",
    time: "Time",
    notes: "Notes",
    description: "Description",
    error: "Error",
    warning: "Warning",
    info: "Information",
    ui: {
      modal: {
        close: "Close",
        confirm: "Confirm",
        cancel: "Cancel",
      },
      dropdown: {
        select: "Select...",
        noOptions: "No options available",
        search: "Search...",
        all: "All",
        none: "None",
      },
      table: {
        noData: "No data available",
        loading: "Loading data...",
        search: "Search...",
        rowsPerPage: "Rows per page",
        showing: "Showing {start} to {end} of {total} entries",
      },
      fileUpload: {
        drag: "Drag and drop files here",
        or: "or",
        browse: "Browse files",
        maxSize: "Maximum file size: {size}",
        invalidType: "Invalid file type",
        uploading: "Uploading...",
        uploaded: "File uploaded",
        failed: "Upload failed",
      },
      pagination: {
        prev: "Previous",
        next: "Next",
        page: "Page {page}",
        of: "of {total}",
        rowsPerPage: "Rows per page:",
      },
      datePicker: {
        selectDate: "Select date",
        selectTime: "Select time",
        startDate: "Start date",
        endDate: "End date",
        today: "Today",
        clear: "Clear",
        month: "Month",
        year: "Year",
      },
      form: {
        required: "Required field",
        optional: "Optional",
        error: "Error in form",
        success: "Form submitted",
        unsaved: "You have unsaved changes",
        confirmLeave: "Are you sure you want to leave? You have unsaved changes.",
      },
      notifications: {
        show: "Show notifications",
        hide: "Hide notifications",
        clear: "Clear all",
        noNotifications: "No notifications",
        markAllRead: "Mark all as read",
      },
      search: {
        placeholder: "Search...",
        noResults: "No results found",
        searching: "Searching...",
        clear: "Clear search",
        filters: "Search filters",
      },
    },
    gestures: {
      swipeLeft: "Swipe left for actions",
      doubleTap: "Double tap for details",
    },
    clipboard: {
      copied: "Copied to clipboard",
    },
    actionLabels: {
      more: "More actions",
      share: "Share vehicle",
      view: "View details",
      edit: "Edit",
      delete: "Delete",
    },
    days: "days",
    completed: "Completed",
    welcome: "Welcome",
    overview: "Here's an overview of your vehicle inspections",
    upcomingTasks: "Upcoming Tasks",
    viewAll: "View All",
    alerts: "Alerts",
    pendingInspections: "Pending Inspections",
    completedToday: "Completed Today",
    requiresAttention: "Requires Attention",
    recentInspections: "Recent Inspections",
    viewDetails: "View Details"
  },
  status: {
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    inProgress: "In Progress",
    approved: "Approved",
    rejected: "Rejected",
    archived: "Archived",
    scheduled: "Scheduled",
    inspection_due: "Inspection Due",
    vehicleStatus: {
      maintenance: "Under Maintenance",
      inspectionDue: "Inspection Due",
      active: "Active",
      inactive: "Inactive"
    },
    inspectionStatus: {
      passed: "Passed",
      failed: "Failed",
      na: "N/A",
      inProgress: "In Progress",
      scheduled: "Scheduled",
      completed: "Completed",
      cancelled: "Cancelled"
    },
    maintenanceStatus: {
      scheduled: "Scheduled",
      inProgress: "In Progress",
      completed: "Completed",
      overdue: "Overdue"
    }
  },
  navigation: {
    dashboard: "Dashboard",
    vehicles: "Vehicles",
    inspections: "Inspections",
    settings: "Settings"
  },
  dashboard: {
    title: "Dashboard",
    welcome: "Welcome back, {{name}}",
    welcomeMessage: "Welcome, {{name}}!",
    overview: {
      title: "Here's your vehicle status and upcoming tasks"
    },
    quickActions: {
      title: "Quick Actions",
      newInspection: "New Inspection",
      scheduleInspection: "Schedule Inspection",
      addVehicle: "Add Vehicle",
      viewReports: "View Reports",
    },
    stats: {
      inspectionsThisMonth: "Inspections This Month",
      passRate: "Pass Rate",
      averageCompletion: "Average Completion Time",
      vehiclesInService: "Vehicles In Service",
    },
    lastInspection: "Last inspection",
    inspectionRequired: "Inspection required",
    startInspection: "Start Inspection",
    viewInspection: "View Inspection",
    alerts: {
      title: "Active Alerts",
      viewAll: "View All Alerts",
      priority: {
        high: "High Priority",
        medium: "Medium Priority",
        low: "Low Priority",
      },
      types: {
        inspection: "{count} inspection due",
        maintenance: "{count} maintenance needed",
      },
    },
    activity: {
      title: "Recent Activity",
      viewAll: "View All Activity",
      timeAgo: "{time} ago",
      types: {
        inspection: "Inspection completed for {vehicle}",
        maintenance: "Maintenance performed on {vehicle}",
        document: "Document uploaded for {vehicle}",
        assignment: "{vehicle} assigned to {driver}",
      },
      empty: "No recent activity",
    },
    calendar: {
      title: "Schedule",
      today: "Today's Schedule",
      upcoming: "Upcoming Events",
      noEvents: "No events scheduled",
      schedule: "Schedule Inspection",
    },
    components: {
      summary: {
        title: "Summary",
        period: "Period",
        comparison: "vs. previous period",
        increase: "{value}% increase",
        decrease: "{value}% decrease",
        noChange: "No change",
      },
      chart: {
        noData: "No data available",
        loading: "Loading chart data...",
        zoom: "Zoom",
        pan: "Pan",
        reset: "Reset zoom",
        download: "Download chart",
      },
      alerts: {
        high: "High Priority",
        medium: "Medium Priority",
        low: "Low Priority",
        dismiss: "Dismiss",
        dismissAll: "Dismiss all",
        markRead: "Mark as read",
      },
      tasks: {
        title: "Tasks",
        add: "Add task",
        due: "Due {date}",
        assignedTo: "Assigned to",
        priority: "Priority",
        status: "Status",
        noTasks: "No tasks",
      },
    },
    metrics: {
      inspectionRate: "Inspection Rate",
      vehicleUtilization: "Vehicle Utilization",
      maintenanceCompliance: "Maintenance Compliance",
      fleetHealth: "Fleet Health",
      change: {
        increase: "+{value}%",
        decrease: "-{value}%",
      },
    },
    notifications: {
      title: "Notifications",
      markAsRead: "Mark as read",
      viewAll: "View all notifications",
      empty: "No new notifications",
    },
    insights: {
      title: "Insights",
      trending: "Trending",
      improvement: "Areas for Improvement",
      recommendation: "Recommendations",
    },
    vehicles: {
      title: "Fleet Overview",
      active: "Active Vehicles",
      addNew: "Add Vehicle",
      status: {
        active: "Active",
        maintenance: "In Maintenance",
        inspection_due: "Inspection Due",
      },
    },
    maintenance: {
      title: "Maintenance Schedule",
      upcoming: "{count} upcoming tasks",
      schedule: "Schedule Maintenance",
      status: {
        overdue: "Overdue",
        upcoming: "Upcoming",
        scheduled: "Scheduled",
      },
    },
    vehicle: {
      plateNumber: "Plate Number",
      nextInspection: "Next Inspection Due",
      nextMaintenance: "Next Maintenance Due",
      startInspection: "Start Inspection",
      status: {
        active: "Active",
        maintenance: "In Maintenance",
        inspection_due: "Inspection Due",
      },
      actions: {
        startInspection: "Start Inspection",
        reportIssue: "Report Issue",
        viewHistory: "View History",
      },
      mileage: "Current Mileage",
      lastInspection: "Last Inspection",
    },
    upcomingTasks: "Upcoming Tasks",
    tasks: {
      inspection: "Vehicle Inspection",
      maintenance: "Maintenance Service",
      time: "{date} at {time}",
    },
    priority: {
      high: "Urgent",
      medium: "Important",
      low: "Normal",
    },
  },
  vehicles: {
    title: "Vehicles",
    alerts: {
      maintenanceDue: "Maintenance due in {days} days",
      documentExpiring: "{document} expires in {days} days",
      inspectionRequired: "Inspection required by {date}",
      mileageThreshold: "Mileage threshold reached",
    },
    plateNumber: "License Plate",
    name: "Vehicle Name",
    select: "Select Vehicle",
    status: {
      active: "Active",
      inspection_due: "Inspection Due",
      maintenance: "In Maintenance"
    },
    addVehicle: "Add Vehicle",
    new: {
      title: "Add New Vehicle",
      description: "Enter the details for the new vehicle",
      form: {
        vehicleInfo: "Vehicle Information",
        name: "Vehicle Name",
        plateNumber: "Plate Number",
        model: "Model",
        year: "Year",
        vin: "VIN",
        assignTo: "Assign To",
        image: "Vehicle Image",
        imageHelp: "Upload a clear photo of the vehicle. Supported formats: JPG, PNG",
      },
      actions: {
        add: "Add Vehicle",
        adding: "Adding Vehicle...",
        cancel: "Cancel",
      },
    },
    list: {
      active: "Active Vehicles",
      noVehicles: "No vehicles found",
    },
    details: {
      title: "Vehicle Information",
      model: "Model",
      year: "Year",
      vin: "VIN",
      assignedTo: "Assigned To",
      lastInspection: "Last Inspection",
      status: "Status",
      plateNumber: "Plate Number",
      maintenance: {
        schedule: {
          title: "Maintenance Schedule",
          nextService: "Next Service",
          upcoming: "Upcoming",
          overdue: "Overdue",
          lastService: "Last Service",
          addTask: "Add Task",
          days: "Days",
          kilometers: "Kilometers"
        },
        types: {
          title: "Maintenance Types",
          oil: "Oil Change",
          tire: "Tire Service",
          brake: "Brake Service",
          inspection: "Inspection",
          general: "General Service"
        },
        status: {
          completed: "Completed",
          scheduled: "Scheduled",
          overdue: "Overdue"
        },
        intervals: {
          upcoming: "Upcoming",
          overdue: "Overdue"
        },
        mileageCurrent: "Current Mileage",
        costs: {
          title: "Cost Overview",
          total: "Total Maintenance Cost",
          average: "Monthly Average Cost",
          amount: "Service Cost"
        },
        reminders: {
          title: "Maintenance Reminders",
          enable: "Enable Reminders",
          notification: "Notification Type",
          both: "Email & SMS",
          before: "Notify Before",
          days: "days"
        },
        history: {
          title: "Maintenance History",
          serviceDate: "Service Date",
          performedBy: "Performed By",
          serviceCenter: "Service Center"
        }
      },
      inspections: {
        title: "Inspection Schedule",
        upcoming: "Upcoming Inspections",
        schedule: "Schedule Inspection",
        reschedule: "Reschedule",
        cancel: "Cancel Inspection",
        date: "Inspection Date",
        time: "Time",
        status: "Status",
        actions: "Actions",
        results: {
          passed: "Passed",
          failed: "Failed",
          na: "N/A"
        }
      }
    },
    viewDetails: "View Details",
    management: {
      assignVehicle: "Assign Vehicle",
      maintenance: {
        title: "Maintenance Management",
        schedule: "Maintenance Schedule",
        history: "Maintenance History",
        nextService: "Next Service",
        lastService: "Last Service",
        addService: "Add Service Record",
        costs: {
          title: "Cost Overview",
          total: "Total Maintenance Cost",
          average: "Monthly Average Cost",
          amount: "Service Cost"
        },
      },
      mileage: {
        title: "Mileage Overview",
        current: "Current Mileage",
        daily: "Daily Average",
        monthly: "Monthly Average",
        update: {
          title: "Update Mileage",
          reading: "Current Reading",
          lastUpdate: "Last Update: {date}",
          notes: "Notes"
        },
        alerts: {
          title: "Mileage Alerts",
          upcomingService: "Upcoming Service",
          overdueService: "Overdue Service",
          status: {
            upcoming: "Upcoming",
            overdue: "Overdue"
          }
        },
        goals: {
          title: "Mileage Goals",
          monthly: "Monthly Goal",
          yearly: "Yearly Goal",
          current: "{current} / {target} km"
        },
        analysis: {
          title: "Mileage Analysis",
          stats: {
            lastDistance: "Last Distance",
            totalDistance: "Total Distance",
            averagePerTrip: "Average Per Trip",
            projectedMonthly: "Projected Monthly",
            weeklyComparison: "Weekly Comparison",
            averageSpeed: "Average Speed"
          },
          metrics: {
            kilometers: "kilometers",
            kmPerHour: "km/h",
            perDay: "per day",
            perWeek: "per week"
          },
          chart: {
            weekly: "Weekly Distance",
            monthly: "Monthly Distance",
            comparison: "Distance Comparison"
          }
        },
        tabs: {
          overview: "Overview",
          history: "History",
          analysis: "Analysis",
          maintenanceSchedule: "Maintenance Schedule",
          inspectionHistory: "Inspection History",
          mileageCurrent: "Current Mileage",
          fuelConsumption: "Fuel Consumption",
          assignmentList: "Assignment List"
        },
        metrics: {
          kilometers: "kilometers",
          days: "days"
        }
      },
      tabs: {
        maintenanceSchedule: "Maintenance Schedule",
        inspectionHistory: "Inspection History",
        mileageCurrent: "Current Mileage",
        fuelConsumption: "Fuel Consumption",
        assignmentList: "Assignment List"
      },
      fuelConsumption: {
        title: "Fuel Consumption",
        stats: {
          averageConsumption: "Average Consumption",
          totalFuelCost: "Total Fuel Cost",
          lastRefuel: "Last Refuel",
          fuelEfficiency: "Fuel Efficiency"
        },
        metrics: {
          liters: "L",
          kmPerLiter: "km/L",
          costPerKm: "$/km"
        },
        chart: {
          consumption: "Consumption",
          distance: "Distance",
          cost: "Cost",
          monthly: "Monthly Consumption",
          yearly: "Yearly Consumption"
        },
        refuel: {
          addRecord: "Add Refuel Record",
          date: "Refuel Date",
          amount: "Amount (L)",
          cost: "Cost",
          mileage: "Mileage at Refuel",
          fullTank: "Full Tank",
          station: "Station"
        }
      },
      assignment: {
        title: "Assignment Management",
        current: {
          title: "Current Assignment",
          noAssignment: "No Current Assignment",
          driver: "Assigned Driver",
          since: "Assigned Since",
          until: "Assigned Until"
        },
        history: {
          title: "Assignment History",
          noHistory: "No Assignment History",
          previousDrivers: "Previous Drivers"
        },
        new: {
          title: "New Assignment",
          selectDriver: "Select Driver",
          period: "Assignment Period",
          notes: "Assignment Notes"
        },
        actions: {
          assign: "Assign Vehicle",
          unassign: "Unassign Vehicle",
          extend: "Extend Assignment",
          terminate: "Terminate Assignment",
          addAssignment: "Add Assignment"
        },
        status: {
          active: "Active",
          completed: "Completed",
          scheduled: "Scheduled",
          cancelled: "Cancelled"
        },
        assignmentHistory: "Assignment History",
        addAssignment: "Add Assignment",
        assignTo: "Assign Vehicle To"
      },
      maintenanceSchedule: {
        title: "Maintenance Schedule",
        upcoming: "Upcoming Maintenance",
        overdue: "Overdue Maintenance",
        addTask: "Add Maintenance Task",
        taskDetails: {
          type: "Maintenance Type",
          dueDate: "Due Date",
          estimatedCost: "Estimated Cost",
          assignedTo: "Assigned To",
          priority: "Priority",
          notes: "Task Notes"
        },
        intervals: {
          daily: "Daily",
          weekly: "Weekly",
          monthly: "Monthly",
          quarterly: "Quarterly",
          yearly: "Yearly",
          custom: "Custom Interval"
        },
        maintenanceStatus: {
          upcoming: "Upcoming",
          scheduled: "Scheduled",
          inProgress: "In Progress",
          completed: "Completed",
          cancelled: "Cancelled",
          overdue: "Overdue"
        }
      },
      inspectionSchedule: {
        title: "Inspection Schedule",
        upcoming: "Upcoming Inspections",
        overdue: "Overdue Inspections",
        schedule: {
          title: "Schedule Inspection",
          selectDate: "Select Date",
          selectTime: "Select Time",
          inspector: "Assigned Inspector",
          type: "Inspection Type",
          notes: "Inspection Notes"
        },
        status: {
          scheduled: "Scheduled",
          inProgress: "In Progress",
          completed: "Completed",
          cancelled: "Cancelled",
          overdue: "Overdue"
        },
        frequency: {
          weekly: "Weekly",
          biweekly: "Bi-weekly",
          monthly: "Monthly",
          quarterly: "Quarterly",
          custom: "Custom Schedule"
        }
      },
      qrCode: {
        generate: "Generate QR Code",
        download: "Download QR Code",
        print: "Print QR Code",
        scan: "Scan QR Code"
      },
      fuel: {
        consumption: "Fuel Consumption",
        totalCost: "Total Fuel Cost",
        averageEfficiency: "Average Efficiency",
        addRecord: "Add Fuel Record",
        liters: "Liters",
        mileage: "Mileage at Fill-up",
        cost: "Fuel Cost"
      },
      vehicleStatus: {
        active: "Active",
        maintenance: "Under Maintenance",
        inspection_due: "Inspection Due"
      }
    }
  },
  inspections: {
    title: "Vehicle Inspections",
    new: {
      title: "New Inspection",
      start: "Start Inspection",
      selectVehicle: "Select Vehicle",
      vehicleDetails: "Vehicle Details",
      instructions: "Follow the checklist and complete all required items",
    },
    details: {
      title: "Inspection Details",
      inspector: "Inspector",
      date: "Inspection Date",
      notes: "Inspection Notes",
      photos: "Photos",
      documents: "Documents",
      signature: "Signature",
      completed: "Completed",
      failed: "Failed Items",
      passed: "Passed Items",
      noIssues: "No Issues Found",
      issues: "Issues Found",
      vehicleInformation: "Vehicle Information",
      inspectionDetails: {
        title: "Inspection Details",
        inspector: "Inspector",
        date: "Inspection Date",
        notes: "Inspection Notes",
        photos: "Photos",
        documents: "Documents",
        signature: "Signature",
        completed: "Completed",
        failed: "Failed Items",
        passed: "Passed Items",
        noIssues: "No Issues Found",
        issues: "Issues Found"
      }
    },
    schedule: {
      title: "Inspection Schedule",
      upcoming: "Upcoming Inspections",
      overdue: "Overdue Inspections",
      new: {
        title: "Schedule New Inspection",
        vehicle: "Select Vehicle",
        inspector: "Assign Inspector",
        datetime: "Select Date & Time"
      },
      status: {
        scheduled: "Scheduled",
        inProgress: "In Progress",
        completed: "Completed",
        cancelled: "Cancelled",
        overdue: "Overdue"
      },
      actions: {
        schedule: "Schedule Inspection",
        reschedule: "Reschedule",
        cancel: "Cancel Inspection",
        confirm: "Confirm Schedule"
      },
      notifications: {
        reminder: "Inspection Reminder",
        scheduled: "Inspection Scheduled",
        cancelled: "Inspection Cancelled"
      },
      selectTime: "Select Time",
      reschedule: "Reschedule",
      cancel: "Cancel Inspection",
      selectTimeSlot: "Select Time Slot",
      submit: "Submit Inspection",
      cancelConfirm: "Are you sure you want to cancel this inspection? This action cannot be undone.",
      scheduleStatus: {
        scheduled: "Scheduled",
        inProgress: "In Progress",
        completed: "Completed",
        cancelled: "Cancelled",
        overdue: "Overdue"
      }
    },
    inspectionChecklist: "Inspection Checklist",
    actions: {
      pass: "Mark as Pass",
      fail: "Mark as Fail",
      completeInspection: "Complete Inspection"
    },
    sections: {
      front: {
        headlights: "Headlights",
        signals: "Turn Signals",
        bumper: "Front Bumper",
        hood: "Hood",
        windshield: "Windshield"
      },
      left: "Left Side",
      right: "Right Side",
      rear: {
        taillights: "Taillights",
        trunk: "Trunk/Boot",
        exhaust: "Exhaust System",
        bumper: "Rear Bumper"
      },
      interior: "Interior",
      inspectionStatus: {
        passed: "Passed",
        failed: "Failed",
        na: "N/A",
        pending: "Pending"
      },
      sectionItemStatus: {
        passed: "Passed",
        failed: "Failed",
        na: "N/A",
        pending: "Pending"
      },
      checkStatus: {
        passed: "Passed",
        failed: "Failed",
        na: "N/A",
        pending: "Pending"
      },
      validationStatus: {
        passed: "Passed",
        failed: "Failed",
        na: "N/A",
        pending: "Pending"
      }
    },
    history: {
      title: "Inspection History",
      allStatuses: "All Statuses"
    },
    newInspection: "New Inspection",
    vehicleInformationTitle: "Vehicle Information",
    vehicleInformationSubtitle: "Toyota Alphard Z-Class",
    progressCompleted: "0% Completed",
    progressStatsPassed: "0 Passed",
    progressStatsFailed: "0 Failed",
    progressStatsRemaining: "16 Remaining",
    checklist: {
      title: "Inspection Checklist",
      section: "Section",
      item: "Item",
      status: "Status",
      comments: "Comments",
      addComment: "Add Comment",
      markAllPassed: "Mark All as Passed",
      requiredItems: "Required Items",
      optionalItems: "Optional Items",
      incompleteItems: "Incomplete Items",
      reviewRequired: "Review Required",
      items: {
        front: {
          headlights: "Headlights",
          signals: "Turn Signals",
          bumper: "Front Bumper",
          hood: "Hood",
          windshield: "Windshield"
        },
        sides: {
          mirrors: "Side Mirrors",
          doors: "Doors",
          tires: "Tires",
          trim: "Body Trim"
        },
        rear: {
          taillights: "Taillights",
          trunk: "Trunk/Boot",
          exhaust: "Exhaust System",
          bumper: "Rear Bumper"
        }
      },
    },
    photos: {
      title: "Photos",
      takePhoto: "Take Photo",
      upload: "Upload"
    },
    voice: {
      title: "Voice Notes"
    },
    signature: {
      title: "Signature",
      instructions: "Sign here to complete the inspection"
    },
    components: {
      timer: {
        elapsed: "Elapsed Time",
        remaining: "Remaining Time",
        overtime: "Overtime",
        pause: "Pause",
        resume: "Resume",
        reset: "Reset"
      }
    },
    workflow: {
      title: "Workflow",
      preparation: "Preparation",
      inspection: "Inspection",
      review: "Review",
      completion: "Completion",
      next: "Next Step",
      previous: "Previous Step",
      skipStep: "Skip Step",
      workflowStatus: {
        completed: "Completed",
        pending: "Pending",
        failed: "Failed",
        inProgress: "In Progress"
      }
    },
    pdfReport: {
      title: "Inspection Report",
      summary: "Inspection Summary",
      details: {
        vehicle: "Vehicle Details",
        inspection: "Inspection Details",
        inspector: "Inspector Information"
      },
      sections: {
        checklist: "Inspection Checklist",
        photos: "Photo Documentation",
        notes: "Inspector Notes",
        signature: "Digital Signature"
      },
      metadata: {
        generated: "Generated on",
        reportId: "Report ID",
        location: "Location",
        duration: "Inspection Duration"
      },
      actions: {
        download: "Download PDF",
        print: "Print Report",
        share: "Share Report",
        archive: "Archive Report"
      },
      reportStatus: {
        draft: "Draft Report",
        final: "Final Report",
        archived: "Archived Report"
      }
    },
    start: {
      title: "Start New Inspection",
      subtitle: "Complete all required sections",
      vehicle: {
        title: "Vehicle Information",
        select: "Select Vehicle",
        details: "Vehicle Details",
        noVehicle: "No vehicle selected"
      },
      preparation: {
        title: "Preparation",
        instructions: "Before starting the inspection:",
        items: [
          "Ensure vehicle is parked safely",
          "Check lighting conditions",
          "Prepare inspection tools"
        ]
      },
      sections: {
        required: "Required Sections",
        optional: "Optional Sections",
        incomplete: "Incomplete Sections",
        complete: "Completed Sections"
      },
      progress: {
        progressStatus: {
          completed: "{count} of {total} completed",
          remaining: "{count} sections remaining"
        }
      },
      actions: {
        start: "Start Inspection",
        continue: "Continue Inspection",
        save: "Save Progress",
        complete: "Complete Inspection"
      },
      validation: {
        vehicleRequired: "Please select a vehicle",
        confirmStart: "Are you ready to start the inspection?"
      },
      startStatus: {
        incomplete: "Incomplete",
        complete: "Complete",
        inProgress: "In Progress"
      }
    },
    date: "Inspection Date",
    inspector: "Inspector",
    results: {
      resultStatus: {
        passed: "Passed",
        failed: "Failed",
        na: "N/A",
        pending: "Pending"
      }
    },
    vehicleInfo: {
      // ... vehicle info translations
    },
    vehicleInformation: "Vehicle Information",
    completeInspections: "Complete Inspection",
    validation: {
      validationStatus: {
        passed: "Passed",
        failed: "Failed",
        na: "N/A",
        pending: "Pending"
      }
    },
    completeInspection: "Complete Inspection",
    maintenanceSchedule: {
      maintenanceStatus: {
        upcoming: "Upcoming",
        scheduled: "Scheduled",
        inProgress: "In Progress",
        completed: "Completed",
        cancelled: "Cancelled",
        overdue: "Overdue"
      }
    },
    vehicleInspection: {
      checkStatus: {
        passed: "Passed",
        failed: "Failed",
        na: "N/A"
      }
    },
    itemStatus: {
      passed: "Passed",
      failed: "Failed",
      na: "N/A",
      pending: "Pending"
    }
  },
  settings: {
    title: "Settings",
    description: "Manage your account settings and preferences.",
    profile: {
      title: "Profile",
      description: "Update your profile information.",
      name: "Name",
      email: "Email",
      emailNote: "Your email address is managed by your Google account.",
      updated: "Your profile has been updated successfully.",
    },
    preferences: {
      title: "Preferences",
      theme: "Theme",
      dateFormat: "Date Format",
      timeFormat: "Time Format",
      timezone: "Timezone",
      language: "Language",
    },
    notifications: {
      title: "Notification Settings",
      email: "Email Notifications",
      push: "Push Notifications",
      sms: "SMS Notifications",
      frequency: "Notification Frequency",
      types: {
        maintenance: "Maintenance Alerts",
        inspection: "Inspection Reminders",
        document: "Document Expiry",
        system: "System Updates",
      },
    },
  },
  nav: {
    dashboard: "Dashboard",
    vehicles: "Vehicles",
    inspections: "Inspections",
    settings: "Settings"
  },
  auth: {
    signIn: "Sign In",
    signOut: "Sign Out",
    signInWithGoogle: "Sign in with Google"
  },
  buttons: {
    startInspection: "Start Inspection",
    save: "Save",
    cancel: "Cancel",
    next: "Next",
    previous: "Previous",
    complete: "Complete"
  },
  tasks: {
    inspection: "Vehicle Inspection",
    maintenance: "Maintenance Service"
  },
  vehicle: {
    nextInspection: "Next Inspection",
    alerts: {
      inspectionRequired: "Inspection required by {date}"
    },
    status: {
      active: "Active",
      inspection_due: "Inspection Due"
    }
  },
  errors: {
    somethingWentWrong: "Something went wrong",
    tryAgain: "Try Again",
    required: "This field is required",
  },
  globalStatus: {
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    inProgress: "In Progress",
    approved: "Approved",
    rejected: "Rejected",
    archived: "Archived",
    scheduled: "Scheduled"
  }
} 