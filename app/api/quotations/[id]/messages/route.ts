import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service-client';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get quotation ID from params properly in Next.js 15
    const { id: quotationId } = await params;
    console.log('GET Request - Quotation ID:', quotationId);
    
    // Use service client only (no cookies, no auth.getSession)
    const serviceClient = createServiceClient();
    
    // Fetch messages
    const { data, error } = await serviceClient
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
    
    // Return messages without user_name processing
    return NextResponse.json(data || []);
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
    // Get quotation ID from params properly in Next.js 15
    const { id: quotationId } = await params;
    console.log('POST - Quotation ID:', quotationId);
    
    // Get message from request body
    const { message, userId } = await request.json();
    console.log('Message to send:', message?.substring(0, 30) + (message?.length > 30 ? '...' : ''));
    
    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Use service client only (no cookie dependency)
    const serviceClient = createServiceClient();
    
    // First, check if the quotation exists to avoid foreign key issues
    const { data: quotation, error: quotationError } = await serviceClient
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
      user_id: userId,
      message: message.trim(),
      is_from_customer: false,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Inserting message:', messageObject);
    
    // Create the message
    const { data: newMessage, error } = await serviceClient
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
      user_id: userId,
      action: 'message_sent',
      details: {
        message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        message_id: newMessage.id
      },
      created_at: new Date().toISOString()
    };
    
    // Create the activity log
    const { error: activityError } = await serviceClient
      .from('quotation_activities')
      .insert([activityObject]);
    
    if (activityError) {
      console.error('Error creating activity log:', activityError);
      // Don't return error, just log it
    } else {
      console.log('Activity log created for message');
    }
    
    // Return the new message
    return NextResponse.json(newMessage);
  } catch (error: any) {
    console.error('Error in messages POST API:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 