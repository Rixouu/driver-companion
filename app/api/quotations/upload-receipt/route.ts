import { getSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to avoid cookie issues
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Create server-side Supabase client with auth cookies
    const supabase = await getSupabaseServerClient();
    
    // Check authorization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Check if bucket exists and create if needed
    let bucketName = 'receipts';
    let bucketExists = false;
    
    // First, try to get the existing bucket
    const { data: existingBucket } = await supabase.storage.getBucket(bucketName);
    if (existingBucket) {
      bucketExists = true;
      console.log(`Using existing bucket: ${bucketName}`);
    } else {
      // Try to create bucket with different settings to avoid RLS issues
      const bucketOptions = [
        { public: true, allowedMimeTypes: ['image/*', 'application/pdf'] },
        { public: false, allowedMimeTypes: ['image/*', 'application/pdf'] },
        { public: true, allowedMimeTypes: null },
        { public: false, allowedMimeTypes: null }
      ];
      
      let bucketCreated = false;
      for (const options of bucketOptions) {
        try {
          const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, options);
          if (newBucket && !createError) {
            bucketCreated = true;
            bucketExists = true;
            console.log(`Created bucket with options:`, options);
            break;
          }
        } catch (error) {
          console.log(`Failed to create bucket with options:`, options, error);
          continue;
        }
      }
      
      if (!bucketCreated) {
        // If all creation attempts fail, try to use an existing bucket as fallback
        const { data: existingBuckets } = await supabase.storage.listBuckets();
        const fallbackBucket = existingBuckets?.find(b => b.name && b.name !== bucketName);
        
        if (fallbackBucket) {
          bucketName = fallbackBucket.name;
          bucketExists = true;
          console.log(`Using fallback bucket: ${bucketName}`);
        } else {
          return NextResponse.json(
            { error: 'No storage buckets available and unable to create new bucket' },
            { status: 500 }
          );
        }
      }
    }

    // Generate unique filename
    const fileExt = receipt.name.split('.').pop();
    const fileName = `${user.id}/${quotationId}/${Date.now()}-receipt.${fileExt}`;

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
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
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path);

    // Update quotation with receipt URL and payment details
    const { error: updateError } = await supabase
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
      await supabase.storage.from(bucketName).remove([fileName]);
      return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
    }

    // Log activity
    try {
      await supabase
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
