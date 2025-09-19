import { useState } from 'react';
import { Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ManualFoodEntryForm } from './ManualFoodEntryForm';

interface ManualFoodInputButtonProps {
  onFoodAdded?: (foods: any[]) => void;
  className?: string;
}

export const ManualFoodInputButton = ({ onFoodAdded, className = "" }: ManualFoodInputButtonProps) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowForm(true)}
        variant="outline"
        className={`w-16 h-16 rounded-full border-border bg-background hover:bg-muted transition-colors ${className}`}
        title="Manual food entry"
      >
        <Edit3 className="w-6 h-6 text-foreground" />
      </Button>

      {showForm && (
        <ManualFoodEntryForm
          onFoodAdded={onFoodAdded}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
};