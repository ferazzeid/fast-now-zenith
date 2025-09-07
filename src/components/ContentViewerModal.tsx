import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, Loader2, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ContentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export const ContentViewerModal: React.FC<ContentViewerModalProps> = ({
  isOpen,
  onClose,
  url,
  title
}) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!isOpen || !url) return;

    const fetchContent = async () => {
      setLoading(true);
      
      try {
        // Try to fetch content using a simple CORS proxy
        const corsProxy = 'https://cors-anywhere.herokuapp.com/';
        const proxyUrl = corsProxy + url;
        
        const response = await fetch(proxyUrl, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch content');
        }
        
        const html = await response.text();
        
        // Extract text content from HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Remove unwanted elements
        doc.querySelectorAll('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar').forEach(el => el.remove());
        
        // Try to get main content areas
        let mainContent = doc.querySelector('main, article, .content, #content, .post, .entry, .article-body')?.textContent;
        
        if (!mainContent) {
          // Fallback to body content
          mainContent = doc.body?.textContent;
        }
        
        if (mainContent) {
          // Clean up the text
          const cleanContent = mainContent
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();
          
          // Limit content length for better UX
          const limitedContent = cleanContent.length > 2500 ? 
            cleanContent.substring(0, 2500) + '...\n\n[Content truncated. Click "Read Full Article" to see complete content.]' : 
            cleanContent;
          
          setContent(limitedContent);
        } else {
          throw new Error('Could not extract readable content');
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        // Show a friendly preview instead of failing completely
        setContent(`Preview unavailable for this article.\n\nThis content is available on the original website. Click "Read Full Article" below to view the complete content with images and formatting.`);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [isOpen, url]);

  const handleOpenExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="text-lg font-semibold pr-8 line-clamp-2">
            {title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading preview...</span>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 pr-4">
                <div className="text-sm leading-relaxed space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">Article Preview</span>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {content || 'Content preview is not available for this article. Please use the button below to read the full article on the original website.'}
                  </div>
                </div>
              </ScrollArea>
              
              <div className="flex-shrink-0 pt-4 border-t">
                <Button 
                  onClick={handleOpenExternal} 
                  variant="default" 
                  size="sm"
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Read Full Article on Original Site
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};