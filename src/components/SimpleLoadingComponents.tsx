import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Simple loading button replacement for SmartLoadingButton
export const SmartLoadingButton = ({ 
  isLoading, 
  children, 
  loadingText,
  className,
  ...props 
}: {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  [key: string]: any;
}) => {
  return (
    <Button 
      disabled={isLoading}
      className={className}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {isLoading ? (loadingText || "") : children}
    </Button>
  );
};

// Simple inline loading replacement for SmartInlineLoading
export const SmartInlineLoading = ({ 
  text = "",
  size = 16,
  className 
}: {
  text?: string;
  size?: number;
  className?: string;
}) => (
  <div className={`flex items-center gap-2 text-muted-foreground ${className || ''}`}>
    <Loader2 className="animate-spin" style={{ width: size, height: size }} />
    <span className="text-sm">{text}...</span>
  </div>
);