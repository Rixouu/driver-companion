"use client";

import React, { useRef, useEffect, useState } from 'react';
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
}

export function SignaturePad({ 
  onSignatureChange, 
  className, 
  title = "Signature", 
  required = false,
  disabled = false,
  customerName 
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [showPresets, setShowPresets] = useState(false);

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

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasEvent>) => {
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
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Check className="h-4 w-4" />
          {title}
          {required && <span className="text-red-500 ml-1">*</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/10">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className={cn(
              "w-full h-48 cursor-crosshair rounded-lg",
              disabled && "cursor-not-allowed opacity-50"
            )}
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
        
        {/* Preset Signatures */}
        {customerName && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Preset Signatures</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPresets(!showPresets)}
                disabled={disabled}
                className="text-xs"
              >
                {showPresets ? 'Hide' : 'Show'} Presets
              </Button>
            </div>
            
            {showPresets && (
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
            )}
          </div>
        )}
        
        <div className="flex gap-2 justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={!hasSignature || disabled}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadSignature}
            disabled={!hasSignature || disabled}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
