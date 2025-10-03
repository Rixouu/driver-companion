#!/bin/bash

# Documentation Reorganization Script
# This script reorganizes the docs folder with proper structure and lowercase filenames

echo "Starting documentation reorganization..."

# Create additional subdirectories
mkdir -p features/{notifications,email,quotations,bookings,inspections,vehicles,dispatch}
mkdir -p integrations/{payment,aviation,email,notifications}
mkdir -p optimization/{database,performance,bundle}
mkdir -p deployment/{vercel,production,staging}
mkdir -p development/{patterns,guidelines,testing}
mkdir -p refactoring/{plans,opportunities,progress}

# Move and rename files systematically

# Database related files
mv DATABASE_OPTIMIZATION.md optimization/database/
mv DATABASE_ORGANIZATION_ANALYSIS.md optimization/database/

# Email related files
mv EMAIL_ROUTE_MIGRATION_GUIDE.md features/email/
mv EMAIL_TEMPLATES_ANALYSIS.md features/email/
mv UNIFIED_EMAIL_SYSTEM.md features/email/
mv README-EMAIL-OPTIMIZATION.md features/email/
mv TRIP_REMINDER_EMAILS.md features/email/

# Notifications
mv NOTIFICATION_SYSTEM_FIX.md features/notifications/
mv NOTIFICATION_SYSTEM_MONITORING.md features/notifications/
mv SCHEDULED_NOTIFICATIONS.md features/notifications/

# Quotations
mv QUOTATION_APPROVAL_OPTIMIZATION.md features/quotations/
mv QUOTATION_CONVERSION_FIX.md features/quotations/
mv QUOTATION_WORKFLOW_CLEANUP_PLAN.md features/quotations/

# Bookings
mv AVIATION_API_MIGRATION.md integrations/aviation/
mv AVIATIONSTACK_INTEGRATION.md integrations/aviation/
mv AERODATABOX_INTEGRATION.md integrations/aviation/

# Inspections
mv CHARACTER_ENCODING_FIX.md features/inspections/

# Vehicles
mv AUTO-SCROLL-HOOK.md development/patterns/

# Dispatch
mv DISPATCH_FIXES_SUMMARY.md features/dispatch/

# Integrations
mv OMISE_INTEGRATION.md integrations/payment/
mv PAYLINKS_FEATURE.md integrations/payment/
mv MAGIC_LINK_SYSTEM.md integrations/authentication/
mv OWNTRACKS_INTEGRATION.md integrations/tracking/

# Optimization
mv OPTIMIZATION_PLAN.md optimization/
mv OPTIMIZATION_SUMMARY.md optimization/
mv BUNDLE_OPTIMIZATION_ANALYSIS.md optimization/performance/

# Phase documentation
mv PHASE_2_PROGRESS.md refactoring/progress/
mv PHASE_2_RESULTS.md refactoring/progress/
mv PHASE_3_PLAN.md refactoring/plans/
mv PHASE_3A_DATABASE_ANALYSIS.md refactoring/progress/
mv PHASE_3A_DATABASE_FIXES.md refactoring/progress/
mv PHASE_3A_RESULTS.md refactoring/progress/
mv PHASE_3A_RLS_PERFORMANCE_OPTIMIZATION.md refactoring/progress/
mv PHASE_3A_TARGETED_RESULTS.md refactoring/progress/
mv PHASE_3B_CODE_SPLITTING_PLAN.md refactoring/plans/
mv PHASE_3B_RESULTS.md refactoring/progress/
mv PHASE_3C_ARCHITECTURE_COMPARISON.md refactoring/plans/
mv PHASE_3C_MONOREPO_EVALUATION.md refactoring/plans/
mv PHASE_3D_RESULTS.md refactoring/progress/
mv PHASE_3D_TESTING_DOCS_PLAN.md refactoring/plans/

# Refactoring
mv REFACTORING_PLAN_BY_RISK.md refactoring/plans/
mv SPECIFIC_REFACTORING_OPPORTUNITIES.md refactoring/opportunities/

# Development
mv error-handling.md development/patterns/
mv improvement-plan.md development/
mv integration-guide.md development/
mv ipps-integration-guide.md integrations/payment/
mv maintenance-templates.md maintenance/
mv migration_nextjs15_SSR_tracking.md development/
mv mobile-patterns.md development/patterns/
mv multi-service-implementation.md features/
mv multi-service-quotations.md features/quotations/
mv realtime.md features/
mv troubleshooting-guide.md development/
mv typescript-patterns.md development/patterns/

# Testing
mv TESTING.md testing/

# Security
mv SECURITY_FIXES.md security/

# Deployment
mv "DEPLOYMENT-GUIDE ADVANCED EMAIL SYSTEM.md" deployment/
mv deployment-guide-vehicle-inspection.md deployment/

# Storybook
mv STORYBOOK_COMPLETE.md development/
mv STORYBOOK_ENHANCED.md development/

# Other files
mv DATE_FORMAT_UPDATE.md features/
mv FONT-SYSTEM.md development/patterns/
mv URGENT_DATABASE_FIX.md optimization/database/
mv VERCEL_CRON_SETUP.md deployment/vercel/
mv ENCODING_FIX_STEP_BY_STEP.md features/inspections/

echo "Reorganization complete!"
echo "Files have been moved to appropriate directories with lowercase names."
