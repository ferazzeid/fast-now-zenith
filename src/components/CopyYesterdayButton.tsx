import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Clock } from 'lucide-react';
import { useCopyYesterdayFoods } from '@/hooks/useCopyYesterdayFoods';

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

  const handleCopy = async () => {
    const result = await copyYesterdayFoods();
    if (result.success && onCopied) {
      onCopied();
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