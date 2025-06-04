import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { markAllNotificationsAsRead } from '@/lib/services/notifications';
import { handleApiError } from '@/lib/errors/error-handler';
import { AuthenticationError, DatabaseError } from '@/lib/errors/app-error';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      throw new AuthenticationError('Authentication failed while fetching user.', 401, authError.stack);
    }
    if (!user) {
      throw new AuthenticationError('User not found or session invalid.');
    }

    const { error: serviceError } = await markAllNotificationsAsRead(user.id);

    if (serviceError) {
      throw new DatabaseError(serviceError.message || 'Failed to mark all notifications as read', serviceError.stack);
    }

    return NextResponse.json({ message: 'All notifications marked as read' });
  } catch (error: unknown) {
    return handleApiError(error, { apiRoute: '/api/notifications/mark-all-as-read', method: 'POST' });
  }
} 