import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Getting Started',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Welcome to our comprehensive UI component library! This design system provides a consistent, accessible, and beautiful foundation for building user interfaces.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Getting Started with the Design System</h1>
        <p className="text-xl text-muted-foreground">
          Welcome to our comprehensive UI component library! This design system provides a consistent, accessible, and beautiful foundation for building user interfaces.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">What's Included</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span><strong>20+ Reusable Components</strong> - From basic buttons to complex forms</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span><strong>Comprehensive Documentation</strong> - Every component has detailed stories and examples</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span><strong>Accessibility First</strong> - All components are built with accessibility in mind</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span><strong>TypeScript Support</strong> - Full type safety for all components</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span><strong>Dark Mode Ready</strong> - Components work seamlessly in light and dark themes</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span><strong>Responsive Design</strong> - Mobile-first approach with responsive utilities</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Quick Start</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">1. Import Components</h3>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`import { Button, Card, Input } from '@/components/ui'`}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">2. Use in Your Code</h3>
              <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter your name" />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  )
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Design Principles</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Consistency</h3>
            <p className="text-sm text-muted-foreground">
              All components follow the same design patterns and use consistent spacing, typography, and colors.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Accessibility</h3>
            <p className="text-sm text-muted-foreground">
              Every component is built with accessibility in mind, including proper ARIA attributes, keyboard navigation, and screen reader support.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Flexibility</h3>
            <p className="text-sm text-muted-foreground">
              Components are designed to be flexible and customizable while maintaining consistency.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Performance</h3>
            <p className="text-sm text-muted-foreground">
              Components are optimized for performance with minimal bundle size and efficient rendering.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Component Categories</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium">Form Components</h3>
            <p className="text-sm text-muted-foreground">
              Input, Textarea, Select, Checkbox, Switch
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Layout Components</h3>
            <p className="text-sm text-muted-foreground">
              Card, Separator, Skeleton
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Feedback Components</h3>
            <p className="text-sm text-muted-foreground">
              Alert, Badge, Progress
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Navigation Components</h3>
            <p className="text-sm text-muted-foreground">
              Tabs, Dialog
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Display Components</h3>
            <p className="text-sm text-muted-foreground">
              Avatar, Button
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Utility Components</h3>
            <p className="text-sm text-muted-foreground">
              VisuallyHidden
            </p>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Getting Help</h2>
        <ul className="space-y-2 text-sm">
          <li>• Browse the component stories for examples</li>
          <li>• Check the component documentation for API details</li>
          <li>• Review the design system guidelines</li>
          <li>• Test components in different states and contexts</li>
        </ul>
      </div>
    </div>
  ),
}
