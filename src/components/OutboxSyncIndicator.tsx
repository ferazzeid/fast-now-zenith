import { RefreshCw, UploadCloud, Timer, Clock, Utensils } from 'lucide-react';
import { useOutboxSync } from '@/hooks/useOutboxSync';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { listOperations } from '@/utils/outbox';

export const OutboxSyncIndicator = ({ className }: { className?: string }) => {
  const { isSyncing, pending, triggerSync } = useOutboxSync();
  const [visible, setVisible] = useState(false);
  const [operations, setOperations] = useState<any[]>([]);

  useEffect(() => {
    // Only show when actively syncing or when there are pending operations
    setVisible(isSyncing || pending > 0);
    
    // Load operations to show breakdown
    if (pending > 0) {
      listOperations().then(setOperations);
    }
  }, [isSyncing, pending]);

  // Don't show sync indicator when there's no active session or pending operations
  if (!visible || pending === 0) return null;

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'walking_session': return <Timer className="w-3 h-3" />;
      case 'fasting_session': return <Clock className="w-3 h-3" />;
      case 'food_entry': return <Utensils className="w-3 h-3" />;
      default: return <UploadCloud className="w-3 h-3" />;
    }
  };

  const entityCounts = operations.reduce((acc, op) => {
    acc[op.entity] = (acc[op.entity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('text-xs text-muted-foreground flex items-center gap-1')}
        title={isSyncing ? 'Syncing changes...' : `${pending} change(s) pending sync`}>
        <UploadCloud className="w-3.5 h-3.5" />
        <span>{isSyncing ? 'Syncing…' : `${pending} pending`}</span>
      </div>
      
      {/* Show breakdown if multiple entity types */}
      {Object.keys(entityCounts).length > 1 && (
        <div className="flex items-center gap-1">
          {Object.entries(entityCounts).map(([entity, count]) => (
            <div key={entity} className="flex items-center gap-0.5 text-xs text-muted-foreground">
              {getEntityIcon(entity)}
              <span>{count as number}</span>
            </div>
          ))}
        </div>
      )}
      
      <Button size="sm" variant="outline" onClick={triggerSync} disabled={isSyncing}>
        <RefreshCw className="w-3.5 h-3.5 mr-1" />
        Sync
      </Button>
    </div>
  );
};

export default OutboxSyncIndicator;
