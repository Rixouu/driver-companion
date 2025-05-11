import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from '@/components/ui/use-toast';
import { QuotationActivity, QuotationMessage } from '@/types/quotations';
import { useI18n } from '@/lib/i18n/context';
import { Database } from '@/types/supabase';

export const useQuotationMessages = (quotationId: string) => {
  const [activities, setActivities] = useState<QuotationActivity[]>([]);
  const [messages, setMessages] = useState<QuotationMessage[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();
  const supabase = createClientComponentClient<Database>();

  // Load activities for the quotation
  const loadActivities = useCallback(async () => {
    if (!quotationId) return;
    
    setIsLoadingActivities(true);
    setError(null);
    
    try {
      // Use the API endpoint to fetch activities
      const response = await fetch(`/api/quotations/${quotationId}/activities`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load activities');
      }
      
      const processedActivities = await response.json();
      setActivities(processedActivities);
    } catch (err: any) {
      console.error('Error loading activities:', err);
      setError(err.message || 'Failed to load activities');
    } finally {
      setIsLoadingActivities(false);
    }
  }, [quotationId]);

  // Load messages for the quotation
  const loadMessages = useCallback(async () => {
    if (!quotationId) return;
    
    setIsLoadingMessages(true);
    setError(null);
    
    try {
      // Use the API endpoint to fetch messages
      const response = await fetch(`/api/quotations/${quotationId}/messages`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load messages');
      }
      
      const processedMessages = await response.json();
      setMessages(processedMessages);
    } catch (err: any) {
      console.error('Error loading messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [quotationId]);

  // Send a new message
  const sendMessage = async (message: string): Promise<boolean> => {
    if (!quotationId || !message.trim()) return false;
    
    setIsSendingMessage(true);
    setError(null);
    
    try {
      // Get the current user ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Use the API endpoint instead of direct database insert
      const response = await fetch(`/api/quotations/${quotationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: message.trim(),
          userId: user.id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      const newMessage = await response.json();
      
      // Add the new message to the list
      setMessages(prev => [...prev, newMessage]);
      
      // Refresh activities to show the new activity
      loadActivities();
      
      return true;
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      
      toast({
        title: t('system.notifications.error'),
        description: err.message || 'Failed to send message',
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Load data when component mounts or quotationId changes
  useEffect(() => {
    if (quotationId) {
      loadActivities();
      loadMessages();
      
      // Set up realtime subscription for messages
      const messagesSubscription = supabase
        .channel('quotation_messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'quotation_messages',
          filter: `quotation_id=eq.${quotationId}`
        }, (payload) => {
          // Only add the message if it's not from the current user
          // to avoid duplicates since we already add it manually above
          const newMessage = payload.new as QuotationMessage;
          
          // Check if this message is already in the list
          setMessages(prev => {
            // Only add if not already in the list
            const messageExists = prev.some(msg => msg.id === newMessage.id);
            if (!messageExists) {
              return [...prev, newMessage];
            }
            return prev;
          });
        })
        .subscribe();
      
      // Set up realtime subscription for activities
      const activitiesSubscription = supabase
        .channel('quotation_activities')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'quotation_activities',
          filter: `quotation_id=eq.${quotationId}`
        }, () => {
          // Reload activities when new ones are added
          loadActivities();
        })
        .subscribe();
      
      // Clean up subscriptions
      return () => {
        supabase.removeChannel(messagesSubscription);
        supabase.removeChannel(activitiesSubscription);
      };
    }
  }, [quotationId, loadActivities, loadMessages, supabase]);

  return {
    activities,
    messages,
    isLoadingActivities,
    isLoadingMessages,
    isSendingMessage,
    error,
    sendMessage,
    refreshActivities: loadActivities,
    refreshMessages: loadMessages
  };
}; 