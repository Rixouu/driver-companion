import type { Meta, StoryObj } from '@storybook/react'
import { Separator } from './separator'

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A visual separator component for dividing content.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-64">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
        <p className="text-sm text-muted-foreground">
          An open-source UI component library.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    </div>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <div className="w-64 space-y-4">
      <div>
        <h4 className="text-sm font-medium">Section 1</h4>
        <p className="text-sm text-muted-foreground">Content for section 1</p>
      </div>
      <Separator />
      <div>
        <h4 className="text-sm font-medium">Section 2</h4>
        <p className="text-sm text-muted-foreground">Content for section 2</p>
      </div>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-20 items-center space-x-4">
      <div>Left</div>
      <Separator orientation="vertical" />
      <div>Center</div>
      <Separator orientation="vertical" />
      <div>Right</div>
    </div>
  ),
}

export const InList: Story = {
  render: () => (
    <div className="w-64">
      <div className="space-y-2">
        <div className="flex items-center justify-between p-2">
          <span className="text-sm">Profile</span>
          <span className="text-xs text-muted-foreground">Settings</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between p-2">
          <span className="text-sm">Billing</span>
          <span className="text-xs text-muted-foreground">Payment</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between p-2">
          <span className="text-sm">Team</span>
          <span className="text-xs text-muted-foreground">Members</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between p-2">
          <span className="text-sm">Support</span>
          <span className="text-xs text-muted-foreground">Help</span>
        </div>
      </div>
    </div>
  ),
}

export const CustomStyling: Story = {
  render: () => (
    <div className="w-64 space-y-4">
      <div>
        <h4 className="text-sm font-medium">Default</h4>
        <p className="text-sm text-muted-foreground">Standard separator</p>
      </div>
      <Separator />
      
      <div>
        <h4 className="text-sm font-medium">Thick</h4>
        <p className="text-sm text-muted-foreground">Thicker separator</p>
      </div>
      <Separator className="h-2" />
      
      <div>
        <h4 className="text-sm font-medium">Colored</h4>
        <p className="text-sm text-muted-foreground">Colored separator</p>
      </div>
      <Separator className="bg-blue-500" />
      
      <div>
        <h4 className="text-sm font-medium">Dashed</h4>
        <p className="text-sm text-muted-foreground">Dashed separator</p>
      </div>
      <Separator className="border-dashed" />
    </div>
  ),
}

export const InForm: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Personal Information</h3>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="First name"
            className="w-full px-3 py-2 border border-input rounded-md"
          />
          <input
            type="text"
            placeholder="Last name"
            className="w-full px-3 py-2 border border-input rounded-md"
          />
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Contact Information</h3>
        <div className="space-y-2">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-3 py-2 border border-input rounded-md"
          />
          <input
            type="tel"
            placeholder="Phone"
            className="w-full px-3 py-2 border border-input rounded-md"
          />
        </div>
      </div>
    </div>
  ),
}

export const InCard: Story = {
  render: () => (
    <div className="w-80 border rounded-lg p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Project Overview</h3>
        <p className="text-sm text-muted-foreground">
          This project aims to improve user experience through better design.
        </p>
      </div>
      
      <Separator />
      
      <div className="space-y-2">
        <h4 className="font-medium">Progress</h4>
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full w-3/4"></div>
        </div>
        <p className="text-sm text-muted-foreground">75% complete</p>
      </div>
      
      <Separator />
      
      <div className="space-y-2">
        <h4 className="font-medium">Team</h4>
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm">
            A
          </div>
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm">
            B
          </div>
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-white text-sm">
            C
          </div>
        </div>
      </div>
    </div>
  ),
}
