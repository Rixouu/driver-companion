"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Share2, MessageCircle, Phone } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { Booking } from '@/types/bookings';

interface BookingShareButtonsProps {
  booking: Booking;
}

export function BookingShareButtons({ booking }: BookingShareButtonsProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  // Format booking number
  const formattedBookingNumber = `#${booking.wp_id || booking.booking_id || 'N/A'}`;
  
  // Get current URL - use booking number if available, otherwise fall back to current URL
  const getCurrentUrl = () => {
    if (typeof window === 'undefined') return '';
    
    // If we have a booking number, construct the URL with it
    if (booking.wp_id && booking.wp_id.startsWith('QUO-')) {
      const baseUrl = window.location.origin;
      return `${baseUrl}/bookings/${booking.wp_id}`;
    }
    
    // Otherwise use the current URL
    return window.location.href;
  };
  
  const currentUrl = getCurrentUrl();
  
  // Create share message
  const shareMessage = t('bookings.details.fields.checkOutBooking', { bookingNumber: formattedBookingNumber }) + `\n\n${currentUrl}`;

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
    toast({
      title: t('bookings.details.fields.openedWhatsApp'),
      description: t('bookings.details.fields.shareViaWhatsApp'),
    });
  };

  const handleLineShare = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(lineUrl, '_blank');
    setIsOpen(false);
    toast({
      title: t('bookings.details.fields.openedLine'),
      description: t('bookings.details.fields.shareViaLine'),
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setIsOpen(false);
      toast({
        title: t('bookings.details.fields.linkCopied'),
        description: t('bookings.details.fields.bookingLinkCopied'),
      });
    } catch (error) {
      toast({
        title: t('bookings.details.fields.failedToCopyLink'),
        description: t('bookings.details.fields.copyUrlManually'),
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 h-9 w-full sm:w-auto">
          <Share2 className="h-4 w-4" />
          {t('bookings.details.fields.share')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleWhatsAppShare} className="gap-2">
          <MessageCircle className="h-4 w-4 text-green-600" />
          {t('bookings.details.fields.shareWhatsApp')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLineShare} className="gap-2">
          <Phone className="h-4 w-4 text-green-500" />
          {t('bookings.details.fields.shareLine')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
          <Share2 className="h-4 w-4" />
          {t('bookings.details.fields.copyLink')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
