import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentItem: ContentItem | null;
  loading?: boolean;
}

export const ContentModal = ({ isOpen, onClose, contentItem, loading }: ContentModalProps) => {
  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[80vh] p-0 overflow-hidden">
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
        <DialogContent className="max-w-lg max-h-[80vh] p-0 overflow-hidden">
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
      <DialogContent className="max-w-lg max-h-[80vh] p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 py-3 border-b">
          <div className="flex items-start justify-between">
            <DialogTitle className="text-lg font-semibold pr-4 line-clamp-2">
              {contentItem.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0 h-8 w-8 -mr-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {contentItem.content}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};