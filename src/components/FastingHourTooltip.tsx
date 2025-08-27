import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAccess } from '@/hooks/useAccess';
import { supabase } from '@/integrations/supabase/client';

interface FastingHourTooltipProps {
  hour: number;
  existingLog?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FastingHourTooltip: React.FC<FastingHourTooltipProps> = ({
  hour,
  existingLog = '',
  size = 'sm',
  className
}) => {
  const { isAdmin } = useAccess();
  const [authorData, setAuthorData] = useState({
    image: '/src/assets/motivator-placeholder.jpg',
    name: 'Admin',
    title: 'Personal Experience'
  });

  // Don't render if not admin or no content
  if (!isAdmin || !existingLog?.trim()) {
    return null;
  }

  useEffect(() => {
    const loadAuthorSettings = async () => {
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
            title: settingsMap.author_tooltip_title || 'Personal Experience'
          });
        }
      } catch (error) {
        console.error('Failed to load author settings:', error);
      }
    };

    loadAuthorSettings();
  }, []);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  };

  return (
    <div className={cn("flex items-start gap-3 max-w-sm", className)}>
      {/* Speech Bubble */}
      <div
        className={cn(
          "flex-shrink-0 rounded-full bg-gradient-to-br from-[#dac471] to-[#dac471]/80 flex items-center justify-center border-2 border-[#dac471]/50 shadow-sm",
          sizeClasses[size]
        )}
        style={{
          borderRadius: '50% 50% 50% 10%'
        }}
      >
        <img
          src={authorData.image}
          alt={authorData.name}
          className="w-full h-full object-cover"
          style={{
            borderRadius: '50% 50% 50% 10%'
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/src/assets/motivator-placeholder.jpg';
          }}
        />
      </div>

      {/* Always-Visible Content Card */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-3 min-w-0 flex-1">
        {/* Author Info */}
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-foreground text-xs truncate">
              {authorData.name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              Hour {hour} • {authorData.title}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-xs text-foreground leading-relaxed">
          {existingLog}
        </div>
      </div>
    </div>
  );
};