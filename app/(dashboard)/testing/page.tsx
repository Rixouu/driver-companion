"use client"

import { EnhancedEmailTest } from '@/components/testing/enhanced-email-test'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TestTube, 
  Mail, 
  Database, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Users,
  FileText,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

// =============================================================================
// TESTING DASHBOARD - Professional Testing Area
// =============================================================================

const emailRoutes = [
  // Unified System (New)
  { 
    path: '/api/quotations/send-email-unified', 
    name: 'Quotation Email (Unified)', 
    status: 'unified', 
    description: 'New unified quotation email system' 
  },
  { 
    path: '/api/bookings/send-email-unified', 
    name: 'Booking Email (Unified)', 
    status: 'unified', 
    description: 'New unified booking email system' 
  },
  { 
    path: '/api/admin/email-templates', 
    name: 'Template Management', 
    status: 'unified', 
    description: 'Database template management' 
  },
  
  // Old System (Needs Migration)
  { 
    path: '/api/quotations/send-email-unified', 
    name: 'Quotation Email (Unified)', 
    status: 'active', 
    description: 'Unified quotation email system' 
  },
  { 
    path: '/api/quotations/send-reminder', 
    name: 'Quotation Reminder', 
    status: 'old', 
    description: 'Quotation reminder emails' 
  },
  { 
    path: '/api/quotations/send-payment-link-email', 
    name: 'Payment Link Email', 
    status: 'old', 
    description: 'Payment link email notifications' 
  },
  { 
    path: '/api/quotations/send-payment-complete-email', 
    name: 'Payment Complete Email', 
    status: 'old', 
    description: 'Payment completion notifications' 
  },
  { 
    path: '/api/bookings/send-booking-details', 
    name: 'Booking Details Email', 
    status: 'old', 
    description: 'Booking confirmation emails' 
  },
  { 
    path: '/api/bookings/send-booking-invoice', 
    name: 'Booking Invoice Email', 
    status: 'old', 
    description: 'Booking invoice emails' 
  },
  { 
    path: '/api/bookings/send-payment-complete-email', 
    name: 'Booking Payment Complete', 
    status: 'old', 
    description: 'Booking payment completion' 
  },
  { 
    path: '/api/send-invoice-email', 
    name: 'Invoice Email', 
    status: 'old', 
    description: 'General invoice email system' 
  }
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'unified':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'old':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'migrating':
      return <Clock className="h-4 w-4 text-yellow-500" />
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'unified':
      return <Badge variant="default" className="bg-green-100 text-green-800">Unified</Badge>
    case 'old':
      return <Badge variant="destructive">Old System</Badge>
    case 'migrating':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Migrating</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

export default function TestingPage() {
  const unifiedCount = emailRoutes.filter(route => route.status === 'unified').length
  const oldCount = emailRoutes.filter(route => route.status === 'old').length
  const totalCount = emailRoutes.length

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <TestTube className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Testing Dashboard
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Professional testing area for all system components
          </p>
        </div>

        {/* System Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Email System Migration Status
            </CardTitle>
            <CardDescription>
              Current status of email system migration to unified architecture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{unifiedCount}</div>
                <div className="text-sm text-green-700 dark:text-green-300">Unified Routes</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{oldCount}</div>
                <div className="text-sm text-red-700 dark:text-red-300">Old Routes</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{totalCount}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Total Routes</div>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Migration Progress</span>
                <span>{Math.round((unifiedCount / totalCount) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.round((unifiedCount / totalCount) * 100)}%`,
                    minWidth: '0%',
                    maxWidth: '100%'
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Routes Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Routes Status
            </CardTitle>
            <CardDescription>
              All email-related API routes and their migration status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emailRoutes.map((route, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(route.status)}
                    <div>
                      <div className="font-medium">{route.name}</div>
                      <div className="text-sm text-gray-500 font-mono">{route.path}</div>
                      <div className="text-xs text-gray-400">{route.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(route.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Testing Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Email Testing Tools
            </CardTitle>
            <CardDescription>
              User-friendly testing tools with real data - no technical knowledge required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedEmailTest />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold mb-2">Test with Real Data</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select from actual quotations and bookings in your system
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold mb-2">Template Preview</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See exactly how emails will look before sending
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Settings className="h-8 w-8 mx-auto mb-3 text-purple-600" />
              <h3 className="font-semibold mb-2">Easy Configuration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Simple dropdowns and checkboxes - no manual ID entry
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Migration Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Migration Guide
            </CardTitle>
            <CardDescription>
              Complete guide for migrating all email routes to the unified system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Current Status
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Only <strong>3 out of {totalCount}</strong> email routes are using the unified system. 
                The quotation workflow has been updated, but other email types still use the old hardcoded system.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">📋 Complete Migration Guide</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Detailed step-by-step guide for migrating all 87 remaining email routes to the unified system.
                </p>
                <a 
                  href="/docs/EMAIL_ROUTE_MIGRATION_GUIDE.md" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Migration Guide
                </a>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-semibold">Quick Next Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Start with <strong>Phase 1: Core Quotation Emails</strong></li>
                  <li>Use the enhanced testing page to validate each migration</li>
                  <li>Follow the migration checklist for each route</li>
                  <li>Test with real data before going live</li>
                  <li>Remove old routes after successful migration</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
