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
    <div className={cn("absolute inset-0 z-30 rounded-lg overflow-hidden", className)}>
      {/* Full overlay background */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" />
      
      {/* Content centered in the overlay */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center p-6">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-3">
          <img
            src={authorData.image}
            alt={authorData.name}
            className="w-4 h-4 rounded-full object-cover"
          />
          <div className="text-center">
            <div className="font-semibold text-[10px] text-foreground">
              {authorData.name}
            </div>
            <div className="text-[8px] text-muted-foreground">
              {authorData.title}
            </div>
          </div>
        </div>
        
        {/* Content - Much smaller font size */}
        <div className="text-[11px] text-foreground leading-relaxed font-medium text-center max-w-[90%]">
          {content}
        </div>
      </div>
    </div>
  );
};