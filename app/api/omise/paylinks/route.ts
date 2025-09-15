import { NextRequest, NextResponse } from "next/server";
import { OmiseClient } from "@/lib/omise-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// GET - List all payment links from Omise account
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const order = searchParams.get('order') || 'reverse_chronological';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    console.log('[Paylinks API] Fetching payment links from Omise account with params:', { limit, offset, order, search, status });

    const omise = new OmiseClient();
    
    // For server-side filtering, we need to fetch all data and filter on the server
    // Since Payment Links+ API doesn't support filtering, we'll fetch all data and filter here
    const links = await omise.links.list({
      limit: 1000, // Fetch all data for filtering
      offset: 0,
      order: order as 'chronological' | 'reverse_chronological'
    });
    
    let filteredData = links.data || [];
    
    // Apply search filter
    if (search) {
      filteredData = filteredData.filter((link: any) => 
        (link.title || link.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (link.description || '').toLowerCase().includes(search.toLowerCase()) ||
        link.id.toString().toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply status filter
    if (status !== 'all') {
      filteredData = filteredData.filter((link: any) => {
        if (link.deleted) return status === 'deleted';
        if (link.state === 'paid' || link.used) return status === 'paid';
        if (link.state === 'pending' || link.status === 'active') return status === 'pending';
        return status === 'pending';
      });
    }
    
    // Apply pagination to filtered results
    const total = filteredData.length;
    const paginatedData = filteredData.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    console.log('[Paylinks API] Filtered and paginated results:', {
      originalCount: links.data?.length || 0,
      filteredCount: total,
      paginatedCount: paginatedData.length,
      hasMore,
      search,
      status
    });

    return NextResponse.json({
      success: true,
      data: paginatedData,
      total,
      hasMore
    });

  } catch (error) {
    console.error('Error fetching payment links from Omise:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch payment links from Omise account' 
      },
      { status: 500 }
    );
  }
}

// POST - Create a new payment link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      amount, 
      currency = 'JPY', 
      title, 
      description, 
      multiple = false,
      returnUrl
    } = body;

    console.log('[Paylinks API] Creating payment link with data:', { amount, currency, title, description, multiple });

    if (!amount || !title) {
      return NextResponse.json(
        { success: false, error: 'Amount and title are required' },
        { status: 400 }
      );
    }

    console.log('[Paylinks API] Using Payment Links+ API key:', process.env.OMISE_PAYMENT_LINKS_API_KEY ? 'set' : 'not set');
    console.log('[Paylinks API] Template ID:', process.env.OMISE_TEMPLATE_ID);
    console.log('[Paylinks API] Team ID:', process.env.OMISE_TEAM_ID);

    const omise = new OmiseClient();
    
    // Create payment link
    const link = await omise.links.create({
      amount: amount, // Amount is already in main currency unit, will be converted internally
      currency: currency.toUpperCase(),
      title,
      description: description || '',
      multiple,
      returnUrl
    });

    console.log('[Paylinks API] Created link successfully:', {
      id: link.id,
      title: link.title,
      amount: link.amount,
      payment_uri: link.payment_uri || (link as any).transaction_url
    });

    return NextResponse.json({
      success: true,
      data: link
    });

  } catch (error) {
    console.error('Error creating payment link:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create payment link' 
      },
      { status: 500 }
    );
  }
}
