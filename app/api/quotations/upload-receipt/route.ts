import { getSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Create server-side Supabase client with auth cookies for user validation
    const supabase = await getSupabaseServerClient();
    
    // Check authorization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create service role client for database operations (bypasses RLS)
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Parse form data
    const formData = await request.formData();
    const receipt = formData.get('receipt') as File;
    const quotationId = formData.get('quotation_id') as string;
    const paymentDate = formData.get('payment_date') as string;
    const paymentAmount = formData.get('payment_amount') as string;
    const paymentMethod = formData.get('payment_method') as string;

    if (!receipt || !quotationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(receipt.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, JPG, PNG, DOC, DOCX are allowed.' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (receipt.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    // Use the existing receipts bucket directly
    const bucketName = 'receipts';
    console.log(`Using existing bucket: ${bucketName}`);

    // Generate unique filename
    const fileExt = receipt.name.split('.').pop();
    const fileName = `${user.id}/${quotationId}/${Date.now()}-receipt.${fileExt}`;

    // Upload file to storage using service role client
    const { data: uploadData, error: uploadError } = await serviceRoleClient.storage
      .from(bucketName)
      .upload(fileName, receipt, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Receipt upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload receipt' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = serviceRoleClient.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path);

    // Update quotation with receipt URL and payment details using service role client
    const { error: updateError } = await serviceRoleClient
      .from('quotations')
      .update({
        receipt_url: urlData.publicUrl,
        payment_amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        payment_date: paymentDate,
        status: 'paid',
        payment_completed_at: new Date().toISOString()
      })
      .eq('id', quotationId);

    if (updateError) {
      console.error('Error updating quotation:', updateError);
      // Delete uploaded file if update fails
      await serviceRoleClient.storage.from(bucketName).remove([fileName]);
      return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
    }

    // Log activity using service role client
    try {
      await serviceRoleClient
        .from('quotation_activities')
        .insert({
          quotation_id: quotationId,
          user_id: user.id,
          action: 'receipt_uploaded',
          details: JSON.stringify({ 
            receipt_url: urlData.publicUrl,
            payment_amount: paymentAmount,
            payment_method: paymentMethod,
            payment_date: paymentDate,
            bucket_used: bucketName
          })
        });
    } catch (activityError) {
      console.error('Failed to log activity:', activityError);
    }

    return NextResponse.json({ 
      success: true, 
      receipt_url: urlData.publicUrl,
      message: 'Receipt uploaded successfully' 
    });

  } catch (error) {
    console.error('Unexpected error in receipt upload:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
