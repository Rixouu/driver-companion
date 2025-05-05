import { supabase } from '@/lib/supabase/client';
import { QuotationMessage } from '@/types/quotations';

export async function getQuotationMessages(quotationId: string): Promise<QuotationMessage[]> {
  const { data, error } = await supabase
    .from('quotation_messages')
    .select(`
      id,
      quotation_id,
      user_id,
      users (name),
      message,
      is_from_customer,
      is_read,
      created_at
    `)
    .eq('quotation_id', quotationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching quotation messages:', error);
    throw new Error('Failed to fetch quotation messages');
  }

  // Transform the data to match the QuotationMessage interface
  return data.map(item => ({
    id: item.id,
    quotation_id: item.quotation_id,
    user_id: item.user_id,
    user_name: item.users?.name,
    message: item.message,
    is_from_customer: item.is_from_customer,
    is_read: item.is_read,
    created_at: item.created_at,
  }));
}

export async function sendQuotationMessage(
  quotationId: string, 
  userId: string, 
  message: string,
  isFromCustomer: boolean = false
): Promise<QuotationMessage | null> {
  // Insert the message
  const { data, error } = await supabase
    .from('quotation_messages')
    .insert({
      quotation_id: quotationId,
      user_id: userId,
      message,
      is_from_customer: isFromCustomer,
      is_read: false,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error sending quotation message:', error);
    throw new Error('Failed to send message');
  }

  // Create an activity record for the message
  await supabase
    .from('quotation_activities')
    .insert({
      quotation_id: quotationId,
      user_id: userId,
      action: 'message_sent',
      details: {
        message_preview: message.length > 50 ? `${message.substring(0, 50)}...` : message
      }
    });

  // Get the user name for the response
  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', userId)
    .single();

  return {
    id: data.id,
    quotation_id: data.quotation_id,
    user_id: data.user_id,
    user_name: userData?.name,
    message: data.message,
    is_from_customer: data.is_from_customer,
    is_read: data.is_read,
    created_at: data.created_at,
  };
}

export async function markMessagesAsRead(
  quotationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('quotation_messages')
    .update({ is_read: true })
    .eq('quotation_id', quotationId)
    .eq('is_read', false)
    .neq('user_id', userId);

  if (error) {
    console.error('Error marking messages as read:', error);
    throw new Error('Failed to mark messages as read');
  }
} 