'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils/styles';

export interface InspectionPhoto {
  url: string;
  alt?: string;
}

/**
 * Props for the PhotoViewerModal component.
 */
interface PhotoViewerModalProps {
  /** An array of photo objects to be displayed. */
  images: InspectionPhoto[];
  /** The initial index of the photo to display from the `images` array. Defaults to 0. */
  startIndex?: number;
  /** Controls whether the modal is open or closed. */
  isOpen: boolean;
  /** Callback function invoked when the modal's open state should change (e.g., on close). */
  onOpenChange: (isOpen: boolean) => void;
}

/**
 * A client component modal for displaying a swipeable gallery of inspection photos.
 * It allows downloading the current photo, navigating with buttons or swipe gestures, and closing the modal.
 */
export function PhotoViewerModal({
  images,
  startIndex = 0,
  isOpen,
  onOpenChange,
}: PhotoViewerModalProps) {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    // Reset to startIndex if images array changes or modal re-opens with a new startIndex
    setCurrentIndex(startIndex < images.length && startIndex >= 0 ? startIndex : 0);
  }, [images, startIndex, isOpen]);

  const currentImage = images[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => { if (images.length > 1) handleNext(); },
    onSwipedRight: () => { if (images.length > 1) handlePrev(); },
    preventScrollOnSwipe: true,
    trackMouse: true, // Allow swiping with mouse for desktop accessibility
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || images.length <= 1) return;
      if (event.key === 'ArrowRight') {
        handleNext();
      }
      if (event.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, images.length, handleNext, handlePrev]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!images || images.length === 0) return null;
  if (!currentImage) return null; // Should not happen if images exist and currentIndex is managed

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-3xl p-0 sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl bg-transparent border-0 shadow-none outline-none flex items-center justify-center"
        onInteractOutside={(e) => e.preventDefault()} // Prevent closing on outside click if needed for swipe
      >
        <div {...swipeHandlers} className="relative group w-full h-full flex items-center justify-center focus:outline-none" tabIndex={-1}>
          {/* Image Display - Using a key to force re-render on image change for transitions if added later */} 
          <Image 
            key={currentImage.url} // Key for potential CSS transitions on image change
            src={currentImage.url} 
            alt={currentImage.alt || t('inspections.details.photos.altText', { index: currentIndex + 1 })}
            width={1920} 
            height={1080} 
            className="object-contain w-auto h-auto max-w-full max-h-[85vh] sm:max-h-[90vh] rounded-lg shadow-2xl transition-opacity duration-200 ease-in-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
            priority // Prioritize loading the visible image
          />
          
          {/* Controls: Close and Download */} 
          <div className="absolute top-2 right-2 md:top-4 md:right-4 z-50 flex space-x-2 opacity-80 group-hover:opacity-100 transition-opacity">
            <Button variant="outline" size="icon" className="bg-black/60 hover:bg-black/80 text-white rounded-full h-9 w-9 md:h-10 md:w-10" asChild>
              <a href={currentImage.url} download target="_blank" rel="noopener noreferrer" aria-label={t('inspections.details.photos.downloadPhoto')}>
                <Download className="h-4 w-4 md:h-5 md:w-5" />
              </a>
            </Button>
            <Button variant="outline" size="icon" className="bg-black/60 hover:bg-black/80 text-white rounded-full h-9 w-9 md:h-10 md:w-10" onClick={() => onOpenChange(false)} aria-label={t('common.close')}>
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>

          {/* Navigation Arrows (only if multiple images) */} 
          {images.length > 1 && (
            <>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handlePrev} 
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-50 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10 md:h-12 md:w-12 opacity-60 group-hover:opacity-100 transition-opacity"
                aria-label={t('common.previous')}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleNext} 
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-50 bg-black/40 hover:bg-black/60 text-white rounded-full h-10 w-10 md:h-12 md:w-12 opacity-60 group-hover:opacity-100 transition-opacity"
                aria-label={t('common.next')}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
          
          {/* Optional: Image counter */} 
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
              {t('inspections.details.photos.counter', { current: currentIndex + 1, total: images.length })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 