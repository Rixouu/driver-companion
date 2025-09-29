import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './badge'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile badge component for displaying status, labels, and indicators.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Badge',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Error',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
    </div>
  ),
}

export const StatusIndicators: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Badge variant="success">Active</Badge>
        <span className="text-sm text-muted-foreground">User is online</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="warning">Pending</Badge>
        <span className="text-sm text-muted-foreground">Awaiting approval</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="destructive">Error</Badge>
        <span className="text-sm text-muted-foreground">Something went wrong</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Draft</Badge>
        <span className="text-sm text-muted-foreground">Not published yet</span>
      </div>
    </div>
  ),
}

export const WithCount: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">5</Badge>
      <Badge variant="secondary">12</Badge>
      <Badge variant="destructive">3</Badge>
      <Badge variant="success">99+</Badge>
    </div>
  ),
}

export const WithText: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">New</Badge>
      <Badge variant="secondary">Beta</Badge>
      <Badge variant="destructive">Deprecated</Badge>
      <Badge variant="success">Verified</Badge>
      <Badge variant="warning">Beta</Badge>
      <Badge variant="outline">Custom</Badge>
    </div>
  ),
}

export const InContext: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Project Dashboard</h3>
        <Badge variant="success">Live</Badge>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Feature A</span>
          <Badge variant="success">Completed</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Feature B</span>
          <Badge variant="warning">In Progress</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Feature C</span>
          <Badge variant="secondary">Planned</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Feature D</span>
          <Badge variant="destructive">Blocked</Badge>
        </div>
      </div>
    </div>
  ),
}
