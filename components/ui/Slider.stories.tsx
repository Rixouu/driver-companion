import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Slider } from './slider'
import { Label } from './label'

const meta: Meta<typeof Slider> = {
  title: 'UI/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A slider component for selecting values within a range.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    min: {
      control: { type: 'number' },
    },
    max: {
      control: { type: 'number' },
    },
    step: {
      control: { type: 'number' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    step: 1,
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div className="space-y-2">
        <Label>Volume</Label>
        <p className="text-sm text-muted-foreground">Adjust the volume level</p>
      </div>
      <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
    </div>
  ),
}

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = React.useState([50])
    
    return (
      <div className="space-y-4 w-80">
        <div className="space-y-2">
          <Label>Price Range</Label>
          <p className="text-sm text-muted-foreground">Current value: ${value[0]}</p>
        </div>
        <Slider
          value={value}
          onValueChange={setValue}
          max={1000}
          step={10}
          className="w-full"
        />
      </div>
    )
  },
}

export const Range: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div className="space-y-2">
        <Label>Price Range</Label>
        <p className="text-sm text-muted-foreground">Select a price range</p>
      </div>
      <Slider defaultValue={[20, 80]} max={100} step={1} className="w-full" />
    </div>
  ),
}

export const WithSteps: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div className="space-y-2">
        <Label>Rating</Label>
        <p className="text-sm text-muted-foreground">Rate from 1 to 5 stars</p>
      </div>
      <Slider defaultValue={[3]} max={5} step={1} className="w-full" />
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div className="space-y-2">
        <Label>Disabled Slider</Label>
        <p className="text-sm text-muted-foreground">This slider is disabled</p>
      </div>
      <Slider defaultValue={[50]} max={100} step={1} disabled className="w-full" />
    </div>
  ),
}

export const FormExample: Story = {
  render: () => {
    const [values, setValues] = React.useState([25, 75])
    
    return (
      <div className="space-y-6 w-80">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Filters</Label>
            <p className="text-sm text-muted-foreground">Adjust the filter settings</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Brightness</Label>
              <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
            </div>
            
            <div className="space-y-2">
              <Label>Contrast</Label>
              <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
            </div>
            
            <div className="space-y-2">
              <Label>Price Range: ${values[0]} - ${values[1]}</Label>
              <Slider
                value={values}
                onValueChange={setValues}
                max={1000}
                step={10}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    )
  },
}

export const DifferentSizes: Story = {
  render: () => (
    <div className="space-y-8 w-80">
      <div className="space-y-2">
        <Label>Small</Label>
        <Slider defaultValue={[50]} max={100} step={1} className="w-full h-1" />
      </div>
      
      <div className="space-y-2">
        <Label>Default</Label>
        <Slider defaultValue={[50]} max={100} step={1} className="w-full h-2" />
      </div>
      
      <div className="space-y-2">
        <Label>Large</Label>
        <Slider defaultValue={[50]} max={100} step={1} className="w-full h-3" />
      </div>
    </div>
  ),
}

export const CustomColors: Story = {
  render: () => (
    <div className="space-y-8 w-80">
      <div className="space-y-2">
        <Label>Default</Label>
        <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
      </div>
      
      <div className="space-y-2">
        <Label>Blue</Label>
        <Slider 
          defaultValue={[50]} 
          max={100} 
          step={1} 
          className="w-full [&>span]:bg-blue-500" 
        />
      </div>
      
      <div className="space-y-2">
        <Label>Green</Label>
        <Slider 
          defaultValue={[50]} 
          max={100} 
          step={1} 
          className="w-full [&>span]:bg-green-500" 
        />
      </div>
      
      <div className="space-y-2">
        <Label>Purple</Label>
        <Slider 
          defaultValue={[50]} 
          max={100} 
          step={1} 
          className="w-full [&>span]:bg-purple-500" 
        />
      </div>
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8 w-80">
      <div className="space-y-2">
        <Label>Single Value</Label>
        <Slider defaultValue={[30]} max={100} step={1} className="w-full" />
      </div>
      
      <div className="space-y-2">
        <Label>Range</Label>
        <Slider defaultValue={[20, 80]} max={100} step={1} className="w-full" />
      </div>
      
      <div className="space-y-2">
        <Label>Multiple Steps</Label>
        <Slider defaultValue={[3]} max={10} step={1} className="w-full" />
      </div>
      
      <div className="space-y-2">
        <Label>Disabled</Label>
        <Slider defaultValue={[50]} max={100} step={1} disabled className="w-full" />
      </div>
    </div>
  ),
}
