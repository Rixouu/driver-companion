import { cookies } from 'next/headers'
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/page-header"

interface NewMaintenancePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export const dynamic = "force-dynamic"

export default async function NewMaintenancePage({ searchParams }: NewMaintenancePageProps) {
  // Use the function that properly handles cookies in Next.js
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const params = new URLSearchParams();
  for (const key in searchParams) {
    const value = searchParams[key];
    if (typeof value === 'string') {
      params.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v));
    }
  }
  const queryString = params.toString();
  redirect(`/maintenance/schedule${queryString ? `?${queryString}` : ''}`);
} 