import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Utensils, Calendar, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ConfirmationModal } from '@/components/ui/universal-modal';
import { useToast } from '@/hooks/use-toast';
import { useCopyHistoricalDay } from '@/hooks/useCopyHistoricalDay';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEOManager } from '@/components/SEOManager';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';

interface DailySummary {
  date: string;
  totalCalories: number;
  totalCarbs: number;
  entryCount: number;
  entries: Array<{
    id: string;
    name: string;
    calories: number;
    carbs: number;
    serving_size: number;
    created_at: string;
  }>;
}

const FoodHistory = () => {
  console.log('🍽️ FoodHistory page component rendering');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { copyDayToToday, loading: copyLoading } = useCopyHistoricalDay();
  const { data: dailySummaries, isLoading, execute: loadFoodHistory } = useStandardizedLoading<DailySummary[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [deletingDayDate, setDeletingDayDate] = useState<string | null>(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

  const ITEMS_PER_PAGE = 30; // Show more days before load more

  useEffect(() => {
    if (user) {
      loadFoodHistoryData();
    }
  }, [user]);

  const loadFoodHistoryData = async (offsetValue = 0, append = false) => {
    if (!user) return;

    await loadFoodHistory(async () => {
      // Calculate yesterday's end to exclude today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(today.getTime() - 1); // End of yesterday
      
      // Get only consumed food entries from previous days (exclude today)
      const { data: entries, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('consumed', true) // Only consumed items
        .lt('created_at', yesterdayEnd.toISOString()) // Exclude today
        .order('created_at', { ascending: false })
        .range(offsetValue * 50, (offsetValue + 1) * 50 - 1);

      if (error) throw error;

      // Group entries by date
      const grouped = new Map<string, DailySummary>();
      
      entries?.forEach(entry => {
        const date = new Date(entry.created_at).toDateString();
        
        if (!grouped.has(date)) {
          grouped.set(date, {
            date,
            totalCalories: 0,
            totalCarbs: 0,
            entryCount: 0,
            entries: []
          });
        }
        
        const summary = grouped.get(date)!;
        summary.totalCalories += entry.calories || 0;
        summary.totalCarbs += entry.carbs || 0;
        summary.entryCount += 1;
        summary.entries.push({
          id: entry.id,
          name: entry.name,
          calories: entry.calories || 0,
          carbs: entry.carbs || 0,
          serving_size: entry.serving_size || 100,
          created_at: entry.created_at
        });
      });

      // Convert to array and sort by date
      const summaries = Array.from(grouped.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, ITEMS_PER_PAGE);

      setHasMore(entries?.length === 50);
      return summaries;
    }, {
      onError: (error) => {
        console.error('Error loading food history:', error);
        toast({
          title: "Error",
          description: "Failed to load food history",
          variant: "destructive"
        });
      }
    });
  };

  const loadMore = () => {
    const newOffset = offset + 1;
    setOffset(newOffset);
    loadFoodHistoryData(newOffset, true);
  };

  const toggleDayExpansion = (date: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const deleteEntireDay = async (date: string) => {
    try {
      const summary = dailySummaries?.find(s => s.date === date);
      if (!summary) return;

      // Delete all entries for this day
      const entryIds = summary.entries.map(entry => entry.id);
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .in('id', entryIds);

      if (error) throw error;

      // Update local state
      if (dailySummaries) {
        await loadFoodHistory(async () => dailySummaries.filter(s => s.date !== date));
      }

      toast({
        title: "Day deleted",
        description: "All food entries for this day have been removed"
      });
    } catch (error) {
      console.error('Error deleting day:', error);
      toast({
        title: "Error",
        description: "Failed to delete food entries",
        variant: "destructive"
      });
    } finally {
      setDeletingDayDate(null);
    }
  };

  const deleteAllHistory = async () => {
    if (!user) return;
    
    try {
      // Delete all food entries for this user
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Clear local state
      if (dailySummaries) {
        await loadFoodHistory(async () => []);
      }

      toast({
        title: "History deleted",
        description: "All food history has been permanently removed"
      });
    } catch (error) {
      console.error('Error deleting all history:', error);
      toast({
        title: "Error",
        description: "Failed to delete food history",
        variant: "destructive"
      });
    } finally {
      setShowDeleteAllDialog(false);
    }
  };

  // Show loading skeleton
  if (isLoading && (!dailySummaries || dailySummaries.length === 0)) {
    return (
      <div className="relative min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto pt-16 pb-32">
          {/* Top right X button to close */}
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/food-tracking')}
              className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-left">Food History</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteAllDialog(true)}
              className="text-destructive hover:bg-destructive/10 w-8 h-8 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Loading skeletons */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 bg-muted animate-pulse rounded w-24" />
                  <div className="h-4 bg-muted animate-pulse rounded w-6" />
                </div>
                <div className="flex gap-3">
                  <div className="h-3 bg-muted animate-pulse rounded w-16" />
                  <div className="h-3 bg-muted animate-pulse rounded w-20" />
                  <div className="h-3 bg-muted animate-pulse rounded w-12" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  console.log('🍽️ FoodHistory: Rendering MAIN content', { isLoading, dailySummariesLength: dailySummaries?.length });
  console.log('🍽️ FoodHistory: Rendering main container');
  
  return (
    <div className="relative min-h-screen bg-background p-4 overflow-x-hidden">
      <SEOManager />
      
      <div className="max-w-md mx-auto pt-16 pb-32">
        {/* Top right X button to close */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/food-tracking')}
            className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Header with left-aligned title and right-aligned delete button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-left">Food History</h1>
          {dailySummaries && dailySummaries.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteAllDialog(true)}
              className="text-destructive hover:bg-destructive/10 w-8 h-8 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {!dailySummaries || dailySummaries.length === 0 ? (
          <div className="text-center py-12">
            <Utensils className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Food Entries Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking your food to build your history
            </p>
            <Button onClick={() => navigate('/food-tracking')}>
              Track Food
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {dailySummaries?.map((summary) => (
              <Card key={summary.date} className="overflow-hidden">
                <CardHeader 
                  className="py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => toggleDayExpansion(summary.date)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm">
                        {new Date(summary.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground">
                        {summary.totalCalories} cal • {summary.entryCount} items
                      </div>
                      {expandedDays.has(summary.date) ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {expandedDays.has(summary.date) && (
                  <CardContent className="pt-0">
                    <div className="space-y-2 mb-4">
                      {summary.entries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                          <div className="flex-1">
                            <div className="font-medium">{entry.name}</div>
                            <div className="text-muted-foreground">
                              {entry.calories} cal • {entry.carbs}g carbs • {entry.serving_size}g
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const result = await copyDayToToday(summary.date);
                          if (result?.success) {
                            toast({
                              title: "Day copied",
                              description: `${result.count} food items copied to today's plan`
                            });
                          }
                        }}
                        disabled={copyLoading}
                        className="h-7 px-2 text-xs"
                      >
                        Copy to Today
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingDayDate(summary.date);
                        }}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        title="Delete entire day"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}

            {/* Load More */}
            {hasMore && (
              <Button
                variant="outline"
                className="w-full"
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </Button>
            )}
          </div>
        )}

        {/* Delete Day Confirmation Dialog */}
        <ConfirmationModal
          isOpen={!!deletingDayDate}
          onClose={() => setDeletingDayDate(null)}
          onConfirm={() => deletingDayDate && deleteEntireDay(deletingDayDate)}
          title="Delete Entire Day"
          message={`Are you sure you want to delete all food entries for ${deletingDayDate ? new Date(deletingDayDate).toLocaleDateString() : ''}? This action cannot be undone.`}
          confirmText="Delete Day"
          variant="destructive"
        />

        {/* Delete All History Confirmation Dialog */}
        <ConfirmationModal
          isOpen={showDeleteAllDialog}
          onClose={() => setShowDeleteAllDialog(false)}
          onConfirm={deleteAllHistory}
          title="Delete All Food History"
          message="Are you sure you want to delete ALL food history? This will permanently remove all food entries from all days. This action cannot be undone."
          confirmText="Delete All History"
          variant="destructive"
        />
      </div>
    </div>
  );
};

export default FoodHistory;