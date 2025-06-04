import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getUnreadNotificationsCount } from '@/lib/services/notifications';
import { handleApiError } from '@/lib/errors/error-handler';
import { AuthenticationError, DatabaseError } from '@/lib/errors/app-error';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      throw new AuthenticationError('Authentication failed while fetching user.', 401, authError.stack);
    }
    if (!user) {
      throw new AuthenticationError('User not found or session invalid.');
    }

    const { count, error: serviceError } = await getUnreadNotificationsCount(user.id);

    if (serviceError) {
      throw new DatabaseError(serviceError.message || 'Failed to fetch unread count from service', serviceError.stack);
    }

    return NextResponse.json({ count });
  } catch (error: unknown) {
    return handleApiError(error, { apiRoute: '/api/notifications/unread-count', method: 'GET' });
  }
} 