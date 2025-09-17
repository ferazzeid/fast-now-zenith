import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface AdminInsightDisplayProps {
  content: string;
  className?: string;
}

export const AdminInsightDisplay: React.FC<AdminInsightDisplayProps> = ({
  content,
  className
}) => {
  const [authorData, setAuthorData] = useState({
    image: '/src/assets/motivator-placeholder.jpg',
    name: 'Admin',
    title: 'Personal Insight'
  });

  // Load author settings
  useEffect(() => {
    const loadAuthorData = async () => {
      try {
        const { data: settings } = await supabase
          .from('shared_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['author_tooltip_image', 'author_tooltip_name', 'author_tooltip_title']);

        if (settings) {
          const settingsMap = settings.reduce((acc, setting) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
          }, {} as Record<string, string>);

          setAuthorData({
            image: settingsMap.author_tooltip_image || '/src/assets/motivator-placeholder.jpg',
            name: settingsMap.author_tooltip_name || 'Admin',
            title: settingsMap.author_tooltip_title || 'Personal Insight'
          });
        }
      } catch (error) {
        console.error('Failed to load author data:', error);
      }
    };

    loadAuthorData();
  }, []);

  if (!content?.trim()) {
    return null;
  }

  return (
    <div className={cn("mt-4 mb-4 flex items-start gap-4", className)}>
      {/* Speech Bubble */}
      <div
        className={cn(
          "relative flex-shrink-0 w-12 h-12",
          "border-2 border-primary bg-gradient-to-br from-primary/20 to-primary/10",
          "author-tooltip-bubble shadow-lg"
        )}
        style={{
          borderRadius: '50% 50% 50% 10%'
        }}
      >
        {/* Golden Glow Effect */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            background: 'radial-gradient(circle, #dac471 0%, rgba(218, 196, 113, 0.3) 50%, transparent 70%)',
            borderRadius: '50% 50% 50% 10%',
            filter: 'blur(4px)',
            transform: 'scale(1.1)'
          }}
        />
        
        {/* Author Image */}
        <img
          src={authorData.image}
          alt={authorData.name}
          className="w-full h-full object-cover"
          style={{
            borderRadius: '50% 50% 50% 10%'
          }}
        />
      </div>

      {/* Always-visible Content Box */}
      <div className="flex-1 min-w-0">
        <div className="relative bg-card border border-border rounded-lg p-4 shadow-sm">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-3">
            <img
              src={authorData.image}
              alt={authorData.name}
              className="w-6 h-6 rounded-full object-cover"
            />
            <div>
              <div className="font-semibold text-sm text-foreground">
                {authorData.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {authorData.title}
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="text-sm text-card-foreground leading-relaxed font-medium">
            {content}
          </div>

          {/* Speech bubble arrow pointing to the bubble */}
          <div className="absolute left-0 top-6 w-3 h-3 bg-card border-border rotate-45 -ml-1.5 border-l border-t" />
        </div>
      </div>
    </div>
  );
};