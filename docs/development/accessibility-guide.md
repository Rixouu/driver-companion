# Accessibility Guide

This document outlines accessibility improvements and considerations for the Vehicle Inspection System.

## ARIA Labels (Task 12.1)

Adding comprehensive ARIA (Accessible Rich Internet Applications) labels to interactive elements is crucial for screen reader users.

### General Principles

- **Interactive Elements**: All interactive elements (buttons, links, inputs, etc.) must have a descriptive accessible name.
- **Dynamic Content**: If content changes dynamically (e.g., search results, status updates), use ARIA live regions (`aria-live`, `aria-atomic`, `aria-relevant`) or provide clear notifications.
- **Icons**: Icon-only buttons must have an `aria-label` or visually hidden text that describes their function.
- **Redundancy**: Avoid redundant ARIA labels if the visible text label is already descriptive and correctly associated with the element (e.g., via `htmlFor` for form inputs).

### Component-Specific Tracking

- **`components/data-table-toolbar.tsx`**: 
    - Status: ✅ Reviewed & Largely Complete.
    - Notes:
        - Search input: Uses `searchPlaceholder` prop for `aria-label`, defaults to "Search table data". This is good.
        - Column toggle button: Has `aria-label="Toggle column visibility"`. This is clear.
        - `DropdownMenuCheckboxItem` for column names: Uses the `column.id` as text, which is generally acceptable if column IDs are human-readable.

- **`components/data-table-desktop-view.tsx`**:
    - Status: ✅ Reviewed.
    - Notes:
        - Uses semantic HTML table elements via Shadcn UI `Table` components, which is good for base accessibility.
        - ARIA attributes for sortable headers (`aria-sort`) or interactive cell content would depend on `columnDefs` and are not directly managed by this component.
        - Consider adding a `<caption>` for overall table description if not provided by a wrapping component or title.
        - If rows are selectable, `aria-selected` on `TableRow` could be beneficial.

- **`components/data-table-mobile-view.tsx`**:
    - Status: ✅ Reviewed.
    - Notes:
        - Renders each row as a `Card`. Consider `role="group"` on the `Card` with an `aria-labelledby` pointing to a primary identifier within the card for better context, especially for the actions.
        - Key-value pairs for data are generally acceptable. 
        - Critical: Interactive elements within the "actions" cell (rendered via `flexRender`) MUST have descriptive accessible names (e.g., `aria-label="Edit [Item Name]"`). This is configured in the `columnDef` for the actions column.
        - The "No results." message is clear; `role="status"` and `aria-live="polite"` could be added if it appears dynamically.

- **`components/ui/data-table-pagination.tsx`**:
    - Status: ✅ Reviewed & Updated.
    - Notes:
        - Most navigation buttons (first, previous, next, last, page numbers) already had good `aria-label`s and `aria-current`.
        - "Go to page" input also had an `aria-label`.
        - Added `aria-label="Select number of rows per page"` to the `SelectTrigger` for page size.
        - Added `aria-live="polite"` and `aria-atomic="true"` to the summary section to announce dynamic updates (e.g., "Showing X-Y of Z items") to screen readers.

- **`components/data-table.tsx` (Main Wrapper)**:
    - Status: ✅ Reviewed & Updated.
    - Notes:
        - Orchestrates toolbar, desktop/mobile views, and pagination.
        - Added an optional `tableTitle` prop.
        - If `tableTitle` is provided, it's rendered as a visually hidden `<h2>` (using `sr-only` class) with a unique ID.
        - The main `div` wrapper of the data table now has `role="region"` and `aria-labelledby` pointing to this hidden title's ID, providing an accessible name for the entire data table region.

- **Next Component to Review**: (Consider components used within table cells if they are complex and interactive, e.g., custom action buttons or complex data rendering beyond simple text).

## Keyboard Navigation (Task 12.2)

Ensuring all functionality is accessible via keyboard is crucial for users who cannot use a mouse.

### General Principles:

- **Focus Visible**: All interactive elements must have a clear visible focus indicator.
- **Logical Focus Order**: The order in which elements receive focus when tabbing should be logical and intuitive, generally following the visual layout.
- **No Keyboard Traps**: Focus should never get stuck in a component; users must always be able to tab out.
- **Standard Controls**: Standard HTML controls (`<button>`, `<input>`, `<a>`, etc.) and well-built UI library components (like those from Shadcn UI/Radix UI) usually have good built-in keyboard support.
    - **Buttons, Links**: Activatable with `Enter` and `Space` (for buttons).
    - **Inputs, Textareas**: Standard text input behavior.
    - **Selects, Dropdowns**: Navigable with arrow keys, selection with `Enter`/`Space`, closable with `Escape`.
- **Custom Widgets**: Custom interactive components need careful implementation of keyboard support (e.g., using appropriate `tabindex` values, event handlers for arrow keys, `Enter`, `Space`, `Escape`).

### Component-Specific Tracking / Review:

- **Data Table Components (`DataTable`, `DataTableToolbar`, `DataTablePagination`, `DataTableDesktopView`, `DataTableMobileView`)**:
    - Status: 🚧 Reviewing...
    - **Focus Order**: Manually tab through the entire data table structure. Verify that focus moves logically from toolbar elements, to table content (if interactive), to pagination elements.
    - **Toolbar (`DataTableToolbar`)**:
        - Search Input: Verify standard input keyboard behavior.
        - Column Visibility (`DropdownMenu`): Verify it can be opened (`Enter`/`Space`), items navigated (`ArrowUp`/`ArrowDown`), items selected (`Enter`/`Space`), and closed (`Escape`).
    - **Pagination (`DataTablePagination`)**:
        - Navigation Buttons (First, Prev, Next, Last, Page Numbers): Verify activation with `Enter`/`Space`.
        - Page Size Selector (`Select`): Verify it can be opened, items navigated, item selected, and closed using keyboard.
        - "Go to page" Input: Verify standard input behavior.
    - **Desktop View (`DataTableDesktopView`)**:
        - If cells contain interactive elements (defined in `columnDefs`), ensure they are focusable and operable via keyboard.
        - If the table implements row selection or cell navigation (grid-like behavior), ensure appropriate arrow key navigation is supported (currently not implemented, uses standard table semantics).
    - **Mobile View (`DataTableMobileView`)**:
        - Ensure focus moves logically through elements within each card, especially to any action buttons.
        - Action buttons (from `columnDefs`) must be operable via keyboard.

- **Next Component to Review**: (To be filled)

## Skip Navigation Links (Task 12.3)

Skip links allow keyboard users to bypass repetitive blocks of content (like headers and navigation) and jump directly to the main content.

- **Status**: ✅ Implemented (in `app/layout.tsx`)
- **Implementation Details**:
    - A link with `href="#main-content"` and text "Skip to main content" has been added as the first focusable element in `app/layout.tsx`.
    - It uses Tailwind CSS classes (`sr-only focus:not-sr-only focus:absolute ...`) to be visually hidden until it receives keyboard focus, at which point it becomes visible at the top of the page.
    - **Requirement**: For this link to function correctly, the primary content area on each page or in relevant sub-layouts **must** have `id="main-content"` and `tabindex="-1"` to allow it to be programmatically focused.

## Focus Management (Task 12.4)

Proper focus management is essential for guiding keyboard users through an application, especially when content changes dynamically or modals appear.

### General Principles:

- **Initial Focus**: On page/view load, set focus to a logical starting point (e.g., main heading, first interactive element after skip link target).
- **Modals/Dialogs (e.g., `Dialog`, `AlertDialog`, `Sheet` from Shadcn UI):
    - When opened, focus must move into the modal.
    - Focus must be trapped within the modal.
    - When closed, focus must return to the element that triggered it (or a logical fallback).
    - Shadcn UI components generally handle this well.
- **Dynamic Content**: When new interactive elements appear or sections expand/collapse, ensure focus is managed predictably. Sometimes moving focus is appropriate; other times, let the user navigate.
- **Notifications/Toasts**: Should not steal focus. Use ARIA live regions for announcements.
- **Element Removal**: If an action removes the focused element, move focus to a logical successor (e.g., next item, parent container, or a status message).
- **Visible Focus Indicator**: Always ensure a clear, visible focus indicator on the focused element (covered by keyboard navigation principles).

### Component-Specific Tracking / Review:

- **Modals/Dialogs (General)**:
    - Status: 🚧 Reviewing...
    - Primarily rely on Shadcn UI/Radix UI components (`Dialog`, `AlertDialog`, `Sheet`, `Popover`, `DropdownMenu`) for correct focus trapping, restoration, and initial focus within the component.
    - Verify that these components are used according to their documentation for optimal accessibility.

- **`PhotoViewerModal.tsx`** (Specific example of a modal):
    - Status: ✅ Reviewed & Updated.
    - Notes:
        - Uses Shadcn UI `Dialog` which handles core focus trapping and restoration.
        - Replaced `title` attributes with `aria-label` on internal Download and Close buttons for robust accessible names.

- **Next Component/Pattern to Review**: (To be filled, e.g., forms with dynamic validation, accordions)

## Screen Reader Testing (Task 12.5)

Manual testing with screen readers is essential to understand the actual user experience for visually impaired users.

- **Status**: 🟡 MANUAL TASK
- **Process**:
    - **Tools**: Use popular screen readers like NVDA (Windows, free), JAWS (Windows, paid), VoiceOver (macOS/iOS, built-in), TalkBack (Android, built-in).
    - **Key Areas to Test**:
        - **Overall Page Navigation**: Can users understand the page structure and navigate through headings, landmarks, and links?
        - **Interactive Elements**: Are all buttons, links, form fields, and custom controls announced correctly and operable?
        - **ARIA Implementations**: Verify that ARIA labels, roles, and states (e.g., `aria-expanded`, `aria-current`, `aria-live`) provide the intended context and information.
        - **Dynamic Content**: Are changes (e.g., search results, form errors, notifications) announced appropriately?
        - **Modals/Dialogs**: Is focus correctly managed? Is the content within the modal announced properly? Can the modal be closed easily?
        - **Data Tables**: Can users navigate table headers and data cells? Is table structure (rows, columns) clear? Are actions per row accessible?
    - **Common Browsers**: Test in commonly used browsers (Chrome, Firefox, Safari, Edge) as screen reader behavior can sometimes vary.
    - **Documentation**: Document any issues found with steps to reproduce and expected behavior.

## Color Contrast (Task 12.6)

Ensuring sufficient color contrast between text and its background, and for UI components and graphical objects, is vital for users with low vision and benefits all users.

- **Status**: 🟡 MANUAL TASK / 🚧 IN PROGRESS (if tools are used for audit)
- **Guidelines**: Adhere to WCAG 2.1/2.2 Level AA contrast ratios:
    - **4.5:1** for normal text.
    - **3:1** for large text (18pt or 14pt bold).
    - **3:1** for graphical objects and user interface components (e.g., button borders, input borders, icons without text).
- **Tools for Checking Contrast**:
    - **Browser Developer Tools**: Most browsers (Chrome, Firefox, Edge, Safari) have built-in color pickers or accessibility inspectors that show contrast ratios.
    - **Online Contrast Checkers**: Numerous web-based tools (e.g., WebAIM Contrast Checker, Adobe Color Contrast Analyzer).
    - **Browser Extensions**: Extensions like Axe DevTools, WAVE, or Accessibility Insights for Web can help identify contrast issues.
- **Process**:
    - Systematically review all common UI elements: text, buttons, inputs, links, icons, charts, etc.
    - Check text on various backgrounds, including disabled states and focused states.
    - Pay special attention to text within images or on gradient backgrounds.
    - If issues are found, adjust color palettes (e.g., Tailwind CSS theme configuration in `tailwind.config.js` or specific component styles) to meet requirements.
    - Document any systemic color changes and decisions.

## Accessibility Testing in CI (Task 12.7)

Integrating automated accessibility tests into the CI/CD pipeline helps catch issues early and maintain a baseline level of accessibility.

- **Status**: 🚧 TO DO
- **Tools**: Consider tools like:
    - **Axe-core**: A popular accessibility testing engine. Can be integrated with testing frameworks like Vitest/Jest (e.g., using `jest-axe`) or E2E testing tools (e.g., Playwright, Cypress).
    - **Lighthouse CI**: Can run Lighthouse audits (which include accessibility checks) as part of the CI process.
    - **Playwright/Cypress with Axe**: These E2E testing tools can inject Axe-core into pages and report violations.
- **Strategy**:
    - **Unit/Integration Tests**: For component-level checks, use `jest-axe` with Vitest/Jest. This checks rendered DOM against Axe rules.
        - Example (Vitest/React Testing Library):
          ```typescript
          import { render } from '@testing-library/react';
          import { axe, toHaveNoViolations } from 'jest-axe';
          import YourComponent from './YourComponent';

          expect.extend(toHaveNoViolations);

          it('should have no axe violations', async () => {
            const { container } = render(<YourComponent />);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
          });
          ```
    - **E2E Tests**: For page-level checks, integrate Axe with Playwright or Cypress. This allows testing full pages in a real browser environment.
        - Example (Playwright with `axe-playwright`):
          ```typescript
          import { test, expect } from '@playwright/test';
          import AxeBuilder from '@axe-core/playwright';

          test('should not have any automatically detectable accessibility issues', async ({ page }) => {
            await page.goto('/your-page');
            const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
            expect(accessibilityScanResults.violations).toEqual([]);
          });
          ```
    - **Configuration**: Configure Axe to specific WCAG levels (e.g., AA) and rules.
    - **Reporting**: Ensure CI logs clearly report accessibility violations.
    - **Baseline**: Start with a few key pages or components and gradually expand coverage.
    - **Note**: Automated tools can only catch a subset of accessibility issues (typically 30-50%). Manual testing (especially screen reader testing) remains crucial.
- **Next Steps**:
    - Choose a primary tool/strategy (e.g., `jest-axe` for components, Playwright with Axe for E2E).
    - Install necessary dependencies.
    - Add initial accessibility tests to a few key components/pages.
    - Configure CI workflow (e.g., GitHub Actions) to run these tests. 