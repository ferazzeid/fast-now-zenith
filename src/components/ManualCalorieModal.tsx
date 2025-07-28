import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ManualCalorieModalProps {
  onCalorieAdded: () => void;
}

export const ManualCalorieModal = ({ onCalorieAdded }: ManualCalorieModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activityName, setActivityName] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const predefinedActivities = [
    { name: 'Weight Training', calories: 300 },
    { name: 'Running', calories: 400 },
    { name: 'Cycling', calories: 350 },
    { name: 'Swimming', calories: 450 },
    { name: 'Yoga', calories: 200 },
    { name: 'Basketball', calories: 350 },
    { name: 'Soccer', calories: 400 },
    { name: 'Tennis', calories: 300 },
    { name: 'Dancing', calories: 250 },
    { name: 'Hiking', calories: 320 },
  ];

  const handleActivitySelect = (activity: string) => {
    const selected = predefinedActivities.find(a => a.name === activity);
    if (selected) {
      setActivityName(selected.name);
      setCaloriesBurned(selected.calories.toString());
    }
  };

  const handleSave = async () => {
    if (!activityName.trim() || !caloriesBurned.trim() || !user) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const calories = parseInt(caloriesBurned);
    if (calories <= 0 || calories > 2000) {
      toast({
        title: "Error", 
        description: "Please enter a valid calorie amount (1-2000)",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('manual_calorie_burns')
        .insert({
          user_id: user.id,
          activity_name: activityName.trim(),
          calories_burned: calories,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Added ${calories} calories burned from ${activityName}`,
      });

      // Reset form
      setActivityName('');
      setCaloriesBurned('');
      setIsOpen(false);
      onCalorieAdded();
    } catch (error) {
      console.error('Error saving manual calorie burn:', error);
      toast({
        title: "Error",
        description: "Failed to save calorie burn",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs px-2 py-1">
          <Plus className="w-3 h-3 mr-1" />
          Add Calories
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Manual Calorie Burn</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="activity-select">Quick Select Activity</Label>
            <Select onValueChange={handleActivitySelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an activity..." />
              </SelectTrigger>
              <SelectContent>
                {predefinedActivities.map((activity) => (
                  <SelectItem key={activity.name} value={activity.name}>
                    {activity.name} (~{activity.calories} cal)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="activity-name">Activity Name</Label>
            <Input
              id="activity-name"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="e.g., Weight Training"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="calories">Calories Burned</Label>
            <Input
              id="calories"
              type="number"
              value={caloriesBurned}
              onChange={(e) => setCaloriesBurned(e.target.value)}
              placeholder="e.g., 300"
              min="1"
              max="2000"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Add Calories'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};