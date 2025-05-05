import { formatDistanceToNow } from 'date-fns';
import { useState, useMemo } from 'react';
import { 
  Check, Clock, Edit, Mail, Send, X, AlertCircle, 
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QuotationActivity } from '@/types/quotations';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

interface QuotationActivityFeedProps {
  activities: QuotationActivity[];
  isLoading: boolean;
  onRefresh: () => void;
}

type ActivityFilter = 'all' | 'updates' | 'messages';

export function QuotationActivityFeed({
  activities,
  isLoading,
  onRefresh
}: QuotationActivityFeedProps) {
  const { t } = useI18n();
  const [visibleEntriesCount, setVisibleEntriesCount] = useState(6);
  const [filterType, setFilterType] = useState<ActivityFilter>('all');

  // Sort activities by date, newest first
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [activities]);

  // Filter activities by type
  const filteredActivities = useMemo(() => {
    if (filterType === 'all') return sortedActivities;
    
    if (filterType === 'messages') {
      return sortedActivities.filter(activity => activity.action === 'message_sent');
    }
    
    if (filterType === 'updates') {
      return sortedActivities.filter(activity => 
        ['created', 'updated', 'sent', 'approved', 'rejected', 'converted'].includes(activity.action)
      );
    }
    
    return sortedActivities;
  }, [sortedActivities, filterType]);

  // Get visible activities based on the current limit
  const visibleActivities = useMemo(() => {
    return filteredActivities.slice(0, visibleEntriesCount);
  }, [filteredActivities, visibleEntriesCount]);

  // Function to get the appropriate icon for each activity type
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-amber-500" />;
      case 'sent':
        return <Send className="h-4 w-4 text-indigo-500" />;
      case 'approved':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-500" />;
      case 'converted':
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      case 'message_sent':
        return <Mail className="h-4 w-4 text-blue-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Function to format the activity text
  const getActivityText = (activity: QuotationActivity) => {
    const userName = activity.user_name || 'Someone';
    
    switch (activity.action) {
      case 'created':
        return t('quotations.activities.feed.created', { userName }) || `${userName} created this quotation`;
      case 'updated':
        return t('quotations.activities.feed.updated', { userName }) || `${userName} updated the quotation details`;
      case 'sent':
        return t('quotations.activities.feed.sent', { userName }) || `${userName} sent the quotation to the customer`;
      case 'approved':
        return t('quotations.activities.feed.approved', { userName }) || `${userName} approved the quotation`;
      case 'rejected':
        const reasonText = activity.details?.reason ? `: "${activity.details.reason}"` : '';
        return t('quotations.activities.feed.rejected', { userName, reason: activity.details?.reason || '' }) || 
          `${userName} rejected the quotation${reasonText}`;
      case 'converted':
        return t('quotations.activities.feed.converted', { userName }) || `${userName} converted the quotation to a booking`;
      case 'message_sent':
        return t('quotations.activities.feed.message', { 
          userName, 
          message: activity.details?.message_preview || '' 
        }) || `${userName} sent a message: "${activity.details?.message_preview || ''}"`;
      default:
        return t('quotations.activities.feed.default', { 
          userName, 
          action: activity.action 
        }) || `${userName} performed action: ${activity.action}`;
    }
  };

  // Handle loading more entries
  const handleLoadMore = () => {
    setVisibleEntriesCount(prev => prev + 6);
  };

  const hasMoreEntries = filteredActivities.length > visibleActivities.length;

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="text-xl font-medium">
            {t('quotations.details.activities') || 'Activity Feed'}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            title={t('quotations.activities.refresh') || "Refresh"}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex justify-between space-x-2 py-2">
          <div className="flex space-x-2">
            <Button 
              variant={filterType === 'all' ? "default" : "outline"} 
              size="sm" 
              onClick={() => setFilterType('all')}
              className="text-sm px-3 h-9"
            >
              {t('quotations.activities.filters.all') || "All Activities"}
            </Button>
            <Button 
              variant={filterType === 'updates' ? "default" : "outline"} 
              size="sm" 
              onClick={() => setFilterType('updates')}
              className="text-sm px-3 h-9"
            >
              {t('quotations.activities.filters.updates') || "Updates"}
            </Button>
            <Button 
              variant={filterType === 'messages' ? "default" : "outline"} 
              size="sm" 
              onClick={() => setFilterType('messages')}
              className="text-sm px-3 h-9"
            >
              {t('quotations.activities.filters.messages') || "Messages"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-sm">
              <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
              <p>{filterType === 'all' 
                ? (t('quotations.activities.empty.all') || 'No activities recorded yet') 
                : filterType === 'updates'
                  ? (t('quotations.activities.empty.updates') || 'No updates found')
                  : (t('quotations.activities.empty.messages') || 'No messages found')}
              </p>
            </div>
          ) : (
            <>
              {visibleActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-4 mb-2 border-b last:border-b-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">
                      {getActivityText(activity)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              
              {hasMoreEntries && (
                <div className="pt-4 text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLoadMore}
                    className="text-sm"
                  >
                    {t('quotations.activities.loadMore', { count: (filteredActivities.length - visibleActivities.length).toString() }) || 
                      `Load More (${filteredActivities.length - visibleActivities.length} more)`}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 