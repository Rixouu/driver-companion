import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    // Get the admin supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });
    
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }
    
    // Create a service role client to bypass RLS
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );
    
    // Parse the request body
    const promotionData = await request.json();
    
    // Insert promotion with service role (bypasses RLS)
    const { data, error } = await serviceRoleClient
      .from('pricing_promotions')
      .insert({
        name: promotionData.name,
        description: promotionData.description,
        code: promotionData.code,
        discount_type: promotionData.discount_type,
        discount_value: promotionData.discount_value,
        start_date: promotionData.start_date,
        end_date: promotionData.end_date,
        is_active: promotionData.is_active,
        applicable_services: promotionData.applicable_services,
        applicable_vehicle_types: promotionData.applicable_vehicle_types,
        times_used: promotionData.times_used || 0
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating promotion:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 