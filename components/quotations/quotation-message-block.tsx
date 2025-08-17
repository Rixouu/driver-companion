"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, User } from 'lucide-react';
import { QuotationMessage } from '@/types/quotations';

interface QuotationMessageBlockProps {
  messages: QuotationMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => Promise<boolean>;
}

export default function QuotationMessageBlock({ 
  messages, 
  isLoading, 
  onSendMessage 
}: QuotationMessageBlockProps) {
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending) return;
    
    setIsSending(true);
    try {
      const success = await onSendMessage(messageInput.trim());
      
      if (success) {
        setMessageInput('');
      }
    } finally {
      setIsSending(false);
    }
  };

  // Function to format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Don't render the textarea until client-side to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="flex flex-col h-full pt-4">
        <div className="space-y-6 overflow-y-auto max-h-[400px] pr-1 mb-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-20 w-[250px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>No messages yet</p>
              <p className="text-sm mt-2">
                Start a conversation with the customer about this quotation
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex items-start gap-3 ${message.is_from_customer ? '' : 'flex-row-reverse'}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className={`
                  grid gap-1 max-w-[80%]
                  ${message.is_from_customer ? 'text-left' : 'text-right ml-auto'}
                `}>
                  <div className={`
                    px-4 py-3 rounded-lg
                    ${message.is_from_customer 
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-800/60 dark:text-gray-100' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}
                  `}>
                    <p className="text-sm">{message.message}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{message.is_from_customer ? 'Customer' : 'Admin'}</span>
                    <span>•</span>
                    <span>{formatDateTime(message.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-5">
          <div className="flex gap-2">
            <Skeleton className="flex-1 min-w-0 px-3 py-2 text-sm border rounded-md min-h-[80px]" />
          </div>
          <div className="flex justify-between mt-3 text-xs text-muted-foreground">
            <span>Press Ctrl+Enter to send</span>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pt-4">
      <div className="space-y-6 overflow-y-auto max-h-[400px] pr-1 mb-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-20 w-[250px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No messages yet</p>
            <p className="text-sm mt-2">
              Start a conversation with the customer about this quotation
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex items-start gap-3 ${message.is_from_customer ? '' : 'flex-row-reverse'}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className={`
                grid gap-1 max-w-[80%]
                ${message.is_from_customer ? 'text-left' : 'text-right ml-auto'}
              `}>
                <div className={`
                  px-4 py-3 rounded-lg
                  ${message.is_from_customer 
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800/60 dark:text-gray-100' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}
                `}>
                  <p className="text-sm">{message.message}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{message.is_from_customer ? 'Customer' : 'Admin'}</span>
                  <span>•</span>
                  <span>{formatDateTime(message.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t pt-5">
        <div className="flex gap-2">
          <textarea
            placeholder="Type your message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 text-sm border rounded-md min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
        </div>
        <div className="flex justify-between mt-3 text-xs text-muted-foreground">
          <span>Press Ctrl+Enter to send</span>
          <Button
            type="button"
            onClick={handleSendMessage}
            disabled={isSending || !messageInput.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </div>
    </div>
  );
} 