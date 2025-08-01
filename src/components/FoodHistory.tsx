import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCopyHistoricalDay } from '@/hooks/useCopyHistoricalDay';
import { supabase } from '@/integrations/supabase/client';
import { SmartLoadingButton } from "./enhanced/SmartLoadingStates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
}

export const FoodHistory = ({ onClose }: FoodHistoryProps) => {
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { copyDayToToday, loading: copyLoading } = useCopyHistoricalDay();

  const ITEMS_PER_PAGE = 7; // Show 7 days at a time

  const loadFoodHistory = async (offsetValue = 0, append = false) => {
    if (!user) return;

    setLoading(true);
    try {
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
        setDailySummaries(prev => [...prev, ...summaries]);
      } else {
        setDailySummaries(summaries);
      }

      setHasMore(entries?.length === 50);
    } catch (error) {
      console.error('Error loading food history:', error);
      toast({
        title: "Error",
        description: "Failed to load food history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
      setDailySummaries(prev => prev.filter(s => s.date !== date));

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

  useEffect(() => {
    loadFoodHistory();
  }, [user]);

  if (loading && dailySummaries.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <Card className="w-full max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Food History</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted animate-pulse rounded w-24" />
                        <div className="flex gap-3">
                          <div className="h-3 bg-muted animate-pulse rounded w-16" />
                          <div className="h-3 bg-muted animate-pulse rounded w-20" />
                          <div className="h-3 bg-muted animate-pulse rounded w-12" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-6 h-6 bg-muted animate-pulse rounded" />
                        <div className="w-6 h-6 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <CardTitle className="text-lg font-semibold">Food History</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      <CardContent className="space-y-4">
        {dailySummaries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">No food entries found</div>
          </div>
        ) : (
          <>
            {dailySummaries.map((summary) => (
              <Card key={summary.date}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">
                          {new Date(summary.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </h3>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyDayToToday(summary.date)}
                            disabled={copyLoading}
                            className="h-6 px-2 text-xs"
                          >
                            Copy to Today
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleDayExpansion(summary.date)}
                            className="h-6 w-6 p-0"
                          >
                            <span className="text-xs">⇅</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Entire Day</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete all food entries for {new Date(summary.date).toLocaleDateString()}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteEntireDay(summary.date)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Day
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span>{summary.totalCalories} cal</span>
                        <span>{summary.totalCarbs}g carbs</span>
                        <span>{summary.entryCount} items</span>
                      </div>
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
                  </CardContent>
                )}
              </Card>
            ))}
            
            {hasMore && (
              <div className="text-center pt-4">
                <SmartLoadingButton 
                  variant="outline" 
                  onClick={loadMore} 
                  isLoading={loading}
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
    </div>
  );
};