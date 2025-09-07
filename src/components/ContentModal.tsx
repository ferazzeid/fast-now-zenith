import React from 'react';
import { Button } from '@/components/ui/button';
import { X, FileText, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  external_url?: string;
  created_at: string;
}

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentItem: ContentItem | null;
  loading?: boolean;
}

export const ContentModal = ({ isOpen, onClose, contentItem, loading }: ContentModalProps) => {
  const handleOpenExternal = () => {
    if (contentItem?.external_url) {
      window.open(contentItem.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0 overflow-hidden">
          <div className="flex items-center justify-center p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-5 h-5 animate-spin border-2 border-current border-t-transparent rounded-full" />
              <span>Loading content...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!contentItem) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0 overflow-hidden">
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Content not found</p>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-lg font-semibold pr-8 line-clamp-2">
              {contentItem.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="text-sm leading-relaxed space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <FileText className="w-4 h-4" />
                <span className="text-xs">Article Content</span>
              </div>
              <div className="whitespace-pre-wrap text-base leading-7">
                {contentItem.content}
              </div>
            </div>
          </ScrollArea>
          
          {/* Optional External Link */}
          {contentItem.external_url && (
            <div className="flex-shrink-0 px-6 py-4 border-t bg-muted/5">
              <p className="text-xs text-muted-foreground mb-3">Want to read more?</p>
              <Button 
                onClick={handleOpenExternal} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                Visit Original Source
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};