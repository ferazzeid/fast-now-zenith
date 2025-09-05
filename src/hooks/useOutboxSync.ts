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

  const processFastingOp = useCallback(async (op: any) => {
    const { action, payload, user_id } = op;

    // Helper to resolve possibly-local IDs
    const resolveId = async (id?: string | null) => await resolveMappedId(id);

    if (action === 'start') {
      // End any existing active sessions first
      await supabase
        .from('fasting_sessions')
        .update({ 
          status: 'cancelled',
          end_time: new Date().toISOString()
        })
        .eq('user_id', user_id)
        .eq('status', 'active');

      // Insert new session
      const { local_id, start_time, goal_duration_seconds } = payload;
      const { data, error } = await supabase.from('fasting_sessions')
        .insert({
          user_id,
          start_time,
          goal_duration_seconds,
          status: 'active',
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

    if (action === 'end') {
      const id = await resolveId(payload.session_id);
      const { end_time, duration_seconds, status } = payload;
      const { error } = await supabase.from('fasting_sessions')
        .update({ end_time, duration_seconds, status })
        .eq('id', id!);
      if (error) throw error;
      return;
    }

    if (action === 'cancel') {
      const id = await resolveId(payload.session_id);
      const { error } = await supabase.from('fasting_sessions')
        .update({ status: 'cancelled', end_time: new Date().toISOString() })
        .eq('id', id!);
      if (error) throw error;
      return;
    }
  }, []);

  const processFoodOp = useCallback(async (op: any) => {
    const { action, payload, user_id } = op;

    // Helper to resolve possibly-local IDs
    const resolveId = async (id?: string | null) => await resolveMappedId(id);

    if (action === 'create') {
      const { local_id, name, calories, carbs, serving_size, consumed, image_url } = payload;
      const { data, error } = await supabase.from('food_entries')
        .insert({
          user_id,
          name,
          calories,
          carbs,
          serving_size,
          consumed: consumed ?? true,
          image_url,
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

    if (action === 'update') {
      const id = await resolveId(payload.entry_id);
      const { updates } = payload;
      const { error } = await supabase.from('food_entries')
        .update(updates)
        .eq('id', id!)
        .eq('user_id', user_id);
      if (error) throw error;
      return;
    }

    if (action === 'delete') {
      const id = await resolveId(payload.entry_id);
      const { error } = await supabase.from('food_entries')
        .delete()
        .eq('id', id!)
        .eq('user_id', user_id);
      if (error) throw error;
      return;
    }

    if (action === 'toggle_consumed') {
      const id = await resolveId(payload.entry_id);
      const { consumed } = payload;
      const { error } = await supabase.from('food_entries')
        .update({ consumed })
        .eq('id', id!)
        .eq('user_id', user_id);
      if (error) throw error;
      return;
    }
  }, []);

  const processAIChatOp = useCallback(async (op: any) => {
    const { action, payload } = op;
    
    if (action === 'process_message') {
      const { message, fromVoice, currentPath } = payload;
      const pageContext = getPageContext(currentPath);
      const contextMode = currentPath === '/food-tracking' ? 'food_only' : undefined;
      const systemPrompt = `You are a helpful assistant for a fasting and health tracking app. Help users with app features, calculations, unit conversions, and guidance. Current page: ${pageContext}`;

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          context: contextMode
        }
      });

      if (error) throw error;

      // Dispatch a custom event with the AI response so the component can handle it
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ai-chat-response', { 
          detail: { data, fromVoice, originalMessage: message } 
        }));
      }
      return;
    }
  }, []);

  // Helper function to get page context
  const getPageContext = (path: string): string => {
    switch (path) {
      case '/walking':
        return 'Walking page - user can start/stop walking sessions, view walking history, and track calories burned';
      case '/timer':
        return 'Fasting timer page - user can start/stop fasting sessions and see fasting progress';
      case '/food-tracking':
        return 'Food tracking page - user can add food entries, track calories and carbs';
      case '/motivators':
        return 'Motivators page - user can view and manage personal motivation cards';
      case '/settings':
        return 'Settings page - user can configure their profile, goals, and app preferences';
      default:
        return 'Main app interface for fasting and health tracking';
    }
  };

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
          } else if (op.entity === 'fasting_session') {
            await processFastingOp(op);
          } else if (op.entity === 'food_entry') {
            await processFoodOp(op);
          } else if (op.entity === 'ai_chat') {
            await processAIChatOp(op);
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
  }, [isSyncing, processWalkingOp, processFastingOp, processFoodOp, processAIChatOp, refreshCount]);

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
