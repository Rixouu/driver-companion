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
import { Quotation } from '@/types/quotations';

interface QuotationShareButtonsProps {
  quotation: Quotation;
}

export function QuotationShareButtons({ quotation }: QuotationShareButtonsProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  // Format quotation number with JPDR prefix
  const formattedQuoteNumber = `JPDR-${quotation?.quote_number?.toString().padStart(4, '0') || 'N/A'}`;
  
  // Get current URL
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  // Create share message
  const shareMessage = t('quotations.share.message', {
    defaultValue: 'Check out this quotation: {title} ({number})\n\n{url}'
  })
    .replace('{title}', quotation.title || t('quotations.details.untitled'))
    .replace('{number}', formattedQuoteNumber)
    .replace('{url}', currentUrl);

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
    toast({
      title: t('quotations.share.whatsapp.success', { defaultValue: 'Opened WhatsApp' }),
      description: t('quotations.share.whatsapp.description', { defaultValue: 'Share the quotation via WhatsApp' }),
    });
  };

  const handleLineShare = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(lineUrl, '_blank');
    setIsOpen(false);
    toast({
      title: t('quotations.share.line.success', { defaultValue: 'Opened LINE' }),
      description: t('quotations.share.line.description', { defaultValue: 'Share the quotation via LINE' }),
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setIsOpen(false);
      toast({
        title: t('quotations.share.copy.success', { defaultValue: 'Link copied!' }),
        description: t('quotations.share.copy.description', { defaultValue: 'Quotation link copied to clipboard' }),
      });
    } catch (error) {
      toast({
        title: t('quotations.share.copy.error', { defaultValue: 'Failed to copy link' }),
        description: t('quotations.share.copy.errorDescription', { defaultValue: 'Please copy the URL manually' }),
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          {t('quotations.share.button', { defaultValue: 'Share' })}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleWhatsAppShare} className="gap-2">
          <MessageCircle className="h-4 w-4 text-green-600" />
          {t('quotations.share.whatsapp.title', { defaultValue: 'WhatsApp' })}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLineShare} className="gap-2">
          <Phone className="h-4 w-4 text-green-500" />
          {t('quotations.share.line.title', { defaultValue: 'LINE' })}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
          <Share2 className="h-4 w-4" />
          {t('quotations.share.copy.title', { defaultValue: 'Copy Link' })}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
