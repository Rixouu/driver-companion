import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Design Tokens',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Design tokens that define the visual foundation of our design system.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Colors: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-6">Color Palette</h2>
        
        {/* Primary Colors */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Primary Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 bg-primary rounded-lg border"></div>
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-muted-foreground">hsl(var(--primary))</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-primary-foreground rounded-lg border"></div>
              <p className="text-sm font-medium">Primary Foreground</p>
              <p className="text-xs text-muted-foreground">hsl(var(--primary-foreground))</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-secondary rounded-lg border"></div>
              <p className="text-sm font-medium">Secondary</p>
              <p className="text-xs text-muted-foreground">hsl(var(--secondary))</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-secondary-foreground rounded-lg border"></div>
              <p className="text-sm font-medium">Secondary Foreground</p>
              <p className="text-xs text-muted-foreground">hsl(var(--secondary-foreground))</p>
            </div>
          </div>
        </div>

        {/* Background Colors */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Background Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 bg-background rounded-lg border"></div>
              <p className="text-sm font-medium">Background</p>
              <p className="text-xs text-muted-foreground">hsl(var(--background))</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-foreground rounded-lg border"></div>
              <p className="text-sm font-medium">Foreground</p>
              <p className="text-xs text-muted-foreground">hsl(var(--foreground))</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-muted rounded-lg border"></div>
              <p className="text-sm font-medium">Muted</p>
              <p className="text-xs text-muted-foreground">hsl(var(--muted))</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-muted-foreground rounded-lg border"></div>
              <p className="text-sm font-medium">Muted Foreground</p>
              <p className="text-xs text-muted-foreground">hsl(var(--muted-foreground))</p>
            </div>
          </div>
        </div>

        {/* Accent Colors */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Accent Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 bg-accent rounded-lg border"></div>
              <p className="text-sm font-medium">Accent</p>
              <p className="text-xs text-muted-foreground">hsl(var(--accent))</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-accent-foreground rounded-lg border"></div>
              <p className="text-sm font-medium">Accent Foreground</p>
              <p className="text-xs text-muted-foreground">hsl(var(--accent-foreground))</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-popover rounded-lg border"></div>
              <p className="text-sm font-medium">Popover</p>
              <p className="text-xs text-muted-foreground">hsl(var(--popover))</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-popover-foreground rounded-lg border"></div>
              <p className="text-sm font-medium">Popover Foreground</p>
              <p className="text-xs text-muted-foreground">hsl(var(--popover-foreground))</p>
            </div>
          </div>
        </div>

        {/* Status Colors */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Status Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 bg-destructive rounded-lg border"></div>
              <p className="text-sm font-medium">Destructive</p>
              <p className="text-xs text-muted-foreground">hsl(var(--destructive))</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-destructive-foreground rounded-lg border"></div>
              <p className="text-sm font-medium">Destructive Foreground</p>
              <p className="text-xs text-muted-foreground">hsl(var(--destructive-foreground))</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-card rounded-lg border"></div>
              <p className="text-sm font-medium">Card</p>
              <p className="text-xs text-muted-foreground">hsl(var(--card))</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-card-foreground rounded-lg border"></div>
              <p className="text-sm font-medium">Card Foreground</p>
              <p className="text-xs text-muted-foreground">hsl(var(--card-foreground))</p>
            </div>
          </div>
        </div>

        {/* Custom Status Colors */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Custom Status Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 bg-green-500 rounded-lg border"></div>
              <p className="text-sm font-medium">Success</p>
              <p className="text-xs text-muted-foreground">#22c55e</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-yellow-500 rounded-lg border"></div>
              <p className="text-sm font-medium">Warning</p>
              <p className="text-xs text-muted-foreground">#eab308</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-blue-500 rounded-lg border"></div>
              <p className="text-sm font-medium">Info</p>
              <p className="text-xs text-muted-foreground">#3b82f6</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 bg-gray-500 rounded-lg border"></div>
              <p className="text-sm font-medium">Neutral</p>
              <p className="text-xs text-muted-foreground">#6b7280</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const Typography: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-6">Typography Scale</h2>
        
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Heading 1</h1>
            <p className="text-sm text-muted-foreground">text-4xl font-bold</p>
            <p className="text-sm text-muted-foreground">Used for main page titles and hero sections</p>
          </div>
          
          <div>
            <h2 className="text-3xl font-semibold mb-2">Heading 2</h2>
            <p className="text-sm text-muted-foreground">text-3xl font-semibold</p>
            <p className="text-sm text-muted-foreground">Used for section headers and important subsections</p>
          </div>
          
          <div>
            <h3 className="text-2xl font-semibold mb-2">Heading 3</h3>
            <p className="text-sm text-muted-foreground">text-2xl font-semibold</p>
            <p className="text-sm text-muted-foreground">Used for subsection headers and card titles</p>
          </div>
          
          <div>
            <h4 className="text-xl font-semibold mb-2">Heading 4</h4>
            <p className="text-sm text-muted-foreground">text-xl font-semibold</p>
            <p className="text-sm text-muted-foreground">Used for smaller section headers</p>
          </div>
          
          <div>
            <h5 className="text-lg font-semibold mb-2">Heading 5</h5>
            <p className="text-sm text-muted-foreground">text-lg font-semibold</p>
            <p className="text-sm text-muted-foreground">Used for component titles and labels</p>
          </div>
          
          <div>
            <h6 className="text-base font-semibold mb-2">Heading 6</h6>
            <p className="text-sm text-muted-foreground">text-base font-semibold</p>
            <p className="text-sm text-muted-foreground">Used for small headers and emphasis</p>
          </div>
          
          <div>
            <p className="text-base mb-2">Body text - This is the default paragraph text size used throughout the application for regular content.</p>
            <p className="text-sm text-muted-foreground">text-base</p>
            <p className="text-sm text-muted-foreground">Used for main content, descriptions, and general text</p>
          </div>
          
          <div>
            <p className="text-sm mb-2">Small text - Used for captions, metadata, and secondary information that supports the main content.</p>
            <p className="text-sm text-muted-foreground">text-sm</p>
            <p className="text-sm text-muted-foreground">Used for captions, metadata, and supporting text</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-2">Extra small text - Used for fine print, timestamps, and very small labels that need to be present but not prominent.</p>
            <p className="text-sm text-muted-foreground">text-xs text-muted-foreground</p>
            <p className="text-sm text-muted-foreground">Used for fine print, timestamps, and labels</p>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const Spacing: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-6">Spacing Scale</h2>
        <p className="text-muted-foreground mb-8">Our spacing system is based on a 4px grid system for consistent and harmonious layouts.</p>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Spacing Scale</h3>
            <div className="space-y-3">
              {[
                { name: 'xs', value: '4px', class: 'w-1 h-1', description: '0.25rem - Minimal spacing' },
                { name: 'sm', value: '8px', class: 'w-2 h-2', description: '0.5rem - Small spacing' },
                { name: 'md', value: '16px', class: 'w-4 h-4', description: '1rem - Medium spacing' },
                { name: 'lg', value: '24px', class: 'w-6 h-6', description: '1.5rem - Large spacing' },
                { name: 'xl', value: '32px', class: 'w-8 h-8', description: '2rem - Extra large spacing' },
                { name: '2xl', value: '48px', class: 'w-12 h-12', description: '3rem - Double extra large spacing' },
                { name: '3xl', value: '64px', class: 'w-16 h-16', description: '4rem - Triple extra large spacing' },
              ].map((spacing) => (
                <div key={spacing.name} className="flex items-center space-x-4">
                  <div className={`${spacing.class} bg-primary rounded`}></div>
                  <div className="w-16 text-sm font-mono">{spacing.name}</div>
                  <div className="w-16 text-sm font-mono">{spacing.value}</div>
                  <div className="text-sm text-muted-foreground">{spacing.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Padding Examples</h3>
            <div className="space-y-4">
              <div className="bg-muted p-2 rounded">
                <p className="text-sm">p-2 (8px padding)</p>
              </div>
              <div className="bg-muted p-4 rounded">
                <p className="text-sm">p-4 (16px padding)</p>
              </div>
              <div className="bg-muted p-6 rounded">
                <p className="text-sm">p-6 (24px padding)</p>
              </div>
              <div className="bg-muted p-8 rounded">
                <p className="text-sm">p-8 (32px padding)</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Margin Examples</h3>
            <div className="space-y-4">
              <div className="bg-muted rounded">
                <div className="bg-primary text-primary-foreground p-2 m-2 rounded">
                  <p className="text-sm">m-2 (8px margin)</p>
                </div>
              </div>
              <div className="bg-muted rounded">
                <div className="bg-primary text-primary-foreground p-2 m-4 rounded">
                  <p className="text-sm">m-4 (16px margin)</p>
                </div>
              </div>
              <div className="bg-muted rounded">
                <div className="bg-primary text-primary-foreground p-2 m-6 rounded">
                  <p className="text-sm">m-6 (24px margin)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const BorderRadius: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-6">Border Radius</h2>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Radius Scale</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="w-16 h-16 bg-primary rounded-none"></div>
                <p className="text-sm font-medium">None</p>
                <p className="text-xs text-muted-foreground">rounded-none</p>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-16 bg-primary rounded-sm"></div>
                <p className="text-sm font-medium">Small</p>
                <p className="text-xs text-muted-foreground">rounded-sm</p>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-16 bg-primary rounded"></div>
                <p className="text-sm font-medium">Default</p>
                <p className="text-xs text-muted-foreground">rounded</p>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-16 bg-primary rounded-md"></div>
                <p className="text-sm font-medium">Medium</p>
                <p className="text-xs text-muted-foreground">rounded-md</p>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-16 bg-primary rounded-lg"></div>
                <p className="text-sm font-medium">Large</p>
                <p className="text-xs text-muted-foreground">rounded-lg</p>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-16 bg-primary rounded-xl"></div>
                <p className="text-sm font-medium">Extra Large</p>
                <p className="text-xs text-muted-foreground">rounded-xl</p>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-16 bg-primary rounded-2xl"></div>
                <p className="text-sm font-medium">2X Large</p>
                <p className="text-xs text-muted-foreground">rounded-2xl</p>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-16 bg-primary rounded-full"></div>
                <p className="text-sm font-medium">Full</p>
                <p className="text-xs text-muted-foreground">rounded-full</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const Shadows: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-6">Shadow System</h2>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Shadow Scale</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-2">
                <div className="w-24 h-24 bg-background border shadow-sm rounded-lg flex items-center justify-center">
                  <span className="text-sm">sm</span>
                </div>
                <p className="text-sm font-medium">Small</p>
                <p className="text-xs text-muted-foreground">shadow-sm</p>
              </div>
              <div className="space-y-2">
                <div className="w-24 h-24 bg-background border shadow rounded-lg flex items-center justify-center">
                  <span className="text-sm">base</span>
                </div>
                <p className="text-sm font-medium">Default</p>
                <p className="text-xs text-muted-foreground">shadow</p>
              </div>
              <div className="space-y-2">
                <div className="w-24 h-24 bg-background border shadow-md rounded-lg flex items-center justify-center">
                  <span className="text-sm">md</span>
                </div>
                <p className="text-sm font-medium">Medium</p>
                <p className="text-xs text-muted-foreground">shadow-md</p>
              </div>
              <div className="space-y-2">
                <div className="w-24 h-24 bg-background border shadow-lg rounded-lg flex items-center justify-center">
                  <span className="text-sm">lg</span>
                </div>
                <p className="text-sm font-medium">Large</p>
                <p className="text-xs text-muted-foreground">shadow-lg</p>
              </div>
              <div className="space-y-2">
                <div className="w-24 h-24 bg-background border shadow-xl rounded-lg flex items-center justify-center">
                  <span className="text-sm">xl</span>
                </div>
                <p className="text-sm font-medium">Extra Large</p>
                <p className="text-xs text-muted-foreground">shadow-xl</p>
              </div>
              <div className="space-y-2">
                <div className="w-24 h-24 bg-background border shadow-2xl rounded-lg flex items-center justify-center">
                  <span className="text-sm">2xl</span>
                </div>
                <p className="text-sm font-medium">2X Large</p>
                <p className="text-xs text-muted-foreground">shadow-2xl</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
}
