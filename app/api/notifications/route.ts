import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getNotifications } from '@/lib/services/notifications';
import { handleApiError } from '@/lib/errors/error-handler';
import { AuthenticationError, DatabaseError } from '@/lib/errors/app-error';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      // Log the original Supabase auth error for debugging if needed
      // console.error('Supabase auth error:', authError);
      throw new AuthenticationError('Authentication failed while fetching user.', 401, authError.stack);
    }
    if (!user) {
      throw new AuthenticationError('User not found or session invalid.');
    }

    // Assume getNotifications service function might throw an error or return an error object
    const { notifications, error: serviceError } = await getNotifications(user.id);

    if (serviceError) {
      // It's better if serviceError is an instance of AppError or a well-known error type
      // For now, wrapping it as a DatabaseError if it's not already an AppError
      // console.error('Service error fetching notifications:', serviceError);
      throw new DatabaseError(serviceError.message || 'Failed to fetch notifications from service', serviceError.stack);
    }

    return NextResponse.json(notifications);
  } catch (error: unknown) {
    // All errors (custom AppError or unexpected) are caught here and processed
    return handleApiError(error, { apiRoute: '/api/notifications', method: 'GET' });
  }
} 