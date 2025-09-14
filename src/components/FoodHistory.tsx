import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCopyHistoricalDay } from '@/hooks/useCopyHistoricalDay';
import { supabase } from '@/integrations/supabase/client';
import { SmartLoadingButton } from "./SimpleLoadingComponents";
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { ListLoadingSkeleton } from '@/components/LoadingStates';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

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

interface FoodHistoryProps {
  onClose: () => void;
  onCopySuccess?: () => void;
}

export const FoodHistory = ({ onClose, onCopySuccess }: FoodHistoryProps) => {
  const { data: dailySummaries, isLoading, execute, setData } = useStandardizedLoading<DailySummary[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showDeleteDayModal, setShowDeleteDayModal] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { copyDayToToday, loading: copyLoading } = useCopyHistoricalDay();

  const ITEMS_PER_PAGE = 7; // Show 7 days at a time

  useEffect(() => {
    loadFoodHistory();
  }, [user]);

  const loadFoodHistory = async (offsetValue = 0, append = false) => {
    if (!user) return;

    await execute(async () => {
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

      if (append) {
        const currentData = dailySummaries || [];
        const newData = [...currentData, ...summaries];
        setData(newData);
        return newData;
      } else {
        setHasMore(entries?.length === 50);
        return summaries;
      }
    });
  };

  const loadMore = () => {
    const newOffset = offset + 1;
    setOffset(newOffset);
    loadFoodHistory(newOffset, true);
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
      const summary = dailySummaries.find(s => s.date === date);
      if (!summary) return;

      // Delete all entries for this day
      const entryIds = summary.entries.map(entry => entry.id);
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .in('id', entryIds);

      if (error) throw error;

      // Update local state
      const updatedSummaries = dailySummaries?.filter(s => s.date !== date) || [];
      setData(updatedSummaries);

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
      setData([]);

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
    }
  };

  useEffect(() => {
    loadFoodHistory();
  }, [user]);

  if (isLoading && (!dailySummaries || dailySummaries.length === 0)) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <Card className="w-full max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Food History</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200">
                <X className="w-8 h-8" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ListLoadingSkeleton count={3} itemHeight="h-16" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-md mx-auto max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b border-border py-4 px-0 flex-shrink-0">
          <div className="flex justify-between items-center px-6">
            <CardTitle className="text-lg font-semibold text-left">Food History</CardTitle>
            <div className="flex gap-2">
              {/* Delete All History Button - only show if there are entries */}
              {dailySummaries && dailySummaries.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteAllModal(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200">
                <X className="w-8 h-8" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4 pt-6">
        {(!dailySummaries || dailySummaries.length === 0) ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">No food entries found</div>
          </div>
        ) : (
          <>
            {dailySummaries?.map((summary) => (
              <Card key={summary.date} className="relative">
                <CardHeader 
                  className="py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => toggleDayExpansion(summary.date)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">
                      {new Date(summary.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </h3>
                    
                    <div className="flex items-center gap-2">
                      <ChevronDown 
                        className={`w-5 h-5 text-muted-foreground transition-transform ${
                          expandedDays.has(summary.date) ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                {expandedDays.has(summary.date) && (
                  <CardContent className="pt-0">
                    <div className="space-y-1">
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
                    
                    {/* Action buttons - only visible when expanded */}
                    <div className="mt-3 pt-2 border-t border-border flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const result = await copyDayToToday(summary.date);
                          if (result?.success && onCopySuccess) {
                            // Trigger immediate refresh in parent component
                            console.log('Triggering onCopySuccess callback to refresh food entries');
                            await onCopySuccess();
                            onClose(); // Close the history modal after successful copy
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
                          setShowDeleteDayModal(summary.date);
                        }}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                )}

              </Card>
            ))}
            
            {hasMore && (
              <div className="text-center pt-4">
                <SmartLoadingButton 
                  variant="outline" 
                  onClick={loadMore} 
                  isLoading={isLoading}
                  loadingText="Loading more"
                >
                  Load More
                </SmartLoadingButton>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>

    <ConfirmationModal
      isOpen={showDeleteAllModal}
      onClose={() => setShowDeleteAllModal(false)}
      onConfirm={() => {
        deleteAllHistory();
        setShowDeleteAllModal(false);
      }}
      title="Delete All Food History"
      description="Are you sure you want to delete ALL food history? This will permanently remove all food entries from all days. This action cannot be undone."
      confirmText="Delete All History"
      variant="destructive"
    />

    <ConfirmationModal
      isOpen={!!showDeleteDayModal}
      onClose={() => setShowDeleteDayModal(null)}
      onConfirm={() => {
        if (showDeleteDayModal) {
          deleteEntireDay(showDeleteDayModal);
          setShowDeleteDayModal(null);
        }
      }}
      title="Delete Entire Day"
      description={`Are you sure you want to delete all food entries for ${showDeleteDayModal ? new Date(showDeleteDayModal).toLocaleDateString() : ''}? This action cannot be undone.`}
      confirmText="Delete Day"
      variant="destructive"
    />
    </div>
  );
};