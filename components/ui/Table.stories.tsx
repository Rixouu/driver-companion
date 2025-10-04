import type { Meta, StoryObj } from '@storybook/react'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
import { Badge } from './badge'
import { Button } from './button'
import { Checkbox } from './checkbox'

const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile table component for displaying structured data.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">INV001</TableCell>
          <TableCell>Paid</TableCell>
          <TableCell>Credit Card</TableCell>
          <TableCell className="text-right">$250.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV002</TableCell>
          <TableCell>Pending</TableCell>
          <TableCell>PayPal</TableCell>
          <TableCell className="text-right">$150.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">INV003</TableCell>
          <TableCell>Unpaid</TableCell>
          <TableCell>Bank Transfer</TableCell>
          <TableCell className="text-right">$350.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

export const WithBadges: Story = {
  render: () => (
    <Table>
      <TableCaption>Project status overview.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Progress</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Website Redesign</TableCell>
          <TableCell><Badge variant="success">Completed</Badge></TableCell>
          <TableCell><Badge variant="destructive">High</Badge></TableCell>
          <TableCell>100%</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Mobile App</TableCell>
          <TableCell><Badge variant="warning">In Progress</Badge></TableCell>
          <TableCell><Badge variant="default">Medium</Badge></TableCell>
          <TableCell>75%</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">API Integration</TableCell>
          <TableCell><Badge variant="secondary">Planned</Badge></TableCell>
          <TableCell><Badge variant="outline">Low</Badge></TableCell>
          <TableCell>0%</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

export const WithActions: Story = {
  render: () => (
    <Table>
      <TableCaption>User management table with actions.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">
            <Checkbox />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>
            <Checkbox />
          </TableCell>
          <TableCell className="font-medium">John Doe</TableCell>
          <TableCell>john@example.com</TableCell>
          <TableCell>Admin</TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm">Edit</Button>
              <Button variant="destructive" size="sm">Delete</Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <Checkbox />
          </TableCell>
          <TableCell className="font-medium">Jane Smith</TableCell>
          <TableCell>jane@example.com</TableCell>
          <TableCell>User</TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm">Edit</Button>
              <Button variant="destructive" size="sm">Delete</Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <Checkbox />
          </TableCell>
          <TableCell className="font-medium">Bob Johnson</TableCell>
          <TableCell>bob@example.com</TableCell>
          <TableCell>User</TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm">Edit</Button>
              <Button variant="destructive" size="sm">Delete</Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

export const WithFooter: Story = {
  render: () => (
    <Table>
      <TableCaption>Sales report for Q1 2024.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Laptop</TableCell>
          <TableCell className="text-right">2</TableCell>
          <TableCell className="text-right">$1,200.00</TableCell>
          <TableCell className="text-right">$2,400.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Mouse</TableCell>
          <TableCell className="text-right">5</TableCell>
          <TableCell className="text-right">$25.00</TableCell>
          <TableCell className="text-right">$125.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Keyboard</TableCell>
          <TableCell className="text-right">3</TableCell>
          <TableCell className="text-right">$75.00</TableCell>
          <TableCell className="text-right">$225.00</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
          <TableCell className="text-right font-medium">$2,750.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
}

export const Responsive: Story = {
  render: () => (
    <div className="w-full">
      <Table>
        <TableCaption>Responsive table that adapts to different screen sizes.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">001</TableCell>
            <TableCell>Alice Johnson</TableCell>
            <TableCell>alice@company.com</TableCell>
            <TableCell>+1 (555) 123-4567</TableCell>
            <TableCell>Engineering</TableCell>
            <TableCell><Badge variant="success">Active</Badge></TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">002</TableCell>
            <TableCell>Bob Smith</TableCell>
            <TableCell>bob@company.com</TableCell>
            <TableCell>+1 (555) 234-5678</TableCell>
            <TableCell>Marketing</TableCell>
            <TableCell><Badge variant="warning">Pending</Badge></TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">003</TableCell>
            <TableCell>Carol Davis</TableCell>
            <TableCell>carol@company.com</TableCell>
            <TableCell>+1 (555) 345-6789</TableCell>
            <TableCell>Sales</TableCell>
            <TableCell><Badge variant="success">Active</Badge></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
}

export const Empty: Story = {
  render: () => (
    <Table>
      <TableCaption>No data available.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="h-24 text-center">
            No results found.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
}

export const Loading: Story = {
  render: () => (
    <Table>
      <TableCaption>Loading data...</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 3 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
            </TableCell>
            <TableCell>
              <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
            </TableCell>
            <TableCell>
              <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}
