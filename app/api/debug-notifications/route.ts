import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-admin';
import { NotificationService } from '@/lib/services/notification-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const notificationService = new NotificationService();

    console.log('🔍 Debugging notification system...');

    // Test 1: Check user_profiles view
    console.log('📋 Testing user_profiles view...');
    const { data: allUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, is_active')
      .eq('is_active', true);

    if (usersError) {
      console.error('❌ Error fetching users from user_profiles:', usersError.message);
      
      // Test 2: Check admin_users table as fallback
      console.log('📋 Testing admin_users table...');
      const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('id, email');
      
      if (adminError) {
        console.error('❌ Error fetching admin users:', adminError.message);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch users from both user_profiles and admin_users',
          user_profiles_error: usersError.message,
          admin_users_error: adminError.message
        });
      } else {
        console.log('✅ Admin users found:', adminUsers?.length || 0);
        return NextResponse.json({
          success: true,
          source: 'admin_users',
          userCount: adminUsers?.length || 0,
          users: adminUsers
        });
      }
    } else {
      console.log('✅ Active users found:', allUsers?.length || 0);
      return NextResponse.json({
        success: true,
        source: 'user_profiles',
        userCount: allUsers?.length || 0,
        users: allUsers
      });
    }

  } catch (error) {
    console.error('❌ Debug notification error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const notificationService = new NotificationService();
    
    console.log('🧪 Testing notification creation...');

    // Test creating a notification for all users
    await notificationService.createAdminNotification(
      'booking_reminder_24h',
      {
        bookingId: 'test-booking-id',
        wpId: 'TEST-123',
        customerName: 'Test Customer',
        serviceName: 'Test Service',
        time: '10:00',
        pickupLocation: 'Test Location',
        date: '2025-01-08'
      },
      'test-booking-id'
    );

    console.log('✅ Test notification created successfully');

    return NextResponse.json({
      success: true,
      message: 'Test notification created successfully'
    });

  } catch (error) {
    console.error('❌ Test notification error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}