'use client';

import { useState, useEffect, useCallback } from 'react';
import { QuotationMessage, QuotationActivity } from '@/types/quotations';
import { QuotationMessageBlock } from '@/components/quotations/quotation-message-block';
import { QuotationActivityFeed } from '@/components/quotations/quotation-activity-feed';
import { useToast } from '@/components/ui/use-toast';
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Old client
// import { createBrowserClient } from '@supabase/ssr'; // REMOVED
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client"; // ADDED

export function QuotationMessageContainer({ id }: { id: string }) {
  const [messages, setMessages] = useState<QuotationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Use useCallback to avoid re-creating this function on every render
  const fetchMessages = useCallback(async () => {
    // Don't fetch if no ID is provided
    if (!id) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/quotations/${id}/messages`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);
  
  useEffect(() => {
    // Initial fetch
    fetchMessages();
    
    // Set up polling for new messages - use a longer interval to avoid hammering the server
    const interval = setInterval(fetchMessages, 30000); // Every 30 seconds instead of 10
    
    return () => clearInterval(interval);
  }, [fetchMessages]); // Only depends on fetchMessages which is memoized with useCallback

  const sendMessage = async (message: string): Promise<boolean> => {
    try {
      // Get the current user ID from Supabase
      // const supabase = createClientComponentClient(); // Old client
      // const supabase = createBrowserClient( // REMOVED
      //   process.env.NEXT_PUBLIC_SUPABASE_URL!, // REMOVED
      //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // REMOVED
      // ); // REMOVED
      const supabase = getSupabaseBrowserClient(); // ADDED
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`/api/quotations/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          userId: user.id
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const newMessage = await response.json();
      setMessages(prev => [...prev, newMessage]);
      
      // Removed router.refresh() to avoid re-rendering the entire page
      // Instead, we'll just update our local state
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return (
    <QuotationMessageBlock
      messages={messages}
      isLoading={isLoading}
      onSendMessage={sendMessage}
    />
  );
}

export function QuotationActivityContainer({ id }: { id: string }) {
  const [activities, setActivities] = useState<QuotationActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/quotations/${id}/activities`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load activities. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [id]);

  return (
    <QuotationActivityFeed
      activities={activities}
      isLoading={isLoading}
      onRefresh={fetchActivities}
    />
  );
} 