import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile tabs component for organizing content into sections.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Account</h3>
          <p className="text-sm text-muted-foreground">
            Make changes to your account here. Click save when you're done.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="password">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Password</h3>
          <p className="text-sm text-muted-foreground">
            Change your password here. After saving, you'll be logged out.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
}

export const ThreeTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Overview</h3>
          <p className="text-sm text-muted-foreground">
            Get a high-level view of your dashboard and key metrics.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="analytics">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Dive deep into your data with detailed analytics and insights.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="reports">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Reports</h3>
          <p className="text-sm text-muted-foreground">
            Generate and download comprehensive reports for your data.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
}

export const WithForm: Story = {
  render: () => (
    <Tabs defaultValue="personal" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="personal">Personal</TabsTrigger>
        <TabsTrigger value="company">Company</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="personal">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Personal Information</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium">First Name</label>
            <input
              type="text"
              placeholder="Enter your first name"
              className="w-full px-3 py-2 border border-input rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Last Name</label>
            <input
              type="text"
              placeholder="Enter your last name"
              className="w-full px-3 py-2 border border-input rounded-md"
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="company">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Company Information</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Name</label>
            <input
              type="text"
              placeholder="Enter company name"
              className="w-full px-3 py-2 border border-input rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Industry</label>
            <input
              type="text"
              placeholder="Enter industry"
              className="w-full px-3 py-2 border border-input rounded-md"
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="billing">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Billing Information</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium">Card Number</label>
            <input
              type="text"
              placeholder="Enter card number"
              className="w-full px-3 py-2 border border-input rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Expiry</label>
              <input
                type="text"
                placeholder="MM/YY"
                className="w-full px-3 py-2 border border-input rounded-md"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CVV</label>
              <input
                type="text"
                placeholder="123"
                className="w-full px-3 py-2 border border-input rounded-md"
              />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  ),
}

export const VerticalTabs: Story = {
  render: () => (
    <Tabs defaultValue="tab1" orientation="vertical" className="flex w-[500px]">
      <TabsList className="flex-col h-auto w-[200px]">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <div className="flex-1 ml-4">
        <TabsContent value="tab1">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Tab 1 Content</h3>
            <p className="text-sm text-muted-foreground">
              This is the content for the first tab.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="tab2">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Tab 2 Content</h3>
            <p className="text-sm text-muted-foreground">
              This is the content for the second tab.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="tab3">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Tab 3 Content</h3>
            <p className="text-sm text-muted-foreground">
              This is the content for the third tab.
            </p>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  ),
}

export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="tab1">Available</TabsTrigger>
        <TabsTrigger value="tab2" disabled>Disabled</TabsTrigger>
        <TabsTrigger value="tab3">Available</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Available Tab</h3>
          <p className="text-sm text-muted-foreground">
            This tab is available and can be selected.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="tab2">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Disabled Tab</h3>
          <p className="text-sm text-muted-foreground">
            This tab is disabled and cannot be selected.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="tab3">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Another Available Tab</h3>
          <p className="text-sm text-muted-foreground">
            This tab is also available and can be selected.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
}

export const CustomStyling: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Equal Width Tabs</h3>
          <p className="text-sm text-muted-foreground">
            These tabs have equal width using CSS Grid.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="tab2">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Tab 2</h3>
          <p className="text-sm text-muted-foreground">
            Content for tab 2.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="tab3">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Tab 3</h3>
          <p className="text-sm text-muted-foreground">
            Content for tab 3.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
}
