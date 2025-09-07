import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Utensils, Calendar, Trash2, Copy, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EditFoodEntryModal } from '@/components/EditFoodEntryModal';
import { CopyYesterdayButton } from '@/components/CopyYesterdayButton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEOManager } from '@/components/SEOManager';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  serving_size: number;
  consumed: boolean;
  created_at: string;
  image_url?: string;
}

const FoodHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFoodHistory();
    }
  }, [user, showAll]);

  const fetchFoodHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const limit = showAll ? 100 : 20;
      
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setEntries(data || []);
      
      if (!showAll && data && data.length >= 20) {
        const { count } = await supabase
          .from('food_entries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        setHasMore((count || 0) > 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching food history:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load food history"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      setEntries(entries.filter(entry => entry.id !== entryId));
      toast({
        title: "Food Entry Deleted",
        description: "Food entry has been removed from your history"
      });
    } catch (error) {
      console.error('Error deleting food entry:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete food entry"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyEntry = async (entry: FoodEntry) => {
    try {
      const { error } = await supabase
        .from('food_entries')
        .insert([{
          user_id: user?.id,
          name: entry.name,
          calories: entry.calories,
          carbs: entry.carbs,
          serving_size: entry.serving_size,
          consumed: false,
          image_url: entry.image_url
        }]);

      if (error) throw error;

      toast({
        title: "Food Copied",
        description: `${entry.name} has been added to today's plan`
      });
    } catch (error) {
      console.error('Error copying food entry:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy food entry"
      });
    }
  };

  const groupEntriesByDate = (entries: FoodEntry[]) => {
    const groups: { [key: string]: FoodEntry[] } = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background p-4 overflow-x-hidden">
        <div className="max-w-md mx-auto pt-16 pb-32">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/food-tracking')}
              className="w-8 h-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold">Food History</h1>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const groupedEntries = groupEntriesByDate(entries);

  return (
    <div className="relative min-h-screen bg-background p-4 overflow-x-hidden">
      <SEOManager />
      
      <div className="max-w-md mx-auto pt-16 pb-32">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/food-tracking')}
            className="w-8 h-8"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Food History</h1>
          </div>
        </div>

        {/* Copy Yesterday Button */}
        <div className="mb-6">
          <CopyYesterdayButton />
        </div>

        {entries.length === 0 ? (
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
          <div className="space-y-6">
            {Object.entries(groupedEntries).map(([date, dayEntries]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">{date}</h2>
                  <div className="flex-1 border-t border-border" />
                </div>
                
                <div className="space-y-2 ml-6">
                  {dayEntries.map((entry) => (
                    <Card key={entry.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-sm truncate">{entry.name}</h3>
                              {entry.consumed && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  Consumed
                                </span>
                              )}
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>{entry.calories} cal</span>
                              <span>{entry.carbs}g carbs</span>
                              <span>{entry.serving_size}g</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(entry.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7"
                              onClick={() => handleCopyEntry(entry)}
                              title="Copy to today"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7"
                              onClick={() => setEditingEntry(entry)}
                              title="Edit entry"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-destructive hover:text-destructive"
                              onClick={() => setDeletingId(entry.id)}
                              title="Delete entry"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {/* Load More / Show Less */}
            {hasMore && !showAll && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAll(true)}
              >
                Load More Entries
              </Button>
            )}

            {showAll && entries.length > 20 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAll(false)}
              >
                Show Less
              </Button>
            )}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Food Entry</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this food entry? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingId && handleDeleteEntry(deletingId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Food Entry Modal */}
        {editingEntry && (
          <EditFoodEntryModal
            entry={editingEntry}
            onClose={() => setEditingEntry(null)}
            onUpdate={async (updatedEntry) => {
              setEntries(entries.map(e => 
                e.id === updatedEntry.id ? { ...e, ...updatedEntry } : e
              ));
              setEditingEntry(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default FoodHistory;