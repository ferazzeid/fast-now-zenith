import { RefreshCw, UploadCloud } from 'lucide-react';
import { useOutboxSync } from '@/hooks/useOutboxSync';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export const OutboxSyncIndicator = ({ className }: { className?: string }) => {
  const { isSyncing, pending, triggerSync } = useOutboxSync();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show indicator only when there is something pending or syncing
    setVisible(isSyncing || pending > 0);
  }, [isSyncing, pending]);

  if (!visible) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('text-xs text-muted-foreground flex items-center gap-1')}
        title={isSyncing ? 'Syncing changes...' : `${pending} change(s) pending sync`}>
        <UploadCloud className="w-3.5 h-3.5" />
        <span>{isSyncing ? 'Syncing…' : `${pending} pending`}</span>
      </div>
      <Button size="sm" variant="outline" onClick={triggerSync} disabled={isSyncing}>
        <RefreshCw className="w-3.5 h-3.5 mr-1" />
        Sync
      </Button>
    </div>
  );
};

export default OutboxSyncIndicator;
