import { useState, useEffect } from 'react';
import { Calendar, Trash2, MoreHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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

  const ITEMS_PER_PAGE = 7; // Show 7 days at a time

  const loadFoodHistory = async (offsetValue = 0, append = false) => {
    if (!user) return;

    setLoading(true);
    try {
      // Get food entries with pagination
      const { data: entries, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offsetValue * 50, (offsetValue + 1) * 50 - 1); // Batch load 50 entries per page

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

  const deleteFoodEntry = async (entryId: string, date: string) => {
    try {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      // Update local state
      setDailySummaries(prev => prev.map(summary => {
        if (summary.date === date) {
          const updatedEntries = summary.entries.filter(entry => entry.id !== entryId);
          const deletedEntry = summary.entries.find(entry => entry.id === entryId);
          
          if (updatedEntries.length === 0) {
            return null; // Mark for removal
          }
          
          return {
            ...summary,
            entries: updatedEntries,
            totalCalories: summary.totalCalories - (deletedEntry?.calories || 0),
            totalCarbs: summary.totalCarbs - (deletedEntry?.carbs || 0),
            entryCount: summary.entryCount - 1
          };
        }
        return summary;
      }).filter(Boolean) as DailySummary[]);

      toast({
        title: "Entry deleted",
        description: "Food entry has been removed from your history"
      });
    } catch (error) {
      console.error('Error deleting food entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete food entry",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadFoodHistory();
  }, [user]);

  if (loading && dailySummaries.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Food History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading food history...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Food History
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
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
              <Card key={summary.date} className="border-l-4 border-l-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold">
                          {new Date(summary.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h3>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{summary.totalCalories} calories</span>
                          <span>{summary.totalCarbs}g carbs</span>
                          <span>{summary.entryCount} entries</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDayExpansion(summary.date)}
                    >
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform ${
                          expandedDays.has(summary.date) ? 'rotate-180' : ''
                        }`} 
                      />
                    </Button>
                  </div>
                </CardHeader>
                
                {expandedDays.has(summary.date) && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {summary.entries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{entry.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.calories} cal • {entry.carbs}g carbs • {entry.serving_size}g
                              <span className="ml-2">
                                {new Date(entry.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Food Entry</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{entry.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteFoodEntry(entry.id, summary.date)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
            
            {hasMore && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={loadMore} 
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};