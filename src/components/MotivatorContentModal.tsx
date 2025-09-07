import React from 'react';
import { Button } from '@/components/ui/button';
import { X, FileText, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  external_url?: string;
}

interface MotivatorContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ContentItem | null;
}

export const MotivatorContentModal = ({ isOpen, onClose, content }: MotivatorContentModalProps) => {
  const handleOpenExternal = () => {
    if (content?.external_url) {
      window.open(content.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen || !content) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Modal-like Container */}
      <div className="max-w-2xl mx-auto pt-20 px-4 pb-40">
        <div className="bg-background rounded-xl shadow-lg border overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b">
            <div className="flex items-start justify-between">
              <h1 className="text-lg font-semibold pr-8 line-clamp-2">
                {content.title}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="flex-shrink-0 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="text-sm leading-relaxed space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">Article Content</span>
                </div>
                <div className="whitespace-pre-wrap text-base leading-7">
                  {content.content}
                </div>
              </div>
            </ScrollArea>
            
            {/* Optional External Link */}
            {content.external_url && (
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
        </div>
      </div>
    </div>
  );
};