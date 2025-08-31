-- Add gender and system goal fields to motivators table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'motivators' AND column_name = 'gender') THEN
        ALTER TABLE public.motivators ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'both'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'motivators' AND column_name = 'is_system_goal') THEN
        ALTER TABLE public.motivators ADD COLUMN is_system_goal BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create function to import default goals from shared_settings
CREATE OR REPLACE FUNCTION import_default_goals()
RETURNS void AS $$
DECLARE
    goals_json TEXT;
    goal_record JSONB;
    base_slug TEXT;
    unique_slug TEXT;
    admin_user_id UUID;
BEGIN
    -- Get the first available user ID (admin user)
    SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
    
    -- If no users found, exit
    IF admin_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Get the admin goal ideas from shared_settings
    SELECT setting_value INTO goals_json 
    FROM shared_settings 
    WHERE setting_key = 'admin_goal_ideas';
    
    -- If no data found, exit
    IF goals_json IS NULL THEN
        RETURN;
    END IF;
    
    -- Loop through each goal and insert into motivators table
    FOR goal_record IN SELECT * FROM jsonb_array_elements(goals_json::jsonb)
    LOOP
        -- Generate base slug from title
        base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(goal_record->>'title', '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
        
        -- Generate unique slug (append gender if needed)
        unique_slug := base_slug || '-' || (goal_record->>'gender');
        
        -- Insert the goal as a motivator (only if it doesn't exist)
        INSERT INTO public.motivators (
            title,
            content,
            category,
            image_url,
            gender,
            is_system_goal,
            is_active,
            is_published,
            slug,
            user_id
        )
        SELECT 
            goal_record->>'title',
            goal_record->>'description',
            goal_record->>'category',
            goal_record->>'imageUrl',
            goal_record->>'gender',
            true, -- is_system_goal
            true, -- is_active
            true, -- is_published
            unique_slug,
            admin_user_id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.motivators 
            WHERE title = (goal_record->>'title') 
            AND gender = (goal_record->>'gender')
            AND is_system_goal = true
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the import
SELECT import_default_goals();

-- Clean up function
DROP FUNCTION import_default_goals();