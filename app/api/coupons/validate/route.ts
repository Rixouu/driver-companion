import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/main";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // Simple auth check for development
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { code } = await req.json();

    if (!code || !code.trim()) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    console.log('Validating coupon code:', code.trim());
    const supabase = await getSupabaseServerClient();

    // Query coupon from database
    const { data: couponData, error: couponError } = await supabase
      .from('pricing_promotions')
      .select(`
        id,
        name,
        code,
        discount_type,
        discount_value,
        is_active,
        start_date,
        end_date
      `)
      .eq('code', code.trim())
      .eq('is_active', true)
      .single();

    if (couponError || !couponData) {
      console.log('Coupon query error:', couponError);
      console.log('Coupon data:', couponData);
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 404 }
      );
    }

    // Check if coupon is still valid
    const now = new Date();
    const validFrom = couponData.start_date ? new Date(couponData.start_date) : null;
    const validUntil = couponData.end_date ? new Date(couponData.end_date) : null;

    if (validFrom && now < validFrom) {
      return NextResponse.json(
        { error: "Coupon is not yet valid" },
        { status: 400 }
      );
    }

    if (validUntil && now > validUntil) {
      return NextResponse.json(
        { error: "Coupon has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: couponData.id,
      name: couponData.name,
      code: couponData.code,
      discount_percentage: couponData.discount_type === 'percentage' ? parseFloat(couponData.discount_value) : 0,
      discount_amount: couponData.discount_type === 'amount' ? parseFloat(couponData.discount_value) : 0,
      valid_from: couponData.start_date,
      valid_until: couponData.end_date
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
