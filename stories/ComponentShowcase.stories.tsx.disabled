import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Checkbox } from '../components/ui/checkbox'
import { Switch } from '../components/ui/switch'
import { Progress } from '../components/ui/progress'
import { Separator } from '../components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../components/ui/dialog'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '../components/ui/tooltip'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '../components/ui/popover'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Skeleton } from '../components/ui/skeleton'

const meta: Meta = {
  title: 'Design System/Component Showcase',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A comprehensive showcase of all UI components in action.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const CompleteShowcase: Story = {
  render: () => (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Complete UI Component Showcase</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive demonstration of all available UI components, showcasing their versatility and design consistency.
            </p>
          </div>

          {/* Buttons Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Buttons & Actions</h2>
            <Card>
              <CardHeader>
                <CardTitle>Button Variants</CardTitle>
                <CardDescription>Different button styles for various use cases</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">⚙️</Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Form Components Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Form Components</h2>
            <Card>
              <CardHeader>
                <CardTitle>Form Elements</CardTitle>
                <CardDescription>Input components for data collection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Enter your email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea id="message" placeholder="Enter your message" rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="ca">Canada</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="terms" />
                      <Label htmlFor="terms">Accept terms and conditions</Label>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications">Email notifications</Label>
                      <Switch id="notifications" />
                    </div>
                    <div className="space-y-2">
                      <Label>Progress</Label>
                      <Progress value={65} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Data Display Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Data Display</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Profiles</CardTitle>
                  <CardDescription>Avatar and user information display</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-muted-foreground">john@example.com</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>AB</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Alice Brown</p>
                      <p className="text-sm text-muted-foreground">alice@example.com</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status & Badges</CardTitle>
                  <CardDescription>Status indicators and labels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Error</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Project Alpha</span>
                      <Badge variant="success">Completed</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Project Beta</span>
                      <Badge variant="warning">In Progress</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Project Gamma</span>
                      <Badge variant="secondary">Planned</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Interactive Components Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Interactive Components</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dropdowns & Menus</CardTitle>
                  <CardDescription>Contextual actions and navigation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">Actions</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Copy</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline">Hover me</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This is a helpful tooltip</p>
                      </TooltipContent>
                    </Tooltip>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">Popover</Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <div className="space-y-2">
                          <h4 className="font-medium">Popover Title</h4>
                          <p className="text-sm text-muted-foreground">
                            This is popover content
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Modals & Dialogs</CardTitle>
                  <CardDescription>Overlay components for important actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Open Dialog</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirmation</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to proceed with this action?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline">Cancel</Button>
                        <Button>Confirm</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Data Table Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Data Tables</h2>
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
                <CardDescription>Tabular data display with actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Website Redesign</TableCell>
                      <TableCell><Badge variant="success">Completed</Badge></TableCell>
                      <TableCell><Progress value={100} className="w-20" /></TableCell>
                      <TableCell>5 members</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Mobile App</TableCell>
                      <TableCell><Badge variant="warning">In Progress</Badge></TableCell>
                      <TableCell><Progress value={75} className="w-20" /></TableCell>
                      <TableCell>3 members</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">API Integration</TableCell>
                      <TableCell><Badge variant="secondary">Planned</Badge></TableCell>
                      <TableCell><Progress value={0} className="w-20" /></TableCell>
                      <TableCell>2 members</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          {/* Tabs Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Navigation & Tabs</h2>
            <Card>
              <CardHeader>
                <CardTitle>Tabbed Interface</CardTitle>
                <CardDescription>Organized content with tab navigation</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Total Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">$45,231.89</div>
                          <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Subscriptions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">+2350</div>
                          <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">+12,234</div>
                          <p className="text-xs text-muted-foreground">+19% from last month</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  <TabsContent value="analytics" className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Analytics content would go here with charts and detailed metrics.
                    </p>
                  </TabsContent>
                  <TabsContent value="settings" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="notifications">Email notifications</Label>
                        <Switch id="notifications" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="marketing">Marketing emails</Label>
                        <Switch id="marketing" />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>

          {/* Loading States Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Loading States</h2>
            <Card>
              <CardHeader>
                <CardTitle>Skeleton Loading</CardTitle>
                <CardDescription>Placeholder content while data loads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[160px]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Alerts Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Alerts & Notifications</h2>
            <div className="space-y-4">
              <Alert>
                <AlertTitle>Heads up!</AlertTitle>
                <AlertDescription>
                  You can add components to your app using the cli.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Your session has expired. Please log in again.
                </AlertDescription>
              </Alert>
            </div>
          </section>
        </div>
      </div>
    </TooltipProvider>
  ),
}
