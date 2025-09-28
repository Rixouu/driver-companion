"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Share2, MessageCircle, Phone, Copy, Check } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n/context';
import { Booking } from '@/types/bookings';

interface BookingShareButtonsProps {
  booking: Booking;
}

export function BookingShareButtons({ booking }: BookingShareButtonsProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        <Button variant="outline" size="sm" className="gap-2 hover:bg-primary/10 transition-colors">
          <Share2 className="h-4 w-4" />
          {t('bookings.details.fields.share')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2 bg-[#111111] border border-gray-800 shadow-lg">
        <div className="px-2 py-1.5 text-xs font-medium text-gray-300 uppercase tracking-wide">
          Share Booking
        </div>
        <DropdownMenuItem 
          onClick={handleWhatsAppShare} 
          className="gap-3 px-3 py-2.5 rounded-md hover:bg-green-900/20 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 bg-green-900/30 rounded-full flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-green-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-100">
              {t('bookings.details.fields.shareWhatsApp')}
            </span>
            <span className="text-xs text-gray-300">
              Share via WhatsApp
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleLineShare} 
          className="gap-3 px-3 py-2.5 rounded-md hover:bg-green-900/20 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 bg-green-900/30 rounded-full flex items-center justify-center">
            <Phone className="h-4 w-4 text-green-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-100">
              {t('bookings.details.fields.shareLine')}
            </span>
            <span className="text-xs text-gray-300">
              Share via LINE
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleCopyLink} 
          className="gap-3 px-3 py-2.5 rounded-md hover:bg-blue-900/20 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 bg-blue-900/30 rounded-full flex items-center justify-center">
            {copied ? (
              <Check className="h-4 w-4 text-blue-400" />
            ) : (
              <Copy className="h-4 w-4 text-blue-400" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-100">
              {copied ? 'Copied!' : t('bookings.details.fields.copyLink')}
            </span>
            <span className="text-xs text-gray-300">
              {copied ? 'Link copied to clipboard' : 'Copy booking link'}
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
