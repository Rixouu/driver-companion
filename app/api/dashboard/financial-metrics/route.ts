import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Get current date for calculations
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
    
    // 1. Overall financial metrics (last 30 days)
    const { data: metricsData, error: metricsError } = await supabase
      .from('quotations')
      .select('total_amount, status')
      .gte('created_at', thirtyDaysAgo.toISOString())
    
    if (metricsError) throw metricsError
    
    const metrics = {
      totalQuotations: metricsData?.length || 0,
      totalRevenue: metricsData?.reduce((sum, q) => sum + (q.total_amount || 0), 0) || 0,
      avgQuoteValue: metricsData?.length > 0 ? 
        metricsData.reduce((sum, q) => sum + (q.total_amount || 0), 0) / metricsData.length : 0,
      approvedQuotes: metricsData?.filter(q => q.status === 'approved').length || 0,
      pendingQuotes: metricsData?.filter(q => q.status === 'sent').length || 0,
      draftQuotes: metricsData?.filter(q => q.status === 'draft').length || 0,
      rejectedQuotes: metricsData?.filter(q => q.status === 'rejected').length || 0,
      convertedQuotes: metricsData?.filter(q => q.status === 'converted').length || 0
    }
    
    // 2. Daily revenue data (last 7 days)
    const { data: dailyData, error: dailyError } = await supabase
      .from('quotations')
      .select('created_at, total_amount')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true })
    
    if (dailyError) throw dailyError
    
    // Group by date and calculate daily totals
    const dailyRevenue = dailyData?.reduce((acc, q) => {
      const date = new Date(q.created_at).toISOString().split('T')[0]
      const existing = acc.find(item => item.date === date)
      if (existing) {
        existing.revenue += q.total_amount || 0
        existing.count += 1
      } else {
        acc.push({ date, revenue: q.total_amount || 0, count: 1 })
      }
      return acc
    }, [] as any[]) || []
    
    // 3. Status distribution data
    const statusDistribution = [
      { name: 'Approved', value: metrics.approvedQuotes, color: '#10b981' },
      { name: 'Pending', value: metrics.pendingQuotes, color: '#f59e0b' },
      { name: 'Rejected', value: metrics.rejectedQuotes, color: '#ef4444' },
      { name: 'Draft', value: metrics.draftQuotes, color: '#6b7280' },
      { name: 'Converted', value: metrics.convertedQuotes, color: '#8b5cf6' }
    ].filter(item => item.value > 0)
    
    // 4. Monthly revenue data (last 6 months)
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('quotations')
      .select('created_at, total_amount')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true })
    
    if (monthlyError) throw monthlyError
    
    // Group by month and calculate monthly totals
    const monthlyRevenue = monthlyData?.reduce((acc, q) => {
      const month = new Date(q.created_at).getMonth() + 1
      const monthName = new Date(0, month - 1).toLocaleString('en', { month: 'short' })
      const existing = acc.find(item => item.month === month)
      if (existing) {
        existing.revenue += q.total_amount || 0
        existing.count += 1
      } else {
        acc.push({ month: monthName, revenue: q.total_amount || 0, count: 1 })
      }
      return acc
    }, [] as any[]) || []
    
    return NextResponse.json({
      metrics,
      dailyRevenue,
      statusDistribution,
      monthlyRevenue
    })
    
  } catch (error) {
    console.error('Error fetching financial metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch financial metrics' },
      { status: 500 }
    )
  }
}
