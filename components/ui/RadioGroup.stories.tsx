import type { Meta, StoryObj } from '@storybook/react'
import { RadioGroup, RadioGroupItem } from './radio-group'
import { Label } from './label'

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A radio group component for single selection from multiple options.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option1">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option1" id="r1" />
        <Label htmlFor="r1">Option 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option2" id="r2" />
        <Label htmlFor="r2">Option 2</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option3" id="r3" />
        <Label htmlFor="r3">Option 3</Label>
      </div>
    </RadioGroup>
  ),
}

export const WithLabels: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">Choose your preferred option</Label>
        <p className="text-sm text-muted-foreground">Select one option from the list below.</p>
      </div>
      <RadioGroup defaultValue="option2">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="r1" />
          <Label htmlFor="r1">First option</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option2" id="r2" />
          <Label htmlFor="r2">Second option</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option3" id="r3" />
          <Label htmlFor="r3">Third option</Label>
        </div>
      </RadioGroup>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="option1">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option1" id="r1" />
        <Label htmlFor="r1">Enabled option</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option2" id="r2" disabled />
        <Label htmlFor="r2" className="text-muted-foreground">Disabled option</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option3" id="r3" />
        <Label htmlFor="r3">Another enabled option</Label>
      </div>
    </RadioGroup>
  ),
}

export const FormExample: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <div className="space-y-2">
        <Label className="text-base font-medium">Payment Method</Label>
        <p className="text-sm text-muted-foreground">How would you like to pay?</p>
      </div>
      <RadioGroup defaultValue="credit">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="credit" id="credit" />
          <Label htmlFor="credit">Credit Card</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="debit" id="debit" />
          <Label htmlFor="debit">Debit Card</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="paypal" id="paypal" />
          <Label htmlFor="paypal">PayPal</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="bank" id="bank" />
          <Label htmlFor="bank">Bank Transfer</Label>
        </div>
      </RadioGroup>
    </div>
  ),
}

export const SettingsExample: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Theme</Label>
          <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
        </div>
        <RadioGroup defaultValue="system">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="light" id="light" />
            <Label htmlFor="light">Light</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dark" id="dark" />
            <Label htmlFor="dark">Dark</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="system" id="system" />
            <Label htmlFor="system">System</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Language</Label>
          <p className="text-sm text-muted-foreground">Select your preferred language</p>
        </div>
        <RadioGroup defaultValue="en">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="en" id="en" />
            <Label htmlFor="en">English</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="es" id="es" />
            <Label htmlFor="es">Spanish</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fr" id="fr" />
            <Label htmlFor="fr">French</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <RadioGroup defaultValue="option1" className="space-y-3">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option1" id="v1" />
        <Label htmlFor="v1">Option 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option2" id="v2" />
        <Label htmlFor="v2">Option 2</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option3" id="v3" />
        <Label htmlFor="v3">Option 3</Label>
      </div>
    </RadioGroup>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="option1" className="flex space-x-6">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option1" id="h1" />
        <Label htmlFor="h1">Option 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option2" id="h2" />
        <Label htmlFor="h2">Option 2</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option3" id="h3" />
        <Label htmlFor="h3">Option 3</Label>
      </div>
    </RadioGroup>
  ),
}

export const WithDescriptions: Story = {
  render: () => (
    <RadioGroup defaultValue="basic">
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="basic" id="basic" className="mt-1" />
        <div className="space-y-1">
          <Label htmlFor="basic" className="font-medium">Basic Plan</Label>
          <p className="text-sm text-muted-foreground">Perfect for individuals and small teams</p>
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="pro" id="pro" className="mt-1" />
        <div className="space-y-1">
          <Label htmlFor="pro" className="font-medium">Pro Plan</Label>
          <p className="text-sm text-muted-foreground">Advanced features for growing businesses</p>
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <RadioGroupItem value="enterprise" id="enterprise" className="mt-1" />
        <div className="space-y-1">
          <Label htmlFor="enterprise" className="font-medium">Enterprise Plan</Label>
          <p className="text-sm text-muted-foreground">Full-featured solution for large organizations</p>
        </div>
      </div>
    </RadioGroup>
  ),
}
