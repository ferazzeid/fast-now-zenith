import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { LoadingRecovery } from '@/components/LoadingRecovery';
import { useLoadingManager } from '@/hooks/useLoadingManager';
import { useEffect, useState } from 'react';

interface SmartSkeletonProps {
  loadingKey: string;
  onRetry?: () => void;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SmartSkeleton = ({ 
  loadingKey, 
  onRetry, 
  fallback, 
  children, 
  className = "" 
}: SmartSkeletonProps) => {
  const { loading } = useLoadingManager(loadingKey);
  const [showRecovery, setShowRecovery] = useState(false);
  
  useEffect(() => {
    if (loading) {
      // Show recovery option after 8 seconds
      const timer = setTimeout(() => {
        setShowRecovery(true);
      }, 8000);
      
      return () => clearTimeout(timer);
    } else {
      setShowRecovery(false);
    }
  }, [loading]);
  
  if (!loading) {
    return <>{children}</>;
  }
  
  if (showRecovery && onRetry) {
    return (
      <div className={className}>
        <LoadingRecovery 
          onRetry={onRetry}
          message="This is taking longer than usual..."
        />
      </div>
    );
  }
  
  return fallback || <DefaultSkeleton className={className} />;
};

const DefaultSkeleton = ({ className }: { className?: string }) => (
  <Card className={`p-4 ${className}`}>
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-full" />
    </div>
  </Card>
);

// Enhanced versions of existing skeletons with recovery
export const FoodEntrySkeleton = ({ onRetry }: { onRetry?: () => void }) => (
  <SmartSkeleton 
    loadingKey="food-entries" 
    onRetry={onRetry}
    fallback={
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </Card>
    }
  >
    {/* Children content goes here when not loading */}
    <div />
  </SmartSkeleton>
);

export const MotivatorSkeleton = ({ onRetry }: { onRetry?: () => void }) => (
  <SmartSkeleton 
    loadingKey="motivators" 
    onRetry={onRetry}
    fallback={
      <Card className="overflow-hidden">
        <div className="flex">
          <Skeleton className="w-24 h-24 flex-shrink-0" />
          <div className="flex-1 p-4 space-y-2">
            <Skeleton className="h-4 w-[180px]" />
            <Skeleton className="h-3 w-[120px]" />
            <Skeleton className="h-3 w-[160px]" />
          </div>
        </div>
      </Card>
    }
  >
    <div />
  </SmartSkeleton>
);

export const GoalSkeleton = ({ onRetry }: { onRetry?: () => void }) => (
  <SmartSkeleton 
    loadingKey="goals" 
    onRetry={onRetry}
    fallback={
      <Card className="p-6 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </Card>
    }
  >
    <div />
  </SmartSkeleton>
);