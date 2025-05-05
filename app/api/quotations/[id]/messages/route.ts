import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get quotation ID from params - must be properly awaited in Next.js 15
    const quotationId = params.id;
    console.log('GET Request - Quotation ID:', quotationId);
    
    // Create server-side Supabase client with properly awaited cookies
    const supabase = await createServerSupabaseClient();
    
    // Ensure the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    console.log('User authenticated:', !!user);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch messages without attempting to join with users table
    const { data, error } = await supabase
      .from('quotation_messages')
      .select('*')
      .eq('quotation_id', quotationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('Messages found:', data?.length || 0);
    
    // Process data with a default user_name
    const processedMessages = data.map(message => ({
      ...message,
      user_name: message.user_id === user.id ? 'You' : 'System User' // Default name since we don't have users table
    }));
    
    return NextResponse.json(processedMessages);
  } catch (error: any) {
    console.error('Error in messages API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('POST Request started');
  try {
    // Get quotation ID from params - must be properly awaited in Next.js 15
    const quotationId = params.id;
    console.log('POST - Quotation ID:', quotationId);
    
    // Get message from request body
    const { message } = await request.json();
    console.log('Message to send:', message?.substring(0, 30) + (message?.length > 30 ? '...' : ''));
    
    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Create server-side Supabase client with properly awaited cookies
    const supabase = await createServerSupabaseClient();
    console.log('Supabase client created');
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Auth user retrieved:', !!user, user?.id?.substring(0, 8));
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Creating message - explicitly specify only the required fields to avoid any joins
    console.log('Creating message for quotation:', quotationId);
    
    // First, check if the quotation exists to avoid foreign key issues
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('id')
      .eq('id', quotationId)
      .single();
      
    if (quotationError) {
      console.error('Error checking quotation:', quotationError);
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }
    
    // Prepare the message data object explicitly
    const messageObject = {
      quotation_id: quotationId,
      user_id: user.id,
      message: message.trim(),
      is_from_customer: false,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Inserting message:', messageObject);
    
    // Create the message
    const { data: newMessage, error } = await supabase
      .from('quotation_messages')
      .insert([messageObject])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    console.log('Message created successfully:', newMessage?.id);
    
    // Also add an activity log for this message
    const activityObject = {
      quotation_id: quotationId,
      user_id: user.id,
      action: 'message_sent',
      details: {
        message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        message_id: newMessage.id
      },
      created_at: new Date().toISOString()
    };
    
    // Create the activity log
    const { error: activityError } = await supabase
      .from('quotation_activities')
      .insert([activityObject]);
    
    if (activityError) {
      console.error('Error creating activity log:', activityError);
      // Don't return error, just log it
    } else {
      console.log('Activity log created for message');
    }
    
    // Return the processed new message with user_name
    return NextResponse.json({
      ...newMessage,
      user_name: 'You' // Since this is always the current user sending the message
    });
  } catch (error: any) {
    console.error('Error in messages POST API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 