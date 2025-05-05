import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get quotation ID from params - properly awaited in Next.js 15
    const { id: quotationId } = await params;
    console.log('Activities GET - Quotation ID:', quotationId);
    
    // Create server-side Supabase client with properly awaited cookies
    const supabase = await createServerSupabaseClient();
    console.log('Activities - Supabase client created');
    
    // Ensure the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Activities - User authenticated:', !!user);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch activities without attempting to join with users table
    // Explicitly specify which fields to select to avoid any implicit joins
    const { data, error } = await supabase
      .from('quotation_activities')
      .select('id, quotation_id, user_id, action, details, created_at')
      .eq('quotation_id', quotationId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching activities:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('Activities found:', data?.length || 0);
    
    // Process data with a default user_name
    const processedActivities = data.map(activity => ({
      ...activity,
      user_name: activity.user_id === user.id ? 'You' : 'System User' // Personalize the current user's activities
    }));
    
    return NextResponse.json(processedActivities);
  } catch (error: any) {
    console.error('Error in activities API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 