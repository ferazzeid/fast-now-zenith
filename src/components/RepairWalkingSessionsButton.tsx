import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { repairCurrentUserWalkingSessions } from '@/utils/repairWalkingSessions';
import { Wrench, Loader2 } from 'lucide-react';

interface RepairWalkingSessionsButtonProps {
  onRepairComplete?: () => void;
  className?: string;
}

export const RepairWalkingSessionsButton: React.FC<RepairWalkingSessionsButtonProps> = ({
  onRepairComplete,
  className
}) => {
  const [isRepairing, setIsRepairing] = useState(false);
  const { toast } = useToast();

  const handleRepair = async () => {
    try {
      setIsRepairing(true);
      
      const stats = await repairCurrentUserWalkingSessions();
      
      if (stats.errors.length > 0) {
        toast({
          title: "Repair Completed with Warnings",
          description: `Repaired ${stats.sessionsRepaired}/${stats.sessionsFound} sessions. Some issues occurred.`,
          variant: "default",
        });
        console.warn('Repair warnings:', stats.errors);
      } else if (stats.sessionsRepaired > 0) {
        toast({
          title: "Sessions Repaired Successfully",
          description: `Fixed calculations for ${stats.sessionsRepaired} walking sessions.`,
          variant: "default",
        });
      } else if (stats.sessionsFound === 0) {
        toast({
          title: "No Repairs Needed",
          description: "All your walking sessions already have proper calculations.",
          variant: "default",
        });
      } else {
        toast({
          title: "Repair Complete",
          description: `Checked ${stats.sessionsFound} sessions, no repairs needed.`,
          variant: "default",
        });
      }
      
      // Call callback to refresh data
      onRepairComplete?.();
      
    } catch (error) {
      console.error('Repair failed:', error);
      toast({
        title: "Repair Failed",
        description: error instanceof Error ? error.message : "Failed to repair sessions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <Button
      variant="soft"
      size="sm"
      onClick={handleRepair}
      disabled={isRepairing}
      className={className}
    >
      {isRepairing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Repairing...
        </>
      ) : (
        <>
          <Wrench className="w-4 h-4 mr-2" />
          Fix Calculations
        </>
      )}
    </Button>
  );
};