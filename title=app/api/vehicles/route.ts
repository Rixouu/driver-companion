import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { vehicleSchema } from "@/lib/validations/vehicle";

export async function POST(req: Request) {
  try {
    // Debug: log incoming cookie header (check in your server logs)
    console.log("Cookie header:", req.headers.get("cookie"));

    // Get NextAuth session based on cookies
    const session = await getServerSession(authOptions);
    console.log("NextAuth session:", session);

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const json = await req.json();
    const body = vehicleSchema.parse(json);

    // Create a Supabase client in a server component context 
    // (import dynamically so that this code runs only on the server)
    const { createServerComponentClient } = await import("@supabase/auth-helpers-nextjs");
    const { cookies } = await import("next/headers");
    const supabase = createServerComponentClient({ cookies });

    // Insert a new vehicle record using an identifier from NextAuth.
    // (Change "user_email" to your appropriate column if needed.)
    const { data: vehicle, error: insertError } = await supabase
      .from("vehicles")
      .insert([
        { 
          ...body,
          user_email: session.user.email
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { message: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { createServerComponentClient } = await import("@supabase/auth-helpers-nextjs");
    const { cookies } = await import("next/headers");
    const supabase = createServerComponentClient({ cookies });

    // Optionally protect GET via session as well. For now, we check for a session.
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: vehicles, error } = await supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("[VEHICLES_GET]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
} 