import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { Textarea } from './textarea'
import { Label } from './label'

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile textarea component for multi-line text input.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: { type: 'boolean' },
    },
    placeholder: {
      control: { type: 'text' },
    },
    rows: {
      control: { type: 'number', min: 1, max: 20 },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Type your message here...',
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="message">Your message</Label>
      <Textarea placeholder="Type your message here..." id="message" />
    </div>
  ),
}

export const WithValue: Story = {
  args: {
    defaultValue: 'This is a pre-filled textarea with some content.',
    placeholder: 'Type your message here...',
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'This textarea is disabled',
    disabled: true,
  },
}

export const CustomRows: Story = {
  args: {
    placeholder: 'This textarea has 6 rows',
    rows: 6,
  },
}

export const WithMaxLength: Story = {
  args: {
    placeholder: 'Maximum 100 characters',
    maxLength: 100,
  },
}

export const FormExample: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <input
          id="subject"
          type="text"
          placeholder="Enter subject"
          className="w-full px-3 py-2 border border-input rounded-md"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          placeholder="Enter your message here..."
          rows={4}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any additional information..."
          rows={3}
        />
      </div>
    </div>
  ),
}

export const DifferentSizes: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <Label>Small (2 rows)</Label>
        <Textarea placeholder="Small textarea" rows={2} />
      </div>
      
      <div className="space-y-2">
        <Label>Medium (4 rows)</Label>
        <Textarea placeholder="Medium textarea" rows={4} />
      </div>
      
      <div className="space-y-2">
        <Label>Large (8 rows)</Label>
        <Textarea placeholder="Large textarea" rows={8} />
      </div>
    </div>
  ),
}

export const WithCharacterCount: Story = {
  render: () => {
    const [value, setValue] = React.useState('')
    const maxLength = 200
    
    return (
      <div className="space-y-2 w-full max-w-md">
        <Label htmlFor="limited">Message (with character count)</Label>
        <Textarea
          id="limited"
          placeholder="Type your message here..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={maxLength}
          rows={4}
        />
        <div className="text-right text-sm text-muted-foreground">
          {value.length}/{maxLength}
        </div>
      </div>
    )
  },
}

export const AllStates: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <Label>Default</Label>
        <Textarea placeholder="Default textarea" />
      </div>
      
      <div className="space-y-2">
        <Label>With value</Label>
        <Textarea defaultValue="This textarea has a value" />
      </div>
      
      <div className="space-y-2">
        <Label>Disabled</Label>
        <Textarea placeholder="Disabled textarea" disabled />
      </div>
      
      <div className="space-y-2">
        <Label>Disabled with value</Label>
        <Textarea defaultValue="Disabled with value" disabled />
      </div>
    </div>
  ),
}
