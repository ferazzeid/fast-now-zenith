-- First, let's get the current goal ideas and add gender field
DO $$
DECLARE
    current_goals_json text;
    goals_array jsonb;
    goal_item jsonb;
    new_goals_array jsonb := '[]'::jsonb;
    female_goals_array jsonb := '[]'::jsonb;
BEGIN
    -- Get current goal ideas
    SELECT setting_value INTO current_goals_json 
    FROM shared_settings 
    WHERE setting_key = 'admin_goal_ideas';
    
    -- If no goals exist, exit
    IF current_goals_json IS NULL THEN
        RAISE NOTICE 'No existing goal ideas found';
        RETURN;
    END IF;
    
    -- Parse the JSON
    goals_array := current_goals_json::jsonb;
    
    -- Process each goal to add gender field and create duplicates
    FOR goal_item IN SELECT * FROM jsonb_array_elements(goals_array)
    LOOP
        -- Add gender: male to original goal
        new_goals_array := new_goals_array || jsonb_build_array(goal_item || '{"gender": "male"}');
        
        -- Create female version with modified title and new ID
        female_goals_array := female_goals_array || jsonb_build_array(
            goal_item || jsonb_build_object(
                'gender', 'female',
                'id', gen_random_uuid()::text,
                'title', (goal_item->>'title') || ' (Female)'
            )
        );
    END LOOP;
    
    -- Combine male and female goals
    new_goals_array := new_goals_array || female_goals_array;
    
    -- Update the database with the new goals
    UPDATE shared_settings 
    SET setting_value = new_goals_array::text,
        updated_at = now()
    WHERE setting_key = 'admin_goal_ideas';
    
    RAISE NOTICE 'Successfully added gender field and duplicated % goals', jsonb_array_length(goals_array);
END $$;