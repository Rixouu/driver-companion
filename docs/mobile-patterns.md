# Mobile Design & Development Patterns

This document outlines key patterns and best practices for ensuring a good mobile experience in the Vehicle Inspection System.

## 1. Responsive Layouts

- **Grids**: Utilize Tailwind CSS responsive prefixes (e.g., `sm:`, `md:`, `lg:`) for grid layouts. Default to single-column layouts for mobile and expand to multiple columns on larger screens.
    - Example: `className="grid grid-cols-1 md:grid-cols-2 gap-4"`
- **Flexbox**: Use responsive flexbox utilities for arranging items. Ensure content wraps appropriately on smaller screens.
- **Viewport Units**: Use viewport units (`vh`, `vw`) judiciously, being mindful of browser compatibility and unexpected behavior (e.g., with mobile browser UI bars).
- **Hiding/Showing Elements**: Use responsive display utilities (e.g., `hidden md:block`, `md:hidden`) to show or hide content based on screen size, but ensure this doesn't negatively impact accessibility or SEO if critical content is hidden.
- **Content Width**: For main content areas, establish consistent padding. If sections need to be full-width visually (e.g., a hero banner), padding can be applied to an inner container. Use utilities like `max-w-screen-xl` or specific pixel values (`max-w-[1600px]`) on container elements (like `components/layout/page-container.tsx`) to constrain the overall content width on very large screens, while `mx-auto` centers it.

## 2. Responsive Spacing Strategy

Consistent spacing is key to a clean and usable interface across devices.

- **Base Unit**: Establish a base padding/margin unit for mobile. For example, `p-4` (1rem) is a common starting point for page-level padding.
    - *Example Implementation*: The `components/layout/page-container.tsx` component was updated to use `px-4 sm:px-6 md:px-8` to reduce excessive horizontal padding on mobile devices and provide a graduated spacing for larger screens.
- **Incremental Scaling**: Increase padding/margin consistently for larger breakpoints.
    - `sm:` breakpoint: Consider `p-6` (1.5rem)
    - `md:` breakpoint: Consider `p-8` (2rem)
- **Component-Level Spacing**: Use Tailwind's spacing scale (e.g., `space-y-4`, `gap-4`) for consistent spacing between elements within components. Adjust these with responsive prefixes as needed.
- **Avoid Compounding**: Be mindful of nested containers. If a parent container has padding, child elements might not need the same amount, or any at all, depending on the desired layout.
- **Full-Bleed Sections**: If a section needs to span the full viewport width (e.g., a hero image or a specific background color band), ensure its direct children re-establish padding if text or constrained-width content is placed within.

## 3. Forms

- **Single Column**: Labels and their corresponding input fields should stack vertically on mobile for clarity and ease of use.
- **Input Types**: Use appropriate HTML5 input types (`email`, `tel`, `number`, `date`) to trigger optimized mobile keyboards.
- **Touch Targets**: Ensure all interactive elements (inputs, buttons, selects) have a minimum touch target size of around 44x44 CSS pixels to 48x48 CSS pixels.
- **Labels**: Keep labels concise and clearly positioned above their inputs.
- **Error Handling**: Display error messages close to the relevant field, ensuring they are visible and don't disrupt the layout significantly.

## 4. Navigation

- **Simplicity**: Mobile navigation should be simple and intuitive.
- **Hamburger Menu/Drawer**: For extensive navigation, a hamburger menu opening a drawer is a common pattern.
- **Bottom Navigation**: For a few primary navigation items, a bottom navigation bar can be effective (though not currently implemented as a global pattern).
- **Back Buttons**: Ensure clear back navigation, especially in nested views.

## 5. Data Display

- **Tables**: For complex data tables, use a card-based layout on mobile where each row becomes a card displaying key information. See `components/data-table-mobile-view.tsx`.
- **Text**: Ensure text is readable with sufficient font size and line height. Avoid very long lines of text.
- **Truncation**: For long text strings in constrained spaces, consider truncation with an ellipsis, providing a way to view the full text if necessary (e.g., on tap).

## 6. Touch Gestures

- **Consideration**: While not extensively implemented, touch gestures (e.g., swipe for actions, pinch-to-zoom on images) can enhance mobile UX.
- **Libraries**: If implementing, consider libraries like `react-use-gesture`.
- **Accessibility**: Always provide keyboard alternatives for gesture-based actions.

## 7. Performance

- Refer to general performance optimization guidelines (Task 9) and specific mobile considerations (Task 13.6).
- Prioritize fast load times and smooth interactions on mobile devices.

## 8. Testing

- Test thoroughly on physical devices (iOS and Android) and use browser developer tools for emulation.
- Check different screen sizes and orientations.

## 9. Layout Template Example (Conceptual)

This conceptual structure illustrates a common responsive page layout using Tailwind CSS classes. It's a guide for structuring pages rather than a concrete, runnable component.

```html
<div class="flex flex-col min-h-screen bg-background text-foreground">
  {/* Header: Can be fixed, sticky, or scrolling. Often contains branding, main navigation links, user actions. */}
  <header class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container flex h-14 max-w-screen-2xl items-center px-4 sm:px-6 md:px-8">
      {/* Header Content (e.g., Logo, MainNav, UserNav) */}
    </div>
  </header>

  <div class="flex flex-1">
    {/* Sidebar: Typically for secondary navigation or context-specific controls.
        Hidden on mobile, shown on larger screens. Collapsible for more content space.
        The example below assumes a fixed-width sidebar on desktop.
    */}
    <aside class="hidden lg:block fixed top-14 left-0 z-30 h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-border/40 py-6 pr-6 lg:py-8">
      {/* Sidebar Content (e.g., SidebarNav component) */}
    </aside>

    {/* Main Content Area: This is where page-specific content resides.
        It should adapt to the sidebar's presence on larger screens.
        The PageContainer component often handles the padding for this area.
    */}
    <main class="flex-1 lg:pl-64"> {/* Adjust 'lg:pl-64' based on actual sidebar width */}
      {/* The PageContainer component (components/layout/page-container.tsx) applies consistent padding and max-width for the content. */}
      {/* Example usage: */}
      {/* <PageContainer> */}
      {/*   <div class="max-w-7xl mx-auto py-6"> {/* Optional inner max-width for specific content sections if PageContainer's max-width is very large or not set */}
      {/*     <h1>Page Title</h1> */}
      {/*     <p>Page-specific content goes here...</p> */}
      {/*   </div> */}
      {/* </PageContainer> */}
      {/* Actual children will be rendered here directly if PageContainer is used within MainLayout */}
       {children} 
    </main>
  </div>

  {/* Optional: Footer - Can contain copyright, links, etc. */}
  <footer class="border-t border-border/40">
    <div class="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0 px-4 sm:px-6 md:px-8">
      {/* Footer Content */}
    </div>
  </footer>

  {/* Mobile Navigation: Often fixed to the bottom or integrated into a collapsible header menu.
      Shown only on smaller screens.
  */}
  <nav class="lg:hidden fixed bottom-0 z-50 w-full border-t border-border/40 bg-background/95 p-2">
    {/* MobileNav Content (e.g., icon buttons for key actions/routes) */}
  </nav>
</div>
```

This example illustrates:
- A `flex flex-col min-h-screen` pattern for the root layout.
- A sticky header.
- A conditionally displayed sidebar for larger screens (`hidden lg:block`).
- A main content area that adjusts its left margin (`lg:pl-64`) to accommodate the sidebar.
- The role of a `PageContainer`-like component for consistent content padding.
- A conditional mobile navigation bar (`lg:hidden`).

Adjust class names, breakpoints, and dimensions based on your specific application needs.
Refer to `components/layout/main-layout.tsx` and `components/layout/page-container.tsx` for the current implementation details in this project. 