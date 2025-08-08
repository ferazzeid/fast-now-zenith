-- Tighten RLS policies by adding WITH CHECK to enforce correct user_id on INSERT/UPDATE
-- This prevents users from inserting/updating rows for other users (even if they can't read them).

BEGIN;

-- walking_sessions
DROP POLICY IF EXISTS "Users can manage their own walking sessions" ON public.walking_sessions;
CREATE POLICY "Users can manage their own walking sessions"
ON public.walking_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- food_entries
DROP POLICY IF EXISTS "Users can manage their own food entries" ON public.food_entries;
CREATE POLICY "Users can manage their own food entries"
ON public.food_entries
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- user_foods
DROP POLICY IF EXISTS "Users can manage their own food library" ON public.user_foods;
CREATE POLICY "Users can manage their own food library"
ON public.user_foods
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- daily_food_templates
DROP POLICY IF EXISTS "Users can manage their own daily food templates" ON public.daily_food_templates;
CREATE POLICY "Users can manage their own daily food templates"
ON public.daily_food_templates
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- fasting_sessions
DROP POLICY IF EXISTS "Users can manage their own fasting sessions" ON public.fasting_sessions;
CREATE POLICY "Users can manage their own fasting sessions"
ON public.fasting_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- motivators
DROP POLICY IF EXISTS "Users can manage their own motivators" ON public.motivators;
CREATE POLICY "Users can manage their own motivators"
ON public.motivators
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- chat_conversations
DROP POLICY IF EXISTS "Users can manage their own conversations" ON public.chat_conversations;
CREATE POLICY "Users can manage their own conversations"
ON public.chat_conversations
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMIT;


