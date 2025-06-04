import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PhotoViewerModal, type InspectionPhoto } from './photo-viewer-modal';

// Mock i18n
vi.mock('@/lib/i18n/context', () => ({
  useI18n: () => ({
    t: (key: string, params?: any) => {
      if (params) {
        return `${key}_${Object.values(params).join('_')}`; // e.g. inspections.photoAlt_index_1
      }
      return key;
    },
    locale: 'en',
  }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, priority, ...rest }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={src} 
      alt={alt} 
      data-priority={priority ? 'true' : 'false'}
      {...rest} 
    />
  ),
}));

// Mock useSwipeable
const mockUseSwipeable = vi.fn();
vi.mock('react-swipeable', () => ({
  useSwipeable: (options: any) => mockUseSwipeable(options),
}));


describe('PhotoViewerModal', () => {
  const mockOnOpenChange = vi.fn();
  const mockImages: InspectionPhoto[] = [
    { url: 'http://example.com/photo1.jpg', alt: 'Photo 1 Alt' },
    { url: 'http://example.com/photo2.jpg', alt: 'Photo 2 Alt' },
    { url: 'http://example.com/photo3.jpg' }, // Alt will be generated
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Provide a default implementation for useSwipeable handlers
    mockUseSwipeable.mockImplementation(options => {
      // Return dummy handlers so the spread operator in the component doesn't fail
      return {
        ref: vi.fn(), // Example, adjust based on actual useSwipeable usage if needed
        onMouseDown: options.trackMouse ? vi.fn() : undefined,
      };
    });
  });

  const renderModal = (props: Partial<Parameters<typeof PhotoViewerModal>[0]> = {}) => {
    const defaultProps: Parameters<typeof PhotoViewerModal>[0] = {
      images: [mockImages[0]], // Default to a single image
      startIndex: 0,
      isOpen: true,
      onOpenChange: mockOnOpenChange,
    };
    return render(<PhotoViewerModal {...defaultProps} {...props} />);
  };

  it('should return null if images array is empty', () => {
    const { container } = renderModal({ images: [] });
    expect(container.firstChild).toBeNull();
  });

  it('should not render dialog content if isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByAltText(mockImages[0].alt!)).not.toBeInTheDocument();
  });

  it('should render the dialog with the first image when isOpen is true', () => {
    renderModal({ images: mockImages, startIndex: 0 });
    const imgElement = screen.getByAltText(mockImages[0].alt!) as HTMLImageElement;
    expect(imgElement).toBeInTheDocument();
    expect(imgElement.src).toBe(mockImages[0].url);
    expect(imgElement.dataset.priority).toBe('true');
  });
  
  it('should render the image specified by startIndex', () => {
    renderModal({ images: mockImages, startIndex: 1 });
    const imgElement = screen.getByAltText(mockImages[1].alt!) as HTMLImageElement;
    expect(imgElement).toBeInTheDocument();
    expect(imgElement.src).toBe(mockImages[1].url);
  });

  it('should use generated alt text if alt is not provided in image object', () => {
    renderModal({ images: [mockImages[2]], startIndex: 0 }); // only photo3 which has no alt
    const imgElement = screen.getByAltText('inspections.photoAlt_index_1') as HTMLImageElement;
    expect(imgElement).toBeInTheDocument();
  });

  it('should have a download button with correct href for the current image', () => {
    renderModal({ images: mockImages, startIndex: 1 });
    const downloadLink = screen.getByLabelText('inspections.details.photos.downloadPhoto');
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute('href', mockImages[1].url);
    expect(downloadLink).toHaveAttribute('download');
  });

  it('should call onOpenChange with false when close button is clicked', () => {
    renderModal({ images: mockImages });
    const closeButton = screen.getByLabelText('common.close');
    fireEvent.click(closeButton);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  describe('Navigation', () => {
    it('should not show navigation arrows or counter if only one image', () => {
      renderModal({ images: [mockImages[0]] }); // Single image
      expect(screen.queryByLabelText('common.previous')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('common.next')).not.toBeInTheDocument();
      expect(screen.queryByText(`1 / 1`)).not.toBeInTheDocument();
    });

    it('should show navigation arrows and counter if multiple images', () => {
      renderModal({ images: mockImages });
      expect(screen.getByLabelText('common.previous')).toBeInTheDocument();
      expect(screen.getByLabelText('common.next')).toBeInTheDocument();
      expect(screen.getByText(`1 / ${mockImages.length}`)).toBeInTheDocument();
    });

    it('should navigate to the next image on "Next" button click', () => {
      renderModal({ images: mockImages, startIndex: 0 });
      fireEvent.click(screen.getByLabelText('common.next'));
      const imgElement = screen.getByAltText(mockImages[1].alt!) as HTMLImageElement;
      expect(imgElement.src).toBe(mockImages[1].url);
      expect(screen.getByText(`2 / ${mockImages.length}`)).toBeInTheDocument();
    });

    it('should navigate to the previous image on "Previous" button click', () => {
      renderModal({ images: mockImages, startIndex: 1 });
      fireEvent.click(screen.getByLabelText('common.previous'));
      const imgElement = screen.getByAltText(mockImages[0].alt!) as HTMLImageElement;
      expect(imgElement.src).toBe(mockImages[0].url);
      expect(screen.getByText(`1 / ${mockImages.length}`)).toBeInTheDocument();
    });

    it('should loop to the first image from the last on "Next" click', () => {
      renderModal({ images: mockImages, startIndex: mockImages.length - 1 });
      fireEvent.click(screen.getByLabelText('common.next'));
      const imgElement = screen.getByAltText(mockImages[0].alt!) as HTMLImageElement;
      expect(imgElement.src).toBe(mockImages[0].url);
    });

    it('should loop to the last image from the first on "Previous" click', () => {
      renderModal({ images: mockImages, startIndex: 0 });
      fireEvent.click(screen.getByLabelText('common.previous'));
      const imgElement = screen.getByAltText(mockImages[mockImages.length - 1].alt!) as HTMLImageElement;
      expect(imgElement.src).toBe(mockImages[mockImages.length - 1].url);
    });

    it('should navigate with ArrowRight and ArrowLeft keys', () => {
      renderModal({ images: mockImages, startIndex: 0 });
      
      act(() => {
        fireEvent.keyDown(window, { key: 'ArrowRight', code: 'ArrowRight' });
      });
      let imgElement = screen.getByAltText(mockImages[1].alt!) as HTMLImageElement;
      expect(imgElement.src).toBe(mockImages[1].url);

      act(() => {
        fireEvent.keyDown(window, { key: 'ArrowLeft', code: 'ArrowLeft' });
      });
      imgElement = screen.getByAltText(mockImages[0].alt!) as HTMLImageElement;
      expect(imgElement.src).toBe(mockImages[0].url);
    });

    // Test swipe interactions
    it('should call handleNext on swipe left if multiple images', () => {
      const handlers: any = {};
      mockUseSwipeable.mockImplementationOnce(options => {
        handlers.onSwipedLeft = options.onSwipedLeft;
        return { ref: vi.fn() };
      });
      renderModal({ images: mockImages, startIndex: 0 });
      act(() => {
        handlers.onSwipedLeft(); // Simulate swipe left
      });
      const imgElement = screen.getByAltText(mockImages[1].alt!) as HTMLImageElement;
      expect(imgElement.src).toBe(mockImages[1].url);
    });

    it('should call handlePrev on swipe right if multiple images', () => {
      const handlers: any = {};
      mockUseSwipeable.mockImplementationOnce(options => {
        handlers.onSwipedRight = options.onSwipedRight;
        return { ref: vi.fn() };
      });
      renderModal({ images: mockImages, startIndex: 1 });
      act(() => {
        handlers.onSwipedRight(); // Simulate swipe right
      });
      const imgElement = screen.getByAltText(mockImages[0].alt!) as HTMLImageElement;
      expect(imgElement.src).toBe(mockImages[0].url);
    });
  });
  
  it('useEffect hook for currentIndex should reset to valid startIndex', () => {
    const { rerender } = renderModal({ images: mockImages, startIndex: 1 });
    let imgElement = screen.getByAltText(mockImages[1].alt!) as HTMLImageElement;
    expect(imgElement.src).toBe(mockImages[1].url);

    // Rerender with a new valid startIndex
    rerender(<PhotoViewerModal images={mockImages} startIndex={2} isOpen={true} onOpenChange={mockOnOpenChange} />);
    imgElement = screen.getByAltText(mockImages[2].alt!) as HTMLImageElement; // Alt will be generated for photo3
    expect(imgElement.src).toBe(mockImages[2].url);

    // Rerender with an invalid startIndex (too high), should default to 0
    rerender(<PhotoViewerModal images={mockImages} startIndex={99} isOpen={true} onOpenChange={mockOnOpenChange} />);
    imgElement = screen.getByAltText(mockImages[0].alt!) as HTMLImageElement;
    expect(imgElement.src).toBe(mockImages[0].url);

    // Rerender with an invalid startIndex (negative), should default to 0
    rerender(<PhotoViewerModal images={mockImages} startIndex={-1} isOpen={true} onOpenChange={mockOnOpenChange} />);
    imgElement = screen.getByAltText(mockImages[0].alt!) as HTMLImageElement;
    expect(imgElement.src).toBe(mockImages[0].url);
  });

}); 