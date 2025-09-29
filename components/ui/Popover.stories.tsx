import type { Meta, StoryObj } from '@storybook/react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Calendar } from 'lucide-react'

const meta: Meta<typeof Popover> = {
  title: 'UI/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A popover component for displaying content in a floating panel.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Dimensions</h4>
          <p className="text-sm text-muted-foreground">
            Set the dimensions for the layer.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open form</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Create new project</h4>
            <p className="text-sm text-muted-foreground">
              Add a new project to your workspace.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" placeholder="Enter project name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="Enter description" />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm">Cancel</Button>
            <Button size="sm">Create</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const DatePicker: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
          <Calendar className="mr-2 h-4 w-4" />
          Pick a date
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="p-4">
          <div className="space-y-2">
            <h4 className="font-medium">Select Date</h4>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className="p-2 font-medium">{day}</div>
              ))}
              {Array.from({ length: 31 }, (_, i) => (
                <button
                  key={i + 1}
                  className="p-2 hover:bg-muted rounded"
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const Settings: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Settings</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Settings</h4>
            <p className="text-sm text-muted-foreground">
              Configure your application preferences.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">Light</Button>
                <Button variant="outline" size="sm">Dark</Button>
                <Button variant="outline" size="sm">System</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <select className="w-full px-3 py-2 border border-input rounded-md">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Notifications</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">Email notifications</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">Push notifications</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const UserProfile: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm">
            JD
          </div>
          <span>John Doe</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-lg">
              JD
            </div>
            <div>
              <h4 className="font-medium">John Doe</h4>
              <p className="text-sm text-muted-foreground">john@example.com</p>
            </div>
          </div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              Profile
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Settings
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Billing
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Help
            </Button>
            <Button variant="destructive" className="w-full justify-start">
              Sign out
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const DifferentAlignments: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8 p-8">
      <div className="space-y-4">
        <h3 className="font-medium">Start</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Start</Button>
          </PopoverTrigger>
          <PopoverContent align="start">
            <p>Aligned to start</p>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Center</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Center</Button>
          </PopoverTrigger>
          <PopoverContent align="center">
            <p>Aligned to center</p>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">End</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">End</Button>
          </PopoverTrigger>
          <PopoverContent align="end">
            <p>Aligned to end</p>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Stretch</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Stretch</Button>
          </PopoverTrigger>
          <PopoverContent align="stretch">
            <p>Aligned to stretch</p>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  ),
}

export const CustomStyling: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Custom styled</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-blue-50 border-blue-200">
        <div className="space-y-2">
          <h4 className="font-medium text-blue-900">Custom Popover</h4>
          <p className="text-sm text-blue-700">
            This popover has custom styling with a blue theme.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
}
