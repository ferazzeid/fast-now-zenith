-- Check if we need to add profile context to chat functions
-- Create a function to build comprehensive profile context for AI
CREATE OR REPLACE FUNCTION get_user_profile_context(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    profile_record RECORD;
    context_parts TEXT[];
    context_string TEXT;
BEGIN
    -- Get the user's profile
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE user_id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN 'No profile information available.';
    END IF;
    
    -- Build context parts
    context_parts := ARRAY[]::TEXT[];
    
    -- Basic profile info
    IF profile_record.weight IS NOT NULL THEN
        context_parts := array_append(context_parts, 
            format('Weight: %s %s', 
                profile_record.weight::TEXT, 
                CASE WHEN profile_record.units = 'metric' THEN 'kg' ELSE 'lbs' END
            )
        );
    END IF;
    
    IF profile_record.height IS NOT NULL THEN
        context_parts := array_append(context_parts, 
            format('Height: %s %s', 
                profile_record.height::TEXT, 
                CASE WHEN profile_record.units = 'metric' THEN 'cm' ELSE 'inches' END
            )
        );
    END IF;
    
    IF profile_record.age IS NOT NULL THEN
        context_parts := array_append(context_parts, 
            format('Age: %s years old', profile_record.age::TEXT)
        );
    END IF;
    
    IF profile_record.sex IS NOT NULL THEN
        context_parts := array_append(context_parts, 
            format('Sex: %s', profile_record.sex)
        );
    END IF;
    
    -- Goals
    IF profile_record.daily_calorie_goal IS NOT NULL THEN
        context_parts := array_append(context_parts, 
            format('Daily calorie goal: %s calories', profile_record.daily_calorie_goal::TEXT)
        );
    END IF;
    
    IF profile_record.daily_carb_goal IS NOT NULL THEN
        context_parts := array_append(context_parts, 
            format('Daily carb goal: %s grams', profile_record.daily_carb_goal::TEXT)
        );
    END IF;
    
    IF profile_record.goal_weight IS NOT NULL THEN
        context_parts := array_append(context_parts, 
            format('Goal weight: %s %s', 
                profile_record.goal_weight::TEXT,
                CASE WHEN profile_record.units = 'metric' THEN 'kg' ELSE 'lbs' END
            )
        );
    END IF;
    
    -- Activity and preferences
    IF profile_record.activity_level IS NOT NULL THEN
        context_parts := array_append(context_parts, 
            format('Activity level: %s', profile_record.activity_level)
        );
    END IF;
    
    IF profile_record.default_walking_speed IS NOT NULL THEN
        context_parts := array_append(context_parts, 
            format('Default walking speed: %s mph', profile_record.default_walking_speed::TEXT)
        );
    END IF;
    
    IF profile_record.manual_tdee_override IS NOT NULL THEN
        context_parts := array_append(context_parts, 
            format('Custom TDEE: %s calories/day', profile_record.manual_tdee_override::TEXT)
        );
    END IF;
    
    -- Unit preference
    context_parts := array_append(context_parts, 
        format('Unit preference: %s', COALESCE(profile_record.units, 'metric'))
    );
    
    -- Combine all parts
    IF array_length(context_parts, 1) > 0 THEN
        context_string := 'User Profile: ' || array_to_string(context_parts, ', ') || '.';
    ELSE
        context_string := 'User profile is incomplete.';
    END IF;
    
    RETURN context_string;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;