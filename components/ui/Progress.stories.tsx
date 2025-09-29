import type { Meta, StoryObj } from '@storybook/react'
import { Progress } from './progress'

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A progress bar component for displaying completion status.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 33,
  },
}

export const Empty: Story = {
  args: {
    value: 0,
  },
}

export const Half: Story = {
  args: {
    value: 50,
  },
}

export const AlmostComplete: Story = {
  args: {
    value: 90,
  },
}

export const Complete: Story = {
  args: {
    value: 100,
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Progress</span>
        <span>33%</span>
      </div>
      <Progress value={33} />
    </div>
  ),
}

export const DifferentValues: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Starting</span>
          <span>0%</span>
        </div>
        <Progress value={0} />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>In Progress</span>
          <span>25%</span>
        </div>
        <Progress value={25} />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Halfway</span>
          <span>50%</span>
        </div>
        <Progress value={50} />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Almost Done</span>
          <span>75%</span>
        </div>
        <Progress value={75} />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Complete</span>
          <span>100%</span>
        </div>
        <Progress value={100} />
      </div>
    </div>
  ),
}

export const DifferentSizes: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <div className="space-y-2">
        <span className="text-sm">Small</span>
        <Progress value={50} className="h-2" />
      </div>
      
      <div className="space-y-2">
        <span className="text-sm">Default</span>
        <Progress value={50} className="h-4" />
      </div>
      
      <div className="space-y-2">
        <span className="text-sm">Large</span>
        <Progress value={50} className="h-6" />
      </div>
    </div>
  ),
}

export const CustomColors: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <div className="space-y-2">
        <span className="text-sm">Default</span>
        <Progress value={50} />
      </div>
      
      <div className="space-y-2">
        <span className="text-sm">Success</span>
        <Progress 
          value={75} 
          className="[&>div]:bg-green-500" 
        />
      </div>
      
      <div className="space-y-2">
        <span className="text-sm">Warning</span>
        <Progress 
          value={60} 
          className="[&>div]:bg-yellow-500" 
        />
      </div>
      
      <div className="space-y-2">
        <span className="text-sm">Error</span>
        <Progress 
          value={30} 
          className="[&>div]:bg-red-500" 
        />
      </div>
    </div>
  ),
}

export const LoadingExample: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Uploading files...</span>
          <span>45%</span>
        </div>
        <Progress value={45} />
        <p className="text-xs text-muted-foreground">
          Please don't close this window
        </p>
      </div>
    </div>
  ),
}

export const StepProgress: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step 1 of 4: Account Setup</span>
          <span>25%</span>
        </div>
        <Progress value={25} />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step 2 of 4: Profile Information</span>
          <span>50%</span>
        </div>
        <Progress value={50} />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step 3 of 4: Preferences</span>
          <span>75%</span>
        </div>
        <Progress value={75} />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step 4 of 4: Review & Complete</span>
          <span>100%</span>
        </div>
        <Progress value={100} />
      </div>
    </div>
  ),
}
