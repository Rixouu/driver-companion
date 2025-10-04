import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export function QuotationDetailsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header Section - Matches the actual page layout */}
      <div className="space-y-4">
        {/* Title and Share Button Row */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" /> {/* "Test Beer" title */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-64" /> {/* Quotation number and creator */}
              <Skeleton className="h-6 w-32 rounded-full" /> {/* Status badge */}
            </div>
          </div>
          <Skeleton className="h-9 w-20" /> {/* Share button */}
        </div>

        {/* Success Message Bar */}
        <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
          <Skeleton className="h-4 w-4 rounded-full" /> {/* Green dot */}
          <Skeleton className="h-4 w-48" /> {/* Success message */}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Skeleton className="h-10 w-40" /> {/* Download Invoice button */}
          <Skeleton className="h-10 w-44" /> {/* Send Magic Link button */}
        </div>
      </div>

      {/* Quotation Workflow Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" /> {/* Document icon */}
            <Skeleton className="h-6 w-40" /> {/* "Quotation Workflow" title */}
          </div>
          <Skeleton className="h-4 w-80" /> {/* Description */}
        </CardHeader>
        <CardContent>
          {/* Workflow Progress Circles */}
          <div className="flex items-center justify-between mb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <Skeleton className="h-8 w-8 rounded-full" /> {/* Progress circle */}
                <Skeleton className="h-4 w-16" /> {/* Stage name */}
                <Skeleton className="h-3 w-20" /> {/* "Click for details" */}
              </div>
            ))}
          </div>
          
          {/* Current Status */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" /> {/* "Status:" label */}
            <Skeleton className="h-6 w-32 rounded-full" /> {/* Status badge */}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid - Matches the actual 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" /> {/* Person icon */}
                <Skeleton className="h-6 w-40" /> {/* "Customer Information" title */}
              </div>
              <Skeleton className="h-4 w-56" /> {/* Description */}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" /> {/* Person icon */}
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" /> {/* "Full Name" label */}
                      <Skeleton className="h-5 w-32" /> {/* Name value */}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" /> {/* Mail icon */}
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-20" /> {/* "Email" label */}
                      <Skeleton className="h-5 w-48" /> {/* Email value */}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" /> {/* Phone icon */}
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-16" /> {/* "Phone" label */}
                      <Skeleton className="h-5 w-32" /> {/* Phone value */}
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" /> {/* Building icon */}
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" /> {/* "Company" label */}
                      <Skeleton className="h-5 w-32" /> {/* Company value */}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" /> {/* Map pin icon */}
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-20" /> {/* "Address" label */}
                      <Skeleton className="h-5 w-40" /> {/* Address value */}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Services Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" /> {/* Car icon */}
                  <Skeleton className="h-6 w-36" /> {/* "Selected Services" title */}
                  <Skeleton className="h-4 w-24" /> {/* "2 services selected" */}
                </div>
                <Skeleton className="h-8 w-20" /> {/* Expand button */}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Service Items */}
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5" /> {/* Service icon */}
                      <div className="space-y-1">
                        <Skeleton className="h-5 w-48" /> {/* Service name */}
                        <Skeleton className="h-4 w-64" /> {/* Service details */}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-20" /> {/* Price */}
                      <Skeleton className="h-4 w-4" /> {/* Dropdown arrow */}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Total Amount */}
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" /> {/* "Total Amount" label */}
                  <Skeleton className="h-5 w-20" /> {/* Total value */}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar (1/3 width) */}
        <div className="space-y-6">
          {/* Price Details Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" /> {/* Document icon */}
                  <Skeleton className="h-6 w-28" /> {/* "Price Details" title */}
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-16" /> {/* Currency selector */}
                  <Skeleton className="h-5 w-5" /> {/* Clock icon */}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Service Items in Price Details */}
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" /> {/* Service name */}
                    <Skeleton className="h-4 w-20" /> {/* Price */}
                  </div>
                  <Skeleton className="h-3 w-40" /> {/* Quantity details */}
                </div>
              ))}
              
              <Separator />
              
              {/* Pricing Summary */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" /> {/* "Services Subtotal" */}
                  <Skeleton className="h-4 w-20" /> {/* Subtotal value */}
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" /> {/* "Discount" */}
                  <Skeleton className="h-4 w-16" /> {/* Discount value */}
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" /> {/* "Subtotal" */}
                  <Skeleton className="h-4 w-20" /> {/* Subtotal value */}
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-12" /> {/* "Tax" */}
                  <Skeleton className="h-4 w-16" /> {/* Tax value */}
                </div>
              </div>
              
              <Separator />
              
              {/* Total Amount Due */}
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-32" /> {/* "Total Amount Due" */}
                <Skeleton className="h-6 w-24" /> {/* Total amount */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Compact skeleton for mobile/tablet views
export function QuotationDetailsSkeletonCompact() {
  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Status Badge */}
      <Skeleton className="h-6 w-24" />

      {/* Customer Info */}
      <div className="flex items-center space-x-3 p-3 border rounded-lg">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1 flex-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>

      {/* Main Info */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Services */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
        <Separator />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    </div>
  )
}

// Skeleton for pricing details loading
export function PricingDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 xl:gap-6">
        {/* Main Content Skeleton */}
        <div className="xl:col-span-2 space-y-4 xl:space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Customer Info Skeleton */}
                <div className="space-y-3">
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="h-20 bg-muted animate-pulse rounded-lg" />
                      <div className="h-16 bg-muted animate-pulse rounded-lg" />
                      <div className="h-16 bg-muted animate-pulse rounded-lg" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-20 bg-muted animate-pulse rounded-lg" />
                      <div className="h-16 bg-muted animate-pulse rounded-lg" />
                    </div>
                  </div>
                </div>
                
                {/* Services Skeleton */}
                <div className="space-y-3">
                  <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                </div>
                
                {/* Pricing Summary Skeleton */}
                <div className="space-y-3">
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
