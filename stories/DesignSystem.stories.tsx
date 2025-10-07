import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'

const meta: Meta = {
  title: 'Design System/Overview',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A comprehensive overview of the design system components.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const ComponentShowcase: Story = {
  render: () => (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Form Elements</h2>
        <div className="grid w-full max-w-sm items-center gap-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" placeholder="Enter your email" />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input type="password" id="password" placeholder="Enter your password" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Card</CardTitle>
              <CardDescription>A simple card with basic content.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This is the card content area where you can place any content.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Card with Badge</CardTitle>
              <CardDescription>This card includes a status badge.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span>Status:</span>
                <Badge variant="success">Active</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Interactive Card</CardTitle>
              <CardDescription>This card has interactive elements.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Click the buttons below to interact with this card.</p>
            </CardContent>
            <div className="p-6 pt-0 flex gap-2">
              <Button size="sm" variant="outline">Cancel</Button>
              <Button size="sm">Confirm</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  ),
}

export const ColorPalette: Story = {
  render: () => (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Color Palette</h2>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Primary Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-16 bg-primary rounded-md"></div>
            <p className="text-sm font-medium">Primary</p>
            <p className="text-xs text-muted-foreground">hsl(var(--primary))</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-secondary rounded-md"></div>
            <p className="text-sm font-medium">Secondary</p>
            <p className="text-xs text-muted-foreground">hsl(var(--secondary))</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-destructive rounded-md"></div>
            <p className="text-sm font-medium">Destructive</p>
            <p className="text-xs text-muted-foreground">hsl(var(--destructive))</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-muted rounded-md"></div>
            <p className="text-sm font-medium">Muted</p>
            <p className="text-xs text-muted-foreground">hsl(var(--muted))</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Status Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-16 bg-green-500 rounded-md"></div>
            <p className="text-sm font-medium">Success</p>
            <p className="text-xs text-muted-foreground">#22c55e</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-yellow-500 rounded-md"></div>
            <p className="text-sm font-medium">Warning</p>
            <p className="text-xs text-muted-foreground">#eab308</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-blue-500 rounded-md"></div>
            <p className="text-sm font-medium">Info</p>
            <p className="text-xs text-muted-foreground">#3b82f6</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 bg-gray-500 rounded-md"></div>
            <p className="text-sm font-medium">Neutral</p>
            <p className="text-xs text-muted-foreground">#6b7280</p>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const Typography: Story = {
  render: () => (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Typography</h2>
      
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold">Heading 1</h1>
          <p className="text-sm text-muted-foreground">text-4xl font-bold</p>
        </div>
        <div>
          <h2 className="text-3xl font-semibold">Heading 2</h2>
          <p className="text-sm text-muted-foreground">text-3xl font-semibold</p>
        </div>
        <div>
          <h3 className="text-2xl font-semibold">Heading 3</h3>
          <p className="text-sm text-muted-foreground">text-2xl font-semibold</p>
        </div>
        <div>
          <h4 className="text-xl font-semibold">Heading 4</h4>
          <p className="text-sm text-muted-foreground">text-xl font-semibold</p>
        </div>
        <div>
          <p className="text-base">Body text - This is the default paragraph text size.</p>
          <p className="text-sm text-muted-foreground">text-base</p>
        </div>
        <div>
          <p className="text-sm">Small text - Used for captions and secondary information.</p>
          <p className="text-sm text-muted-foreground">text-sm</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Extra small text - Used for fine print and labels.</p>
          <p className="text-sm text-muted-foreground">text-xs text-muted-foreground</p>
        </div>
      </div>
    </div>
  ),
}
