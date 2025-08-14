import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOutboxSync } from '@/hooks/useOutboxSync';
import { useOfflineFastingSession } from '@/hooks/useOfflineFastingSession';
import { useOfflineFoodEntries } from '@/hooks/useOfflineFoodEntries';
import { useAuth } from '@/hooks/useAuth';
import { listOperations } from '@/utils/outbox';
import { Wifi, WifiOff, Clock, Utensils, Timer, Zap } from 'lucide-react';

export const OfflineTestingPanel = () => {
  const { user } = useAuth();
  const { isSyncing, pending, triggerSync } = useOutboxSync();
  const { startFastingSession, endFastingSession, currentSession } = useOfflineFastingSession();
  const { addFoodEntry, todayEntries } = useOfflineFoodEntries();
  const [operations, setOperations] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online status
  useState(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  });

  const loadOperations = async () => {
    const ops = await listOperations();
    setOperations(ops);
  };

  const testOfflineFasting = async () => {
    try {
      if (currentSession) {
        await endFastingSession();
      } else {
        await startFastingSession(3600); // 1 hour goal
      }
      await loadOperations();
    } catch (error) {
      console.error('Fasting test error:', error);
    }
  };

  const testOfflineFood = async () => {
    try {
      await addFoodEntry({
        name: `Test Food ${Date.now()}`,
        calories: 100,
        carbs: 20,
        serving_size: 100,
        consumed: true,
      });
      await loadOperations();
    } catch (error) {
      console.error('Food test error:', error);
    }
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'walking_session': return <Timer className="w-4 h-4" />;
      case 'fasting_session': return <Clock className="w-4 h-4" />;
      case 'food_entry': return <Utensils className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'start': return 'bg-green-500';
      case 'end': case 'cancel': return 'bg-red-500';
      case 'create': return 'bg-blue-500';
      case 'update': case 'toggle_consumed': return 'bg-yellow-500';
      case 'delete': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-500" />
          )}
          Offline Testing Panel
          <Badge variant="outline">
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={pending > 0 ? 'destructive' : 'secondary'}>
              {pending} pending operations
            </Badge>
            {isSyncing && <Badge variant="outline">Syncing...</Badge>}
          </div>
          <div className="space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={loadOperations}
            >
              Refresh Queue
            </Button>
            <Button 
              size="sm" 
              onClick={triggerSync}
              disabled={isSyncing}
            >
              Sync Now
            </Button>
          </div>
        </div>

        {/* Test Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Fasting Session Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Current: {currentSession ? 'Active Session' : 'No Session'}
                </p>
                <Button 
                  size="sm" 
                  onClick={testOfflineFasting}
                  className="w-full"
                >
                  {currentSession ? 'End Session' : 'Start Session'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                Food Entry Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Today: {todayEntries.length} entries
                </p>
                <Button 
                  size="sm" 
                  onClick={testOfflineFood}
                  className="w-full"
                >
                  Add Test Food
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operation Queue */}
        {operations.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Pending Operations</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {operations.map((op) => (
                <div 
                  key={op.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getEntityIcon(op.entity)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{op.entity}</span>
                        <Badge 
                          variant="secondary" 
                          className={`text-white ${getActionColor(op.action)}`}
                        >
                          {op.action}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(op.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Attempts: {op.attempts || 0}</p>
                    {op.lastError && (
                      <p className="text-xs text-red-500 max-w-40 truncate">
                        {op.lastError}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <Card className="bg-muted">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2">Testing Instructions:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
              <li>Go offline (disable internet) to test offline functionality</li>
              <li>Use test buttons to create operations while offline</li>
              <li>Check "Pending Operations" to see queued items</li>
              <li>Go back online and click "Sync Now" to process queue</li>
              <li>Verify operations appear in database after sync</li>
            </ol>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default OfflineTestingPanel;