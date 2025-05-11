import { useState } from 'react';
import { Send, User } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QuotationMessage } from '@/types/quotations';
import { useI18n } from '@/lib/i18n/context';

interface QuotationMessageBlockProps {
  messages: QuotationMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => Promise<boolean>;
}

export function QuotationMessageBlock({
  messages,
  isLoading,
  onSendMessage
}: QuotationMessageBlockProps) {
  const { t } = useI18n();
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    
    setIsSending(true);
    
    try {
      const success = await onSendMessage(messageInput);
      
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
    return format(date, 'MMM d, yyyy HH:mm');
  };

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
            <p>{t('quotations.messageBlock.noMessages')}</p>
            <p className="text-sm mt-2">
              {t('quotations.messageBlock.startConversation')}
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
            placeholder={t('quotations.messageBlock.typePlaceholder')}
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
          <span>{t('quotations.messageBlock.pressEnterHint')}</span>
          <Button
            type="button"
            onClick={handleSendMessage}
            disabled={isSending || !messageInput.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending ? t('common.sending') : t('quotations.messageBlock.send')}
          </Button>
        </div>
      </div>
    </div>
  );
} 