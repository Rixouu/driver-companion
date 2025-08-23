'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Link, Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface MagicLinkGeneratorProps {
  quotationId: string;
  customerEmail: string;
  customerName: string;
  quoteNumber: number;
  onSuccess?: () => void;
}

export function MagicLinkGenerator({
  quotationId,
  customerEmail,
  customerName,
  quoteNumber,
  onSuccess
}: MagicLinkGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState('168'); // Default 7 days
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const handleGenerateMagicLink = async () => {
    try {
      setIsGenerating(true);
      
      const response = await fetch('/api/quotations/generate-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quotation_id: quotationId,
          customer_email: customerEmail,
          expires_in_hours: parseInt(expiresInHours)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate magic link');
      }

      const data = await response.json();
      setGeneratedLink(data.magic_link);
      setExpiresAt(data.expires_at);
      
      toast({
        title: "Magic Link Generated!",
        description: `A secure link has been created for ${customerName}`,
        variant: 'default',
      });

      onSuccess?.();
      
    } catch (error) {
      console.error('Error generating magic link:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to generate magic link',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast({
        title: "Copied!",
        description: "Magic link copied to clipboard",
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: 'destructive',
      });
    }
  };

  const handleSendEmail = () => {
    if (!generatedLink) return;
    
    const subject = `Your Quote #${quoteNumber} - Secure Access Link`;
    const body = `Hi ${customerName},\n\nYou can view your quote using this secure link:\n\n${generatedLink}\n\nThis link will expire on ${expiresAt ? new Date(expiresAt).toLocaleDateString() : 'the specified date'}.\n\nBest regards,\nYour Team`;
    
    const mailtoLink = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Link className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-lg">Magic Link Generator</CardTitle>
            <p className="text-sm text-muted-foreground">
              Create a secure link for {customerName} to view this quote
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generatedLink ? (
          <>
            <div className="space-y-3">
              <div>
                <Label htmlFor="expires-in">Link Expires In:</Label>
                <Select value={expiresInHours} onValueChange={setExpiresInHours}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 hours (1 day)</SelectItem>
                    <SelectItem value="72">72 hours (3 days)</SelectItem>
                    <SelectItem value="168">168 hours (7 days)</SelectItem>
                    <SelectItem value="336">336 hours (14 days)</SelectItem>
                    <SelectItem value="720">720 hours (30 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Link will expire on{' '}
                  {new Date(Date.now() + (parseInt(expiresInHours) * 60 * 60 * 1000)).toLocaleDateString()}
                </span>
              </div>
            </div>

            <Button 
              onClick={handleGenerateMagicLink} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  Generate Magic Link
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Magic Link Generated Successfully!</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">
                Share this secure link with {customerName} to access the quote.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Generated Link:</Label>
              <div className="flex gap-2">
                <Input 
                  value={generatedLink} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button 
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Expires: {expiresAt ? new Date(expiresAt).toLocaleDateString() : 'Unknown'}
              </span>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSendEmail}
                className="flex-1"
                variant="outline"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send via Email
              </Button>
              <Button 
                onClick={() => setGeneratedLink(null)}
                variant="outline"
              >
                Generate New Link
              </Button>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">How it works:</p>
              <ul className="space-y-1">
                <li>• Customer clicks the magic link to view their quote</li>
                <li>• No account creation required</li>
                <li>• Link expires automatically after the set time</li>
                <li>• Secure access with unique token</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
