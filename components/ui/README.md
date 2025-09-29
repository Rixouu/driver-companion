# UI Component Library

A comprehensive collection of reusable UI components built with React, TypeScript, and Tailwind CSS.

## Overview

This component library provides a consistent design system for building user interfaces. All components are built with accessibility in mind and follow modern React patterns.

## Components

### Basic Components
- **Button** - Versatile button component with multiple variants and sizes
- **Input** - Form input component with various types
- **Label** - Accessible label component for form elements
- **Textarea** - Multi-line text input component

### Layout Components
- **Card** - Flexible card component with header, content, and footer
- **Separator** - Visual separator component
- **Skeleton** - Loading state placeholder component

### Feedback Components
- **Alert** - Alert component for displaying important messages
- **Badge** - Status indicator and label component
- **Progress** - Progress bar for showing completion status

### Form Components
- **Checkbox** - Checkbox input component
- **Switch** - Toggle switch component
- **Select** - Dropdown select component with grouping support

### Navigation Components
- **Tabs** - Tab navigation component

### Overlay Components
- **Dialog** - Modal dialog component

### Display Components
- **Avatar** - User avatar component with fallback support

### Utility Components
- **VisuallyHidden** - Screen reader only content component

## Usage

### Import Components

```tsx
import { Button, Card, Input } from '@/components/ui'
```

### Individual Imports

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
```

## Storybook

This component library includes comprehensive Storybook documentation. To view the component library:

```bash
npm run storybook
```

The Storybook includes:
- Interactive component examples
- All component variants and states
- Accessibility information
- Design system guidelines
- Color palette and typography

## Design System

### Colors
- **Primary**: Main brand color
- **Secondary**: Supporting color
- **Destructive**: Error and danger states
- **Muted**: Subtle backgrounds and text
- **Success**: Success states (green)
- **Warning**: Warning states (yellow)

### Typography
- **Headings**: h1-h6 with consistent sizing
- **Body**: Base text with proper line height
- **Small**: Caption and secondary text
- **Muted**: Subtle text for less important information

### Spacing
- Consistent spacing scale using Tailwind's spacing system
- 4px base unit (0.25rem)
- Responsive spacing for different screen sizes

## Accessibility

All components are built with accessibility in mind:
- Proper ARIA attributes
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance

## Development

### Adding New Components

1. Create the component file in the appropriate directory
2. Add TypeScript interfaces for props
3. Include proper accessibility attributes
4. Create comprehensive Storybook stories
5. Export from the main index file
6. Update this README

### Component Structure

```tsx
import * as React from "react"
import { cn } from "@/lib/utils/styles"

interface ComponentProps {
  // Define props here
}

const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    return (
      <element
        ref={ref}
        className={cn("base-classes", className)}
        {...props}
      />
    )
  }
)
Component.displayName = "Component"

export { Component }
```

## Testing

Components are tested with:
- Storybook interaction tests
- Accessibility audits
- Visual regression testing
- Unit tests for complex logic

## Contributing

When contributing to this component library:

1. Follow the established patterns
2. Include comprehensive Storybook stories
3. Ensure accessibility compliance
4. Add proper TypeScript types
5. Update documentation
6. Test across different browsers and devices
