import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './input'
import { Label } from './label'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile input component with various types and states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    placeholder: {
      control: { type: 'text' },
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email" />
    </div>
  ),
}

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter password',
  },
}

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter email address',
  },
}

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: 'Enter number',
  },
}

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
}

export const WithValue: Story = {
  args: {
    defaultValue: 'Pre-filled value',
    placeholder: 'Enter text...',
  },
}

export const FormExample: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="first-name">First Name</Label>
        <Input type="text" id="first-name" placeholder="John" />
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="last-name">Last Name</Label>
        <Input type="text" id="last-name" placeholder="Doe" />
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input type="email" id="email" placeholder="john@example.com" />
      </div>
    </div>
  ),
}

export const AllTypes: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="text">Text</Label>
        <Input type="text" id="text" placeholder="Text input" />
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input type="email" id="email" placeholder="Email input" />
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input type="password" id="password" placeholder="Password input" />
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="number">Number</Label>
        <Input type="number" id="number" placeholder="Number input" />
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="search">Search</Label>
        <Input type="search" id="search" placeholder="Search input" />
      </div>
    </div>
  ),
}
