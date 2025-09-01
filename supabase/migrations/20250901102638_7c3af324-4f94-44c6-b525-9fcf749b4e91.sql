-- Goal consolidation migration: Remove gender separation and consolidate duplicate goals

DO $$
DECLARE
    current_goals jsonb;
    consolidated_goals jsonb := '[]'::jsonb;
    goal_record jsonb;
    existing_goal jsonb;
    goal_title text;
    goal_exists boolean;
    i integer;
    j integer;
BEGIN
    -- Get current goals from shared_settings
    SELECT setting_value::jsonb INTO current_goals 
    FROM shared_settings 
    WHERE setting_key = 'admin_goal_ideas';
    
    -- Exit if no goals found
    IF current_goals IS NULL OR jsonb_array_length(current_goals) = 0 THEN
        RAISE NOTICE 'No admin goal ideas found to consolidate';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Starting consolidation of % goals', jsonb_array_length(current_goals);
    
    -- Process each goal in the original array
    FOR i IN 0..jsonb_array_length(current_goals) - 1 LOOP
        goal_record := current_goals->i;
        goal_title := goal_record->>'title';
        goal_exists := false;
        
        -- Check if we already have a goal with this title in consolidated_goals
        FOR j IN 0..jsonb_array_length(consolidated_goals) - 1 LOOP
            existing_goal := consolidated_goals->j;
            
            IF existing_goal->>'title' = goal_title THEN
                goal_exists := true;
                
                -- Merge gender-specific images
                IF goal_record->>'gender' = 'male' AND (goal_record->>'imageUrl') IS NOT NULL THEN
                    existing_goal := jsonb_set(existing_goal, '{maleImageUrl}', goal_record->'imageUrl');
                ELSIF goal_record->>'gender' = 'female' AND (goal_record->>'imageUrl') IS NOT NULL THEN
                    existing_goal := jsonb_set(existing_goal, '{femaleImageUrl}', goal_record->'imageUrl');
                END IF;
                
                -- Update the goal in the consolidated array
                consolidated_goals := jsonb_set(consolidated_goals, ARRAY[j::text], existing_goal);
                EXIT;
            END IF;
        END LOOP;
        
        -- If goal doesn't exist yet, add it (remove gender field and create base structure)
        IF NOT goal_exists THEN
            -- Create new consolidated goal
            existing_goal := jsonb_build_object(
                'id', COALESCE(goal_record->>'id', gen_random_uuid()::text),
                'title', goal_record->>'title',
                'description', goal_record->>'description',
                'category', goal_record->>'category',
                'imageUrl', goal_record->>'imageUrl',
                'linkUrl', goal_record->>'linkUrl'
            );
            
            -- Add gender-specific image if present
            IF goal_record->>'gender' = 'male' AND (goal_record->>'imageUrl') IS NOT NULL THEN
                existing_goal := jsonb_set(existing_goal, '{maleImageUrl}', goal_record->'imageUrl');
            ELSIF goal_record->>'gender' = 'female' AND (goal_record->>'imageUrl') IS NOT NULL THEN
                existing_goal := jsonb_set(existing_goal, '{femaleImageUrl}', goal_record->'imageUrl');
            END IF;
            
            -- Add to consolidated goals
            consolidated_goals := consolidated_goals || jsonb_build_array(existing_goal);
        END IF;
    END LOOP;
    
    -- Update the shared_settings with consolidated goals
    UPDATE shared_settings 
    SET setting_value = consolidated_goals::text,
        updated_at = now()
    WHERE setting_key = 'admin_goal_ideas';
    
    RAISE NOTICE 'Consolidation complete: % original goals consolidated to % unified goals', 
        jsonb_array_length(current_goals), 
        jsonb_array_length(consolidated_goals);
    
    -- Log the consolidation details
    INSERT INTO shared_settings (setting_key, setting_value, created_at, updated_at)
    VALUES (
        'goal_consolidation_log',
        jsonb_build_object(
            'timestamp', now(),
            'original_count', jsonb_array_length(current_goals),
            'consolidated_count', jsonb_array_length(consolidated_goals),
            'status', 'completed'
        )::text,
        now(),
        now()
    )
    ON CONFLICT (setting_key) DO UPDATE SET
        setting_value = EXCLUDED.setting_value,
        updated_at = now();
        
END $$;