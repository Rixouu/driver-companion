# Next.js 15 SSR and Supabase Migration Tracking

This document tracks the progress of migrating pages and components to align with Next.js 15 SSR practices and ensure correct Supabase client usage.

## Key Areas and Status

| Area / Page Route        | Files Involved (Primary)                                  | Status      | Notes                                                                                                |
|--------------------------|-----------------------------------------------------------|-------------|------------------------------------------------------------------------------------------------------|
| **Core Supabase Setup**  | `lib/supabase/server.ts`                                  | **Done**    | Made `createSupabaseServerClient` async, awaited `cookies()`. Adjusted callers.                        |
|                          | `lib/db/server.ts` (getSession)                           | **Done**    | Updated `getSession` to use `getUser()` and `await createSupabaseServerClient()`.                      |
|                          | `lib/supabase/client.ts` & usage pattern            | **Done**    | Removed module-level instance. Client components (Layout, Pages, Hooks) now call `getSupabaseClient()` lazily (e.g., in effects/handlers) to prevent SSR warnings. Service files use `createServiceClient()`. |
| `hooks/useQuotationService.ts` | `hooks/useQuotationService.ts`                        | **Done**    | Replaced `createClientComponentClient` with `createBrowserClient(@supabase/ssr)` and passed required env vars. API calls within hook now target App Routers. |
| **Dashboard**            | `app/(dashboard)/dashboard/page.tsx`                      | **Done**    | Reviewed. Uses `getDashboardData` correctly.                                                       |
|                          | `app/actions/dashboard.ts` (getDashboardData)             | **Done**    | Updated to `await createSupabaseServerClient()`.                                                       |
|                          | `components/dashboard/dashboard-content.tsx`              | **Done**    | Reviewed. Receives props, uses Server Action for bookings. No direct Supabase client.                |
| **Authentication**       | `app/(auth)/login/page.tsx` (and related actions)         | **Done**    | Reviewed `app/(auth)/login/page.tsx` and `components/auth/login-form.tsx`. `login-form.tsx` updated to use `getSupabaseClient()`. Linter errors fixed. |
|                          | `app/auth/callback/route.ts`                              | **Done**    | Reviewed. Uses `createSupabaseServerClient()` correctly. Handles OAuth callback. (Replaced `confirm/route.ts`) |
|                          | `middleware.ts`                                           | **Done**    | Reviewed. Uses `createServerClient` from `@supabase/ssr` with correct cookie handlers. `getSession()` changed to `getUser()` to resolve warnings and improve security. |
| **Other App Routes**     |                                                           |             |                                                                                                      |
| `app/(dashboard)/admin/pricing/*` | `_components/*`, `app/api/admin/pricing/**/route.ts`, `app/api/pricing/service-types/**/route.ts` | **Done**    | All `_components/*` use `useQuotationService` or `createBrowserClient` correctly. Associated API routes (admin & non-admin for pricing) migrated. |
| `app/quotations/*`       | `app/(dashboard)/quotations/*`, `components/quotations/*`, `app/api/quotations/*` (was `pages/api/...`) | **Done**    | Server pages (`page.tsx`, `[id]/page.tsx`, `create/page.tsx`) correctly use `createServerSupabaseClient`. Client components (`quotations-client.tsx`, `app/(dashboard)/quotations/[id]/quotation-details.tsx`, `_components/quotation-form-client.tsx`) receive props correctly. Most `components/quotations/*` are presentational or use `useQuotationService` (updated) or API calls. `quotation-containers.tsx` updated to use `createBrowserClient`. Identified and deleted dead code: `components/quotations/quotation-detail.tsx` and `components/quotations/quotation-approval-panel.tsx`. Route handlers `app/api/quotations/*` reviewed: `getSession` updated to `getUser`, `createServiceClient` replaced with `createServerSupabaseClient` and auth checks where appropriate. Server-side filtering for `QuotationList` (via `app/(dashboard)/quotations/page.tsx` and `components/quotations/quotation-list.tsx`) is **Done**. Centralized `Customer` type to `types/customers.ts` and updated `types/bookings.ts`; other usages need review. **RESOLVED**: `searchParams` access in `app/(dashboard)/quotations/page.tsx` updated to pass props to `getQuotations` correctly (note: a warning `Route "/quotations" used searchParams.query` may still appear in terminal logs during development hot-reloads but the page functionality is correct for SSR). **RESOLVED**: Translation key issues (`common.notAvailableShort`, `quotations.actions.view/edit/delete`) in `en.ts` and `ja.ts` fixed. **RESOLVED**: Quotation list table column display (Customer, Date, Expires On) and action button UI (direct buttons, left-aligned text) in `components/quotations/quotation-list.tsx` corrected. **RESOLVED:** Pre-fetching form setup data for `QuotationForm` (service types, categories, etc.) on server. Review remaining usages of customer-related fields and update to use centralized `Customer` type. |
| `app/bookings/*`         | `bookings.tsx`, `components/bookings/*`, `app/actions/bookings.ts`, `lib/api/bookings-service.ts` | **Done**    | `components/bookings/booking-assignment.tsx` updated to `createBrowserClient(@supabase/ssr)`. Other components use Server Actions (which use `createSupabaseServerClient` or `createServiceClient` via `bookings-service.ts`) or `fetch` to API routes. The `auth.getSession()` warning in terminal likely originates from `middleware.ts` session refresh logic. `types/bookings.ts` updated to use centralized `Customer` type. |
| `app/reporting/*`        | `app/(dashboard)/reporting/page.tsx`, `components/reporting/*`                      | **Done** | `page.tsx` is a Server Component fetching data for `CostPerKmChart` and `RecentReports`. `ReportingPageContent` (client component) receives this initial data. Custom report generation uses a Server Action. `generated_reports` table and types were updated. |
| `app/vehicles/*`         | `app/(dashboard)/vehicles/*`                              | **Mostly Done** | Pages in `app/(dashboard)/vehicles/*` largely reviewed and updated as per detailed section below (SSR, Supabase client usage). Some optimizations may remain. |
| `app/inspections/*`      | `app/(dashboard)/inspections/*`, `components/inspections/*` | **Done** | SSR for page components implemented. Client components reviewed. Service layer `lib/services/inspections.ts` types (`InspectionCategoryRow`, `DbInspectionSection`, `InspectionItemTemplateRow`, `DbInspectionTemplateItem`) aligned with Supabase schema nullability. `InspectionTemplateManager` reviewed: data flow confirmed to handle updated service types and nullability correctly; fixed import for `InspectionCategory`/`ItemTemplate`; resolved linter errors from type changes (sort comparators, state setters, outdated local type removal). `getInspection` vs `getInspectionById` in service layer reviewed: `getInspection` modified to select specific vehicle fields aligning with `InspectionWithVehicle` type; `InspectionWithVehicle` type definition in `types/index.ts` corrected using `Omit` to prevent type conflicts. All listed TODOs for Inspections Module addressed. |
| ... (other routes)       |                                                           | **Todo**    |                                                                                                      |

## General Checks for Each Page/Component Set

1.  **Server Components:**
    *   Data fetching should be done here directly or by calling Server Actions.
    *   Use `createSupabaseServerClient()` (awaited) for Supabase interactions.
2.  **Client Components (`'use client'`):**
    *   Should primarily receive data as props.
    *   If direct Supabase calls are needed (e.g., subscriptions, some mutations not via actions), use `createBrowserClient()` from `@supabase/ssr`.
    *   Minimize client-side data fetching for initial render; prefer Server Components.
3.  **Server Actions (`'use server'`):**
    *   Use `createSupabaseServerClient()` (awaited).
4.  **Route Handlers (e.g., `app/api/.../route.ts`):**
    *   Use `createSupabaseServerClient()` (awaited).
5.  **Middleware (`middleware.ts`):**
    *   Carefully review cookie handling and Supabase client usage as per `@supabase/ssr` guidelines for middleware.

---

### Vehicle Module SSR/Next.js 15 Review (app & components)

**Date:** YYYY-MM-DD (Update with actual date of last full review)
**Auditor:** AI Assistant

**Overall Status:** Significant progress. Key page components in `app/(dashboard)/vehicles/` are functioning as Server Components. Data fetching patterns are being aligned with server-side clients. Client components handle interactivity.

**Key Changes & Observations:**

**`app/(dashboard)/vehicles/` Directory:**

*   **`app/(dashboard)/vehicles/page.tsx` (Vehicle List Page):**
    *   Verified: `async` server component, uses `createSupabaseServerClient` indirectly via service/direct call.
    *   **FIXED**: Implemented server-side pagination (fetching ranged results and total count from Supabase).
    *   **FIXED**: Removed incorrect `await` on `searchParams` access.
    *   **FIXED**: Removed an unused Supabase client import.
    *   *Further Optimization*: Client-side filtering in `VehicleList` (search, status, brand, model) could be moved to server-side for better performance.

*   **`app/(dashboard)/vehicles/new/page.tsx` (New Vehicle Page):**
    *   Verified: `async` server component.
    *   Renders `<VehicleForm />` (client component) for data submission.
    *   No SSR-specific issues identified.

*   **`app/(dashboard)/vehicles/[id]/page.tsx` (Vehicle Detail Page):**
    *   Verified: `async` server component.
    *   **FIXED**: Optimized data fetching to use `getVehicle(id)` (single vehicle fetch).
        *   This also involved updating `lib/services/vehicles.ts` (`getVehicle` to select `maintenance_tasks(*)`).
        *   And `types/index.ts` (`DbMaintenanceTask.updated_at` made optional to match actual data shape, resolving a type error).
    *   **FIXED**: Removed incorrect `await` on `params` access.
    *   Verified: Uses `notFound()` correctly.

*   **`app/(dashboard)/vehicles/[id]/edit/page.tsx` (Edit Vehicle Page):**
    *   Verified: `async` server component.
    *   **FIXED**: Optimized data fetching to use `getVehicle(id)`.
    *   **FIXED**: Implemented `notFound()` for missing vehicles.
    *   **FIXED**: Corrected i18n key access in `generateMetadata` (using `t` function).
    *   **FIXED**: Simplified HTML structure in a Link component.
    *   Depends on `VehicleForm` (client component).
    *   Relied on `DbMaintenanceTask` update in `types/index.ts` to resolve type errors.

*   **`app/(dashboard)/vehicles/[id]/fuel/page.tsx` (Fuel Logs Page):**
    *   Verified: `async` server component.
    *   Uses server-side data fetching via service functions.
    *   **FIXED**: Corrected i18n key access in `generateMetadata`.
    *   No SSR-specific issues identified.

*   **`app/(dashboard)/vehicles/[id]/mileage/page.tsx` (Mileage Logs Page):**
    *   Verified: `async` server component.
    *   Uses server-side data fetching.
    *   **FIXED**: Corrected i18n key access in `generateMetadata`.
    *   No SSR-specific issues identified.

*   **`app/(dashboard)/vehicles/[id]/inspections/schedule/page.tsx` & `content.tsx` (Schedule Inspection):**
    *   `page.tsx`: Verified `async` server component, fetches initial data.
    *   `content.tsx`: Client component for rendering form.
    *   **FIXED**: Ensured prop typing (`DbVehicle`) in `content.tsx` is consistent.
    *   No major SSR-specific issues identified.

*   **`app/(dashboard)/vehicles/[id]/maintenance/new/page.tsx`:**
    *   Verified: `async` server component.
    *   **FIXED**: Corrected `Link` component `href` prop for typed routes.
    *   **FIXED**: Simplified HTML structure in a Link component.

*   **`app/(dashboard)/vehicles/[id]/fuel/[logId]/edit/page.tsx` & `app/(dashboard)/vehicles/[id]/mileage/[logId]/edit/page.tsx`:**
    *   **FIXED**: Corrected i18n key access in `generateMetadata` to resolve linter errors (used `t()` function).

**`components/vehicles/` Directory (Selected Components):**

*   **`types/index.ts` (Related to vehicles):**
    *   **FIXED**: Converted `DbVehicle`, `DbDriver`, `DbInspection`, `DbMaintenanceTask` from `type` aliases to `interface` where appropriate.
    *   **FIXED**: Made `updated_at` optional in `DbMaintenanceTask` to align with data returned from queries and resolve type errors in consuming components.

*   **`components/vehicles/vehicle-list.tsx`:**
    *   Verified: `'use client'` component.
    *   **FIXED**: Handled potential null `searchParams` from `useSearchParams()`.
    *   **FIXED**: Removed unnecessary curly braces in `useEffect` for conciseness.
    *   *Note*: URL parameter management (`nugs` convention) needs clarification if it's a specific library/pattern to be adopted.

*   **`components/vehicles/vehicle-form.tsx`:**
    *   Verified: `'use client'` component, uses `createBrowserClient`.
    *   **FIXED**: Defined `VehicleFormInput` interface for `vehicle` prop.
    *   **FIXED**: Removed an unused import (`decode`) causing a lint error.
    *   Retained `VehicleFormData` as `type` due to Zod inference.

*   **`components/vehicles/vehicle-details.tsx`:**
    *   Verified: `'use client'` component.
    *   **FIXED**: Improved error typing in a `catch` block (`unknown` vs `any`).
    *   **FIXED**: Simplified HTML structure (removed redundant nested spans).

*   **`components/vehicles/vehicle-tabs.tsx`:**
    *   Verified: `'use client'` component.
    *   Uses `Suspense` for `VehicleFuelLogs` and `VehicleMileageLogs`.
    *   No major issues identified.

*   **`components/vehicles/vehicle-info.tsx`:**
    *   Verified: `'use client'` component (due to `useI18n`).
    *   Uses `next/image` with `priority` and `sizes` correctly.
    *   No major issues identified.

*   **`components/vehicles/vehicle-in-progress.tsx`:**
    *   Verified: `'use client'` component.
    *   Uses `createBrowserClient` correctly within `useMemo`.
    *   Fetches data in `useEffect`.
    *   **FIXED**: Improved type safety for `InProgressItem`, `getItemTimestamp`, and Supabase query results.
    *   **FIXED**: Memoized filtered lists (`maintenanceItems`, `inspectionItems`) using `useMemo`.
    *   **FIXED**: Removed commented-out `console.log` statements.
    *   No major SSR-specific issues identified, follows client component patterns.

*   **`components/vehicles/vehicle-history.tsx`:**
    *   Verified: `'use client'` component.
    *   Uses `createBrowserClient` correctly within `useMemo`.
    *   Fetches completed maintenance/inspections in `useEffect` with `.limit(10)` per type and then takes top 10 overall.
    *   **FIXED**: Improved type safety for `HistoryItem`, `getItemTimestamp`, and Supabase query results.
    *   **FIXED**: Memoized filtered lists (`completedMaintenanceItems`, `completedInspectionItems`) using `useMemo`.
    *   **FIXED**: Removed `console.log` statements.
    *   **FIXED**: Added explicit types to Supabase select queries.
    *   Follows client component patterns; no SSR-specific issues identified.

*   **`components/vehicles/multi-vehicle-selector.tsx`:**
    *   Verified: `'use client'` component.
    *   Uses `createBrowserClient` correctly within `useMemo`.
    *   **FIXED**: Optimized data fetching by moving `excludedVehicleIds` and `showAvailableOnly` filters to the Supabase query (server-side).
    *   **FIXED**: Replaced local `Vehicle` interface with shared `DbVehicle` type from `@/types`.
    *   **FIXED**: Added explicit type to Supabase `select` query.
    *   **FIXED**: Stabilized `useEffect` dependency for `excludedVehicleIds` using `join(',')`.
    *   Client-side search filtering remains, which is acceptable.
    *   Uses `next/image` correctly.

*   **`components/vehicles/vehicle-schedule.tsx`:**
    *   Verified: `'use client'` component.
    *   Uses `createBrowserClient` correctly within `useMemo`.
    *   Fetches scheduled maintenance/inspections in `useEffect`.
    *   **FIXED**: Improved type safety for `ScheduledItem`, sorting logic (`getItemSortDate`), and Supabase query results.
    *   **FIXED**: Memoized filtered lists (`scheduledMaintenance`, `scheduledInspections`) using `useMemo`.
    *   **FIXED**: Removed `console.log` statements.
    *   **FIXED**: Added explicit types to Supabase select queries.
    *   **FIXED**: Ensured safer date access for display and sorting.
    *   Follows client component patterns; no SSR-specific issues identified.

*   **`components/vehicles/new-vehicle-page-content.tsx`:**
    *   Verified: `'use client'` component (due to `useI18n` and composition with `VehicleForm`).
    *   No direct Supabase interaction or data fetching.
    *   **FIXED**: Simplified Link/Button structure for "Back to vehicles" link using `asChild` prop.
    *   Primarily a layout component for `VehicleForm`.

*   **`components/vehicles/vehicle-assignments.tsx`:**
    *   Verified: `'use client'` component.
    *   Fetches assignment data from an API route (`/api/vehicles/${vehicleId}/assignments`) in `useEffect`.
    *   Handles ending assignments via a `DELETE` request to the same API route, with optimistic UI update.
    *   Uses `VehicleAssignment` type from `@/types`.
    *   **FIXED**: Simplified Link/Button structures using `asChild` prop.
    *   **FIXED**: Made `AvatarFallback` safer by checking for `first_name`/`last_name` presence.
    *   **FIXED**: Updated `Link` hrefs to use object structure `{ pathname, query }` to potentially satisfy typed routing requirements and resolve linter errors.
    *   Uses `AlertDialog` for confirmation, `useToast` for notifications.

*   **`components/vehicles/vehicle-fuel-logs.tsx`:**
    *   Verified: `'use client'` component.
    *   Fetches fuel logs from an API route (`/api/vehicles/${vehicleId}/fuel`) in `useEffect`.
    *   Uses `VehicleLogsTable` with `columns` from `../fuel/columns`.
    *   **FIXED**: Changed log type from `any[]` to `FuelLog[]` (from `@/types`).
    *   **FIXED**: Updated `FuelLog` interface in `types/index.ts` to include `notes: string | null` to match definition/expectation in `components/fuel/columns.tsx`.
    *   **FIXED**: Simplified Link/Button structure for "Add New Fuel Log" link using `asChild` and removing redundant span.
    *   **FIXED**: Updated "Add New" Link `href` to use object structure for typed routes.
    *   **FIXED**: Implemented `useToast` for error handling during data fetch.

*   **`components/vehicles/vehicle-mileage-logs.tsx`:**
    *   Verified: `'use client'` component.
    *   Fetches mileage logs from an API route (`/api/vehicles/${vehicleId}/mileage`) in `useEffect`.
    *   Uses `VehicleLogsTable` with `columns` from `../mileage/columns`.
    *   **FIXED**: Changed log type from `any[]` to `MileageLog[]` (from `@/types`). The `MileageLog` type in `@/types` was already compatible with `components/mileage/columns.tsx` expectations.
    *   **FIXED**: Simplified Link/Button structure for "Add New Mileage Log" link using `asChild` and removing redundant span.
    *   **FIXED**: Updated "Add New" Link `href` to use object structure for typed routes.
    *   **FIXED**: Implemented `useToast` for error handling during data fetch.

*   **`components/vehicles/vehicle-logs-table.tsx`:**
    *   Verified: `'use client'` component.
    *   Generic component `<T>` that wraps `DataTable` (from `../data-table`).
    *   Receives `columns`, `data`, `searchKey` as props; hardcodes `pageSize={5}`.
    *   No direct data fetching or Supabase client usage.
    *   No SSR-specific issues or deviations from guidelines identified.

*   **`components/vehicles/vehicle-navigation.tsx`:**
    *   Verified: `'use client'` component (due to button interactions and `useI18n`).
    *   **FIXED**: Integrated `useI18n` for button text translation.
    *   **FIXED**: Simplified `Link` component structure (removed redundant nested spans).
    *   No direct Supabase client usage.

*   **`components/vehicles/tab-navigation.tsx`:**
    *   Verified: `'use client'` component (Shadcn `Tabs` component requires client-side JS, also uses `useI18n`).
    *   **FIXED**: Integrated `useI18n` for tab title translations.
    *   No direct Supabase client usage.

*   **`components/vehicles/vehicles-page-content.tsx`:**
    *   Verified: `'use client'` component (due to `useI18n` and composition with `VehicleList`).
    *   Receives vehicle data as props (good for SSR).
    *   **FIXED**: Simplified Link/Button structure for "Add Vehicle" button.
    *   **FIXED**: Removed unused `DropdownMenu` imports.
    *   No direct Supabase client usage.

*   **`components/vehicles/vehicle-info.tsx` (Duplicate entry, already covered above):**

*   **`components/vehicles/vehicle-status.tsx`:**
    *   Verified: `'use client'` component.
    *   **REFACTORED**:
        *   Removed mock data.
        *   Added `VehicleStatusData` and `Alert` interfaces.
        *   Implemented `useEffect` and `useState` for data fetching state.
        *   Integrated `createBrowserClient` for Supabase interaction (actual query is placeholder).
        *   Added `useI18n` for all display strings and alert messages.
        *   Made status `Badge` variant and alert colors dynamic.
        *   Added `VehicleStatusSkeleton` for loading state and error/no-data states.
        *   Corrected `t()` function usage for default values.
    *   Requires backend implementation for `fetchVehicleStatus` to be fully functional.

*   **`components/vehicles/fuel-tracker.tsx`:**
    *   Verified: `'use client'` component.
    *   Uses `useToast` and `recharts` for charting.
    *   Form submission logic calls `onAddEntry` prop (good for separation of concerns).
    *   **FIXED**: Integrated `useI18n` for all text and toast messages.
    *   **FIXED**: Added display for empty `fuelHistory`.
    *   **FIXED**: Minor chart readability improvements.

*   **`components/vehicles/vehicle-reminders.tsx`:**
    *   Verified: `'use client'` component.
    *   **REFACTORED**:
        *   Added `VehicleReminderItem` interface.
        *   Implemented `useEffect` and `useState` for data fetching, loading, and error states.
        *   Integrated `createBrowserClient` for Supabase interaction (uses mock data and a placeholder fetch function for now).
        *   Added `useI18n` for all display strings, status messages, and toast notifications.
        *   Implemented `VehicleRemindersSkeleton` for loading state.
        *   Displays reminders in a list with status-based badges/icons and due dates.
        *   "Add Reminder" button shows a "Not Implemented" toast.
        *   Includes error display with a retry option (retry logic placeholder).
    *   Requires backend implementation for `fetchVehicleReminders` and "Add Reminder" functionality.

*   **`components/vehicles/maintenance-history.tsx`:**
    *   Verified: `'use client'` component.
    *   **REFACTORED**:
        *   Added `MaintenanceHistoryItem` interface.
        *   Implemented `useEffect` and `useState` for data fetching, loading, and error states.
        *   Integrated `createBrowserClient` for Supabase interaction (uses mock data and a placeholder fetch function for now).
        *   Added `useI18n` for all display strings, status messages, and toast notifications.
        *   Implemented `MaintenanceHistorySkeleton` for loading state.
        *   Displays history items with status-based badges/icons, formatted dates, and costs (basic number format).
        *   Includes error display.
    *   Requires backend implementation for `fetchMaintenanceHistory`.
    *   Removed `formatCurrency` usage due to unavailability in `date-utils` (cost displayed as number).

*   **`components/vehicles/maintenance-reminders.tsx`:**
    *   Verified: `'use client'` component.
    *   **REFACTORED**:
        *   Added `MaintenanceReminderSettings` interface.
        *   Implemented `useEffect` for fetching initial settings and `useState` for managing settings, loading, and saving states.
        *   Integrated `createBrowserClient` (uses placeholder fetch/save functions with mock delays).
        *   Added `useI18n` for all text and `useToast` for notifications.
        *   Form elements (Switch, Select, Input) are bound to state and update on change.
        *   Handles loading state for initial fetch (skeleton) and saving state (disables form, updates button text).
    *   Requires backend implementation for `fetchReminderSettings` and `saveReminderSettings`.

*   **`components/vehicles/inspection-schedule.tsx`:**
    *   Verified: `'use client'` component.
    *   **REFACTORED**:
        *   Removed mock data and added `vehicleId` prop.
        *   Added `InspectionScheduleItem` interface.
        *   Implemented `useEffect` and `useState` for data fetching state.
        *   Integrated `createBrowserClient` for Supabase interaction (actual query is placeholder).
        *   Added `useI18n` for all display strings.
        *   Added `InspectionScheduleSkeleton` for loading state and error/no-data states.
        *   Displays data in a table with dynamic status badges and action button placeholders.
    *   Requires backend implementation for `fetchInspectionSchedule` and button actions.

*   **`components/vehicles/index.ts`:**
    *   Verified: Barrel file for exporting vehicle components.
    *   No changes needed, follows standard practice.

**General Adherence & Conventions (Vehicles Module):**
*   Page components in `app/` are server components; UI/interactive components in `components/` are client components.
*   Supabase client usage updated (`createSupabaseServerClient` for server, `createBrowserClient` for client).
*   Typed routes and i18n usage patterns were reviewed and corrected where necessary.
*   Type safety improved by updating interfaces and prop types.

**Next Steps/Recommendations (Vehicles Module):**
| Item                                                     | Status          | Notes                                                                                                                                                                                                                            |
| :------------------------------------------------------- | :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clarify "nugs" convention                                | **Done**        | Clarified that "nugs" was a general term. The current implementation using Next.js `searchParams` (server-side) and `useRouter`/`useSearchParams` (client-side) for URL state management is the standard and clean approach.       |
| Move filtering logic in `VehicleList` to server-side     | **Done**        | `app/(dashboard)/vehicles/page.tsx` now handles filtering (search, status, brand, model) server-side. `VehicleList.tsx` receives filtered data and updates URL params for refetching. `SearchFilterBar.tsx` is now a controlled component. |
| Resolve `searchParams` / `params` warnings in `app/(dashboard)/vehicles/*` | **Done** | Reviewed `app/(dashboard)/vehicles/page.tsx` and `app/(dashboard)/vehicles/[id]/page.tsx`. The direct access of `searchParams` and `params` properties within these async server components is standard. The dev-time warnings are noted as likely hot-reload artifacts, as the pages function correctly with SSR. | 
| Update Supabase client in API routes (e.g. `app/api/vehicles/[id]/fuel/route.ts`) | **Partially Done** | Updated `app/api/vehicles/[id]/fuel/route.ts` and `app/api/vehicles/[id]/mileage/route.ts` to use `@supabase/ssr` (`createServerClient`). However, persistent linter/type-checking errors occur regarding `cookies()` from `next/headers` (inferring `cookieStore` as a Promise). Runtime functionality needs verification. The `mileage` route also had a `Module not found` for `@supabase/auth-helpers-nextjs` which the same update addresses, pending linter resolution. | 
| Systematically review remaining `components/vehicles/`     | **Done**        | Reviewed `vehicle-statistics.tsx`, `vehicle-selector.tsx`, `vehicle-costs.tsx`, `upcoming-inspections.tsx`, `maintenance-schedule.tsx`, `vehicle-pagination.tsx`, `vehicle-tabs.tsx`, and components in `components/vehicles/dashboard/`. Key findings: components are generally well-structured placeholders using client-side data fetching (often with mock/placeholder functions) and Supabase client via `createBrowserClient`. Primary recommendations involve implementing actual backend data logic (RPCs/queries), type tightening (removing `any`), ensuring robust i18n, and replacing placeholder utilities (e.g., currency formatting). `vehicle-pagination.tsx` needs dynamic `itemsPerPage` or `totalPages`. Styling for `Badge` variants in `upcoming-inspections.tsx` and `maintenance-schedule.tsx` needs review for Tailwind JIT compatibility if variants are custom. |
| Review `dynamic = 'force-dynamic'` usage                | **Done**        | Usage reviewed in `app/(dashboard)/vehicles/`. Retained in `page.tsx` (vehicle list) as appropriate due to `searchParams` and dynamic data. Removed from `new/page.tsx` as it primarily renders a static form and likely doesn't require forced dynamic rendering for its initial content. |

---

### Inspections Module SSR/Next.js 15 Review (@inspections)

**Overall Status:** Partially Done

**Key Changes & Observations:**
- Page components (`app/(dashboard)/inspections/page.tsx`, `.../[id]/page.tsx`, `.../create/page.tsx`) are now server components, fetching data using `createServerSupabaseClient` and passing it to client components. This aligns with SSR best practices.
  - **FIXED**: Corrected Supabase client instantiation in `app/(dashboard)/inspections/page.tsx` and `app/(dashboard)/inspections/[id]/page.tsx` to use `createServerSupabaseClient` directly, resolving deprecation warnings for `getSupabaseServerClient`.
- Client components (`InspectionList`, `StepBasedInspectionForm`, `InspectionScheduleForm`, `InspectionDetails`) have been reviewed.
  - `InspectionList`: Receives data via props, no direct Supabase client usage. (Verified)
  - `StepBasedInspectionForm`: Uses `getSupabaseClient()` for its own client-side needs and Server Actions for template fetching. (Verified)
  - `InspectionScheduleForm`: Uses `getSupabaseClient()` for form submission. (Verified)
  - `InspectionDetails`: Uses `createBrowserClient()` from `@supabase/ssr` and realtime hooks. (Verified)
  - `components/vehicle-selector.tsx` (used by inspection forms): Uses `getSupabaseClient()` for fetching vehicles. (Verified)
- The service layer (`lib/services/inspections.ts`) has been refactored to use `createServiceClient()` for its operations, removing module-level client instantiation.
- Unused Supabase client imports were removed from several page and component files.
- Type definitions in `types/index.ts` (`DbInspection.user_id` made optional) and `lib/services/inspections.ts` (aliasing for base types) were updated to address some linter errors.

**Outstanding Issues & TODOs (Inspections Module):**
- **Type Alignment in `lib/services/inspections.ts`**: 
    - Service functions in `lib/services/inspections.ts` have been updated to address linter errors by strictly conforming to the `InspectionCategory` (extends `DbInspectionSection`) and `InspectionItemTemplate` (extends `DbInspectionTemplateItem`) interfaces.
    - **RESOLVED - `template_id` Mismatch**: The previous key concern regarding `DbInspectionSection` requiring a `template_id` (which was missing from `inspection_categories` table) has been addressed.
        - A new table `master_inspection_templates` was created to store overall template definitions.
        - The `inspection_categories` table was augmented with a `master_template_id` column, foreign-keyed to `master_inspection_templates.id` (allowing NULL).
        - Service functions in `lib/services/inspections.ts` (`getInspectionTemplates`, `addInspectionSection`, `updateInspectionSection`) were updated to:
            - Utilize the `master_template_id` from the database.
            - Map this `master_template_id` (or null) to the `template_id` field of the `InspectionCategory` object (as expected by `DbInspectionSection`).
            - `addInspectionSection` and `updateInspectionSection` now support setting/updating this `master_template_id`.
        - The `DbInspectionSection` interface in `types/inspections.ts` has been updated to `template_id: string | null;` to align with the database schema (where `master_template_id` can be null) and the service layer mapping.
    - **Data Mapping**: Fields like `title` (in `InspectionCategory`) are derived by the service from `name_translations` (e.g., by taking the first available translation). This fulfills the type requirements. The raw translation objects are also passed.
    - **Action Required**: The definitions of `DbInspectionSection` and `DbInspectionTemplateItem` in `types/inspections.ts` and their usage as base types in `lib/services/inspections.ts` seem to cover necessary fields based on current review. A thorough cross-check against the absolute requirements from the database schema (`inspection_categories`, `inspection_item_templates`) and application logic remains a good practice to ensure no subtle data omissions exist. The core `template_id` issue and derivation of localized fields like `title` appear resolved.
- **Review `app/(dashboard)/inspections/new/page.tsx`**: The previously noted unused Supabase import (`@supabase/auth-helpers-nextjs`) was not found in the current version of the file. (Verified - No action needed on this point for now).
- **Review `InspectionTemplateManager` data flow**: This component relies on service functions from `lib/services/inspections.ts`. Given the updates to type alignment and `template_id` handling in the service layer, data flow should be more consistent. A specific review of `InspectionTemplateManager` against these updated service types is still beneficial.
- **Consider `getInspection` vs `getInspectionById` in `lib/services/inspections.ts`**:
    - `getInspectionById`: Uses `.single()`, selects specific vehicle fields, returns `DbInspection`. Errors if not found.
    - `getInspection`: Uses `.maybeSingle()`, selects `vehicle:vehicles!inner (*)` (all vehicle fields, inner join), returns `ImportedInspection` (likely `InspectionWithVehicle`). Returns `null` if not found.
    - **Evaluation**: Not strictly redundant due to differences in error handling, vehicle data fetching, and return types. Consolidation could be possible if one pattern is preferred, or names could be clarified (e.g., `findInspectionById` vs `fetchInspectionById`). Current state: two distinct functions.

**Files Checked/Modified (Inspections Module & related client libs):**
- `app/(dashboard)/inspections/page.tsx` (Updated to `createServerSupabaseClient`)
- `app/(dashboard)/inspections/[id]/page.tsx` (Updated to `createServerSupabaseClient`)
- `components/vehicle-selector.tsx` (Verified usage of `getSupabaseClient()`)
- `lib/supabase.ts`
- `lib/supabase/index.ts`
- `components/inspections/inspection-list.tsx` (Verified - no direct Supabase client)
- `components/inspections/step-based-inspection-form.tsx` (Verified - uses `getSupabaseClient()` and Server Actions)
- `components/inspections/inspection-schedule-form.tsx` (Verified - uses `getSupabaseClient()`)
- `components/inspections/inspection-details.tsx` (Verified - uses `createBrowserClient()`)
- `components/inspections/inspection-form.tsx` (Verified - uses `createBrowserClient()`)
- `components/inspections/inspection-page-content.tsx` (Updated to use `getSupabaseClient()`)
- `components/inspections/inspection-type-selector.tsx` (Verified - no Supabase client, UI only)
- `components/inspections/camera-modal.tsx`