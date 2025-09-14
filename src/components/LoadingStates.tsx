import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Enhanced loading spinner for individual components
export const ComponentSpinner = ({ 
  size = 16, 
  className = "" 
}: { 
  size?: number; 
  className?: string;
}) => (
  <Loader2 className={`animate-spin ${className}`} size={size} />
);

// Loading skeleton for food entries
export const FoodEntrySkeleton = () => (
  <Card className="p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-3 w-[150px]" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  </Card>
);

// Loading skeleton for motivator cards
export const MotivatorSkeleton = () => (
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
);

// Loading skeleton for walking stats
export const WalkingStatsSkeleton = () => (
  <div className="grid grid-cols-2 gap-3">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="w-3 h-3 rounded-full" />
        </div>
        <Skeleton className="h-6 w-16 mb-1" />
        <Skeleton className="h-3 w-20" />
      </Card>
    ))}
  </div>
);

// Loading state for lists with placeholders
export const ListLoadingSkeleton = ({ 
  count = 3, 
  itemHeight = "h-16" 
}: { 
  count?: number; 
  itemHeight?: string;
}) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <Skeleton key={i} className={`w-full ${itemHeight}`} />
    ))}
  </div>
);

// Inline loading with text
export const InlineLoading = ({ 
  text = "",
  size = 16 
}: {
  text?: string;
  size?: number;
}) => (
  <div className="flex items-center space-x-2">
    <ComponentSpinner size={size} className="text-muted-foreground" />
    {text && <span className="text-sm text-muted-foreground">{text}</span>}
  </div>
);

// Button loading state
export const ButtonLoading = ({ 
  text = "",
  size = 16 
}: {
  text?: string;
  size?: number;
}) => (
  <>
    <ComponentSpinner size={size} className="mr-2" />
    {text}
  </>
);