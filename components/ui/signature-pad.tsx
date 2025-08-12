"use client";

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw, Download, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignaturePadProps {
  onSignatureChange?: (signature: string | null) => void;
  className?: string;
  title?: string;
  required?: boolean;
  disabled?: boolean;
  customerName?: string;
  showHeader?: boolean;
  showActions?: boolean;
  canvasHeight?: number;
  canvasWidth?: number;
}

function SignaturePadInner({ 
  onSignatureChange, 
  className, 
  title = "Signature", 
  required = false,
  disabled = false,
  customerName,
  showHeader = true,
  showActions = true,
  canvasHeight = 200,
  canvasWidth = 400
}: SignaturePadProps, ref: React.Ref<SignaturePadHandle>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [showPresets, setShowPresets] = useState(false);
  useImperativeHandle(ref, () => ({
    clear: () => clearSignature(),
    togglePresets: () => setShowPresets((v) => !v),
    get hasSignature() {
      return hasSignature;
    }
  }), [hasSignature]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setIsDrawing(true);
    setLastX(x);
    setLastY(y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    setLastX(x);
    setLastY(y);
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Notify parent component of signature change
    if (hasSignature && onSignatureChange) {
      const canvas = canvasRef.current;
      if (canvas) {
        const dataURL = canvas.toDataURL('image/png');
        onSignatureChange(dataURL);
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    
    if (onSignatureChange) {
      onSignatureChange(null);
    }
  };

  const downloadSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const link = document.createElement('a');
    link.download = 'signature.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  // Generate preset signatures based on customer name
  const generatePresetSignature = (style: 'cursive' | 'elegant' | 'simple') => {
    if (!customerName || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set up text styling based on style
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    switch (style) {
      case 'cursive':
        ctx.font = '32px "Dancing Script", cursive';
        ctx.fillText(customerName, centerX, centerY);
        break;
      case 'elegant':
        ctx.font = '28px "Great Vibes", cursive';
        ctx.fillText(customerName, centerX, centerY);
        break;
      case 'simple':
        ctx.font = '24px "Brush Script MT", cursive';
        ctx.fillText(customerName, centerX, centerY);
        break;
    }
    
    setHasSignature(true);
    
    // Notify parent component
    if (onSignatureChange) {
      const dataURL = canvas.toDataURL('image/png');
      onSignatureChange(dataURL);
    }
  };

  const presetStyles = [
    { key: 'cursive', label: 'Cursive', preview: customerName || 'Sample' },
    { key: 'elegant', label: 'Elegant', preview: customerName || 'Sample' },
    { key: 'simple', label: 'Simple', preview: customerName || 'Sample' }
  ];

  return (
    <Card className={cn("w-full", className)}>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Check className="h-4 w-4" />
            {title}
            {required && <span className="text-red-500 ml-1">*</span>}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4 pt-6">
        <div className="relative rounded-md overflow-hidden bg-white" style={{ height: canvasHeight, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}>
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className={cn(
              "w-full cursor-crosshair",
              disabled && "cursor-not-allowed opacity-50"
            )}
            style={{ width: "100%", height: canvasHeight }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-muted-foreground text-sm">Draw your signature here</p>
            </div>
          )}
        </div>
        {showActions && (
          <>
            {/* Action Buttons - Reorganized */}
            <div className="flex justify-between items-center gap-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                  disabled={!hasSignature || disabled}
                  className="gap-1 text-xs px-3"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadSignature}
                  disabled={!hasSignature || disabled}
                  className="gap-1 text-xs px-3"
                >
                  <Download className="h-3 w-3" />
                  Save
                </Button>
              </div>
              
              {customerName && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPresets(!showPresets)}
                  disabled={disabled}
                  className="text-xs gap-1"
                >
                  {showPresets ? 'Hide' : 'Show'} Presets
                </Button>
              )}
            </div>
            
          </>
        )}

        {/* Preset Signatures - Collapsible (also available when actions are hidden) */}
        {customerName && showPresets && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {presetStyles.map((style) => (
                <Button
                  key={style.key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generatePresetSignature(style.key as 'cursive' | 'elegant' | 'simple')}
                  disabled={disabled}
                  className="h-auto p-2 text-xs flex flex-col gap-1"
                >
                  <span className="font-medium">{style.label}</span>
                  <span 
                    className="text-xs text-muted-foreground truncate max-w-full"
                    style={{
                      fontFamily: style.key === 'cursive' ? 'cursive' : 
                                 style.key === 'elegant' ? 'serif' : 'sans-serif',
                      fontStyle: 'italic'
                    }}
                  >
                    {style.preview}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export interface SignaturePadHandle {
  clear: () => void;
  togglePresets: () => void;
  hasSignature: boolean;
}
const SignaturePad = forwardRef(SignaturePadInner);
export { SignaturePad };
