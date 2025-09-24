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
import { Quotation } from '@/types/quotations';

interface QuotationShareButtonsProps {
  quotation: Quotation;
}

export function QuotationShareButtons({ quotation }: QuotationShareButtonsProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Format quotation number with JPDR prefix
  const formattedQuoteNumber = `QUO-JPDR-${quotation?.quote_number?.toString().padStart(6, '0') || 'N/A'}`;
  
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
        <Button variant="outline" size="sm" className="gap-2 hover:bg-primary/10 transition-colors">
          <Share2 className="h-4 w-4" />
          {t('quotations.share.button', { defaultValue: 'Share' })}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2 bg-[#111111] border border-gray-800 shadow-lg">
        <div className="px-2 py-1.5 text-xs font-medium text-gray-300 uppercase tracking-wide">
          Share Quotation
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
              {t('quotations.share.whatsapp.title', { defaultValue: 'WhatsApp' })}
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
              {t('quotations.share.line.title', { defaultValue: 'LINE' })}
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
              {copied ? 'Copied!' : t('quotations.share.copy.title', { defaultValue: 'Copy Link' })}
            </span>
            <span className="text-xs text-gray-300">
              {copied ? 'Link copied to clipboard' : 'Copy quotation link'}
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
