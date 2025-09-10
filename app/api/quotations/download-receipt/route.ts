import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/main";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    const supabaseAuth = await getSupabaseServerClient();
    const { data: { user: supabaseUser } } = await supabaseAuth.auth.getUser();
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (!isDev && !session?.user && !supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receipt_url } = await req.json();

    if (!receipt_url) {
      return NextResponse.json(
        { error: "Missing required field: receipt_url" },
        { status: 400 }
      );
    }

    // Download receipt from Omise API
    const omiseSecretKey = process.env.OMISE_SECRET_KEY;
    if (!omiseSecretKey) {
      return NextResponse.json(
        { error: "Omise secret key not configured" },
        { status: 500 }
      );
    }

    try {
      // Construct full URL if it's a relative path
      const fullUrl = receipt_url.startsWith('http') 
        ? receipt_url 
        : `https://api.omise.co${receipt_url}`;

      const response = await axios.get(fullUrl, {
        auth: {
          username: omiseSecretKey,
          password: ''
        },
        responseType: 'arraybuffer',
        timeout: 30000
      });

      // Get filename from URL or use default
      const filename = receipt_url.includes('/') 
        ? receipt_url.split('/').pop() + '.pdf'
        : 'receipt.pdf';

      // Return the PDF file
      return new NextResponse(response.data, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': response.data.length.toString(),
        },
      });

    } catch (omiseError) {
      console.error('Error downloading receipt from Omise:', omiseError);
      return NextResponse.json(
        { error: "Failed to download receipt from Omise" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error downloading receipt:', error);
    return NextResponse.json(
      { error: 'Failed to download receipt' },
      { status: 500 }
    );
  }
}
