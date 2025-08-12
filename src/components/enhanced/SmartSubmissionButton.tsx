import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SmartSubmissionButtonProps {
  onSubmit: () => Promise<void>;
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  loadingText?: string;
}

export const SmartSubmissionButton = ({
  onSubmit,
  children,
  variant = "default",
  size = "default",
  className,
  disabled = false,
  loadingText = "Submitting..."
}: SmartSubmissionButtonProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (isSubmitting || disabled) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit();
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error?.message || "An error occurred while submitting. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSubmit}
      disabled={isSubmitting || disabled}
      className={cn("gap-2", className)}
    >
      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
      {isSubmitting ? loadingText : children}
    </Button>
  );
};