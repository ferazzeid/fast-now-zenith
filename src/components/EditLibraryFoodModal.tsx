import { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface UserFood {
  id: string;
  name: string;
  calories_per_100g: number;
  carbs_per_100g: number;
  is_favorite: boolean;
}

interface EditLibraryFoodModalProps {
  food: UserFood;
  onUpdate: (id: string, updates: Partial<UserFood>) => Promise<void>;
}

export const EditLibraryFoodModal = ({ food, onUpdate }: EditLibraryFoodModalProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(food.name);
  const [calories, setCalories] = useState(food.calories_per_100g.toString());
  const [carbs, setCarbs] = useState(food.carbs_per_100g.toString());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name || !calories || !carbs) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields"
      });
      return;
    }

    setLoading(true);
    try {
      await onUpdate(food.id, {
        name,
        calories_per_100g: parseFloat(calories),
        carbs_per_100g: parseFloat(carbs)
      });
      
      toast({
        title: "Food updated",
        description: "Food has been updated in your library"
      });
      
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update food in library"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(food.name);
    setCalories(food.calories_per_100g.toString());
    setCarbs(food.carbs_per_100g.toString());
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Food in Library</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-lib-name">Food Name</Label>
            <Input
              id="edit-lib-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Apple, Chicken Breast"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-lib-calories">Calories per 100g</Label>
              <Input
                id="edit-lib-calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="per 100g"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lib-carbs">Carbs per 100g (g)</Label>
              <Input
                id="edit-lib-carbs"
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="grams per 100g"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};