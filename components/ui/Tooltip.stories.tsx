import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'
import { Button } from './button'
import { Badge } from './badge'
import { Info } from 'lucide-react'

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A tooltip component for displaying helpful information on hover.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This is a tooltip</p>
      </TooltipContent>
    </Tooltip>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <span>Password</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-4 w-4">
            <Info className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Password must be at least 8 characters long</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}

export const LongContent: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Long tooltip</Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>This is a longer tooltip that contains more detailed information about the element you're hovering over.</p>
      </TooltipContent>
    </Tooltip>
  ),
}

export const WithBadge: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="warning">Beta</Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>This feature is currently in beta testing</p>
      </TooltipContent>
    </Tooltip>
  ),
}

export const DifferentPositions: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8 p-8">
      <div className="space-y-4">
        <h3 className="font-medium">Top</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Top</Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Tooltip on top</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Right</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Right</Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Tooltip on right</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Bottom</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Bottom</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Tooltip on bottom</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Left</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Left</Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Tooltip on left</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  ),
}

export const FormField: Story = {
  render: () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-4 w-4">
              <Info className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>We'll never share your email with anyone else</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <input
        id="email"
        type="email"
        placeholder="Enter your email"
        className="w-full px-3 py-2 border border-input rounded-md"
      />
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" disabled>
          Disabled button
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This button is disabled</p>
      </TooltipContent>
    </Tooltip>
  ),
}

export const MultipleTooltips: Story = {
  render: () => (
    <div className="flex gap-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Save</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Save your changes</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Cancel</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Discard changes</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Delete</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Permanently delete this item</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}

export const CustomStyling: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Custom styled</Button>
      </TooltipTrigger>
      <TooltipContent className="bg-blue-500 text-white border-blue-600">
        <p>This tooltip has custom styling</p>
      </TooltipContent>
    </Tooltip>
  ),
}
