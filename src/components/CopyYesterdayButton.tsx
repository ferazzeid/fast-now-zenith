import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Clock } from 'lucide-react';
import { useCopyYesterdayFoods } from '@/hooks/useCopyYesterdayFoods';
import { useFoodEntries } from '@/hooks/useFoodEntries';

interface CopyYesterdayButtonProps {
  onCopied?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

export const CopyYesterdayButton = ({ 
  onCopied, 
  variant = 'outline',
  size = 'default'
}: CopyYesterdayButtonProps) => {
  const { copyYesterdayFoods, loading } = useCopyYesterdayFoods();
  const { refreshEntries } = useFoodEntries();

  const handleCopy = async () => {
    const result = await copyYesterdayFoods();
    if (result.success) {
      // Immediately refresh food entries to show copied items
      await refreshEntries();
      if (onCopied) {
        onCopied();
      }
    }
  };

  return (
    <Button
      onClick={handleCopy}
      disabled={loading}
      variant={variant}
      size={size}
      className="flex items-center gap-2"
    >
      {loading ? (
        <Clock className="w-4 h-4 animate-spin" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
      {loading ? 'Copying...' : 'Copy Yesterday\'s Foods'}
    </Button>
  );
};