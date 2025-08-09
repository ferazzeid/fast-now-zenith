import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  listOperations, 
  removeOperation, 
  updateOperation, 
  resolveMappedId, 
  setIdMapping, 
  dispatchOutboxEvent,
  getPendingCount,
} from '@/utils/outbox';

// Processes the outbox when online. Focused on walking_sessions for now.
export const useOutboxSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pending, setPending] = useState<number>(0);
  const isMounted = useRef(true);

  const refreshCount = useCallback(async () => {
    const count = await getPendingCount();
    if (isMounted.current) setPending(count);
  }, []);

  useEffect(() => {
    isMounted.current = true;
    refreshCount();
    const changed = () => refreshCount();
    window.addEventListener('outbox:changed', changed);
    return () => {
      isMounted.current = false;
      window.removeEventListener('outbox:changed', changed);
    };
  }, [refreshCount]);

  const processWalkingOp = useCallback(async (op: any) => {
    const { action, payload, user_id } = op;

    // Helper to resolve possibly-local IDs
    const resolveId = async (id?: string | null) => await resolveMappedId(id);

    if (action === 'start') {
      // Insert new session
      const { local_id, start_time, speed_mph, total_pause_duration, session_state, status } = payload;
      const { data, error } = await supabase.from('walking_sessions')
        .insert({
          user_id,
          start_time,
          status: status ?? 'active',
          session_state: session_state ?? 'active',
          total_pause_duration: total_pause_duration ?? 0,
          speed_mph,
        })
        .select()
        .single();
      if (error) throw error;
      // Map local -> server id
      if (local_id && data?.id) {
        await setIdMapping(local_id, data.id);
      }
      return;
    }

    if (action === 'pause') {
      const id = await resolveId(payload.session_id);
      const pause_start_time = payload.pause_start_time ?? new Date().toISOString();
      const { error } = await supabase.from('walking_sessions')
        .update({ session_state: 'paused', pause_start_time })
        .eq('id', id!);
      if (error) throw error;
      return;
    }

    if (action === 'resume') {
      const id = await resolveId(payload.session_id);
      // Fetch current total_pause_duration, then add the increment from payload
      const increment = payload.pause_duration_seconds ?? 0;
      const { data: row, error: selErr } = await supabase
        .from('walking_sessions')
        .select('total_pause_duration')
        .eq('id', id!)
        .single();
      if (selErr) throw selErr;
      const newTotal = (row?.total_pause_duration ?? 0) + increment;
      const { error } = await supabase.from('walking_sessions')
        .update({ session_state: 'active', pause_start_time: null, total_pause_duration: newTotal })
        .eq('id', id!);
      if (error) throw error;
      return;
    }

    if (action === 'update_speed') {
      const id = await resolveId(payload.session_id);
      const { error } = await supabase
        .from('walking_sessions')
        .update({ speed_mph: payload.speed_mph })
        .eq('id', id!);
      if (error) throw error;
      return;
    }

    if (action === 'end') {
      const id = await resolveId(payload.session_id);
      const updateData = payload.updateData;
      const { error } = await supabase
        .from('walking_sessions')
        .update(updateData)
        .eq('id', id!);
      if (error) throw error;
      return;
    }

    if (action === 'cancel') {
      const id = await resolveId(payload.session_id);
      const { error } = await supabase.from('walking_sessions').delete().eq('id', id!);
      if (error) throw error;
      return;
    }
  }, []);

  const processOutbox = useCallback(async () => {
    if (isSyncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    setIsSyncing(true);
    dispatchOutboxEvent('sync-start');

    try {
      const ops = await listOperations();
      for (const op of ops) {
        try {
          if (op.entity === 'walking_session') {
            await processWalkingOp(op);
          }
          await removeOperation(op.id);
        } catch (err: any) {
          // Update attempts and lastError, then break to retry later
          op.attempts = (op.attempts ?? 0) + 1;
          op.lastError = err?.message ?? String(err);
          await updateOperation(op);
          break;
        }
      }
    } finally {
      setIsSyncing(false);
      dispatchOutboxEvent('sync-complete');
      refreshCount();
    }
  }, [isSyncing, processWalkingOp, refreshCount]);

  useEffect(() => {
    const onlineHandler = () => processOutbox();
    const visHandler = () => { if (!document.hidden) processOutbox(); };
    window.addEventListener('online', onlineHandler);
    document.addEventListener('visibilitychange', visHandler);
    // Try once on mount
    processOutbox();
    return () => {
      window.removeEventListener('online', onlineHandler);
      document.removeEventListener('visibilitychange', visHandler);
    };
  }, [processOutbox]);

  return {
    isSyncing,
    pending,
    triggerSync: processOutbox,
  };
};
