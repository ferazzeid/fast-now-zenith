import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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
  if (!isOpen || !content) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Full Screen Scrollable Container */}
      <div className="min-h-screen max-h-screen overflow-y-auto">
        <div className="max-w-2xl mx-auto pt-20 px-4 pb-20">
          <div className="bg-background rounded-xl shadow-lg border">
            
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b sticky top-0 bg-background rounded-t-xl z-10">
              <div className="flex items-start justify-between">
                <h1 className="text-lg font-semibold pr-8 line-clamp-2">
                  {content.title}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="flex-shrink-0 h-8 w-8 p-0 rounded-full hover:bg-muted/50 hover:scale-110 transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="text-sm leading-relaxed space-y-4">
                <div className="whitespace-pre-wrap text-base leading-7">
                  {content.content}
                </div>
              </div>
              
              {/* Removed the external link section */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};