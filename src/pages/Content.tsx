import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  external_url?: string;
  created_at: string;
}

const Content = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [contentItem, setContentItem] = useState<ContentItem | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (!slug) return;

      setLoading(true);
      try {
        // First try to find content by slug in motivators table
        const { data: motivatorData, error: motivatorError } = await supabase
          .from('motivators')
          .select('*')
          .eq('slug', slug)
          .single();

        if (motivatorData && !motivatorError) {
          setContentItem({
            id: motivatorData.id,
            title: motivatorData.title,
            content: motivatorData.content,
            external_url: motivatorData.link_url,
            created_at: motivatorData.created_at
          });
          return;
        }

        // Then try system_motivators table
        const { data: systemData, error: systemError } = await supabase
          .from('system_motivators')
          .select('*')
          .eq('slug', slug)
          .single();

        if (systemData && !systemError) {
          setContentItem({
            id: systemData.id,
            title: systemData.title,
            content: systemData.content,
            external_url: systemData.link_url,
            created_at: systemData.created_at
          });
          return;
        }

        // If not found in either table, show error
        toast({
          variant: "destructive",
          title: "Content Not Found",
          description: "The requested content could not be found."
        });
        navigate('/motivators');
      } catch (error) {
        console.error('Error fetching content:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load content. Please try again."
        });
        navigate('/motivators');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [slug, navigate, toast]);

  const handleClose = () => {
    // Try multiple navigation strategies for reliability
    try {
      if (window.history.length > 1) {
        navigate(-1); // Go back to previous page
      } else {
        navigate('/motivators'); // Fallback to motivators page
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Final fallback
      navigate('/motivators');
    }
  };

  const handleOpenExternal = () => {
    if (contentItem?.external_url) {
      window.open(contentItem.external_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading content...</span>
        </div>
      </div>
    );
  }

  if (!contentItem) {
    return (
      <div className="min-h-screen bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Content not found</p>
          <Button onClick={handleClose} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Modal-like Container */}
      <div className="max-w-2xl mx-auto pt-20 px-4 pb-40">
        <div className="bg-background rounded-xl shadow-lg border overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b">
            <div className="flex items-start justify-between">
              <h1 className="text-lg font-semibold pr-8 line-clamp-2">
                {contentItem.title}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
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
        </div>
      </div>
    </div>
  );
};

export default Content;