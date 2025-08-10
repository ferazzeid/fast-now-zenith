import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

// Simple loading screen without aggressive timeouts
export const EnhancedLoadingScreen = ({ 
  message = "Loading...",
  showSkeleton = true 
}: {
  message?: string;
  showSkeleton?: boolean;
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto animate-spin"></div>
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
        
        {showSkeleton && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

// Smart loading button that shows different states
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
      className={cn("gap-2", className)}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isLoading ? (loadingText || "Please wait...") : children}
    </Button>
  );
};

// Enhanced upload component with smart states
export const SmartUploadButton = ({ 
  isUploading, 
  onSelect, 
  accept = "image/*",
  variant = "outline",
  size = "default",
  className 
}: {
  isUploading: boolean;
  onSelect: (file: File) => void;
  accept?: string;
  variant?: "outline" | "default" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}) => {
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSelect(file);
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        id="smart-upload"
        disabled={isUploading}
      />
      <label htmlFor="smart-upload">
        <Button 
          type="button" 
          variant={variant} 
          size={size}
          disabled={isUploading}
          className="gap-2 cursor-pointer"
          asChild
        >
          <span>
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Choose Image
              </>
            )}
          </span>
        </Button>
      </label>
    </div>
  );
};

// Loading card with skeleton content
export const LoadingCard = ({ 
  showHeader = true, 
  lines = 3,
  className 
}: {
  showHeader?: boolean;
  lines?: number;
  className?: string;
}) => {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </CardContent>
    </Card>
  );
};

// Inline loading with smooth animation
export const SmartInlineLoading = ({ 
  text = "Loading",
  size = 16,
  className 
}: {
  text?: string;
  size?: number;
  className?: string;
}) => (
  <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
    <Loader2 className="animate-spin" style={{ width: size, height: size }} />
    <span className="text-sm">{text}...</span>
  </div>
);

// List loading skeleton
export const LoadingList = ({ 
  items = 5,
  showAvatar = false,
  className 
}: {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};