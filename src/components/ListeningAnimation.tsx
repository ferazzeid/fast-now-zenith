import React from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListeningAnimationProps {
  state: 'idle' | 'listening' | 'processing';
  size?: 'sm' | 'md' | 'lg';
}

export const ListeningAnimation = ({ state, size = 'md' }: ListeningAnimationProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  if (state === 'idle') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg p-8 flex flex-col items-center gap-4 max-w-sm mx-4">
        <div className={cn(
          'rounded-full bg-primary/10 flex items-center justify-center',
          sizeClasses[size],
          state === 'listening' && 'animate-pulse'
        )}>
          {state === 'processing' ? (
            <Loader2 className={cn(iconSizeClasses[size], 'animate-spin text-primary')} />
          ) : (
            <Mic className={cn(iconSizeClasses[size], 'text-primary')} />
          )}
        </div>
        
        <div className="text-center">
          <h3 className="font-medium text-foreground">
            {state === 'listening' ? 'Listening...' : 'Processing...'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {state === 'listening' 
              ? 'Say the foods you want to add' 
              : 'Analyzing your voice input'
            }
          </p>
        </div>

        {state === 'listening' && (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'w-1 bg-primary rounded-full animate-pulse',
                  'h-4'
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};