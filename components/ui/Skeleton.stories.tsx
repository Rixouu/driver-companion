import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from './skeleton'
import { Card, CardContent, CardHeader } from './card'

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A skeleton component for loading states and placeholders.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Skeleton className="h-4 w-[250px]" />,
}

export const Circle: Story = {
  render: () => <Skeleton className="h-12 w-12 rounded-full" />,
}

export const Rectangle: Story = {
  render: () => <Skeleton className="h-4 w-[200px]" />,
}

export const Square: Story = {
  render: () => <Skeleton className="h-12 w-12" />,
}

export const CardSkeleton: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  ),
}

export const ProfileSkeleton: Story = {
  render: () => (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ),
}

export const TableSkeleton: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex space-x-4">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[80px]" />
        <Skeleton className="h-4 w-[120px]" />
      </div>
      <div className="flex space-x-4">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[80px]" />
        <Skeleton className="h-4 w-[120px]" />
      </div>
      <div className="flex space-x-4">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[80px]" />
        <Skeleton className="h-4 w-[120px]" />
      </div>
    </div>
  ),
}

export const ListSkeleton: Story = {
  render: () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
        </div>
      ))}
    </div>
  ),
}

export const FormSkeleton: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  ),
}

export const DifferentSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="text-sm font-medium">Small</span>
        <Skeleton className="h-3 w-[100px]" />
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium">Medium</span>
        <Skeleton className="h-4 w-[150px]" />
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium">Large</span>
        <Skeleton className="h-6 w-[200px]" />
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium">Extra Large</span>
        <Skeleton className="h-8 w-[250px]" />
      </div>
    </div>
  ),
}

export const CustomColors: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="text-sm font-medium">Default</span>
        <Skeleton className="h-4 w-[200px]" />
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium">Blue</span>
        <Skeleton className="h-4 w-[200px] bg-blue-200" />
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium">Green</span>
        <Skeleton className="h-4 w-[200px] bg-green-200" />
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium">Purple</span>
        <Skeleton className="h-4 w-[200px] bg-purple-200" />
      </div>
    </div>
  ),
}
