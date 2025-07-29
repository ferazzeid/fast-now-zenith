import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openai-api-key',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Chat completion request received');
    const { message, conversationHistory = [] } = await req.json();
    
    if (!message) {
      throw new Error('No message provided');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://texnkijwcygodtywgedm.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration not available');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    console.log('User authentication result:', { success: !!userData.user, error: userError?.message });
    if (userError || !userData.user) {
      throw new Error('User not authenticated');
    }

    const userId = userData.user.id;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();
    
    const isAdmin = !!userRole;

    // Determine which API key to use
    let OPENAI_API_KEY;
    const clientApiKey = req.headers.get('X-OpenAI-API-Key');
    
    if (profile?.use_own_api_key && profile?.openai_api_key) {
      OPENAI_API_KEY = profile.openai_api_key;
      console.log('Using user OpenAI API key from profile');
    } else if (clientApiKey) {
      OPENAI_API_KEY = clientApiKey;
      console.log('Using client OpenAI API key');
    } else {
      throw new Error('OpenAI API key not provided');
    }

    // Get AI response length setting
    const { data: lengthSetting } = await supabase
      .from('shared_settings')
      .select('setting_value')
      .eq('setting_key', 'ai_response_length')
      .single();

    const responseLength = lengthSetting?.setting_value || 'medium';
    const lengthInstruction = {
      'short': 'Keep responses very brief (1-2 sentences maximum). Be concise and to the point.',
      'medium': 'Keep responses moderate length (2-4 sentences). Provide helpful information without being verbose.',
      'long': 'Provide detailed explanations when needed. Use multiple sentences to thoroughly address the user\'s needs.',
      'adaptive': 'Adapt response length based on context - brief for simple questions, detailed for complex topics.'
    }[responseLength];

    // Enhanced system prompt with comprehensive functions
    const systemPrompt = `You are an intelligent AI health companion that serves as the CENTRAL BRAIN for this wellness app. You have complete control over all user data and app functionality.

**CORE RESPONSIBILITIES:**
- Automatically detect and extract structured data from conversations
- Proactively manage user profiles, goals, and preferences
- Intelligently suggest UI actions and navigation
- Handle ALL data operations seamlessly
- Provide contextual guidance and motivation

**AUTOMATIC DATA MANAGEMENT:**
When users mention personal details (weight, height, age, goals), automatically update their profile.
When users talk about food, automatically log it to their nutrition tracker.
When users want to exercise, automatically start sessions.
When users share achievements or struggles, offer relevant motivators.

**INTELLIGENT EXTRACTION:**
Always look for opportunities to:
- Update incomplete profile information
- Set or adjust daily goals based on user preferences
- Create personalized motivators from user conversations
- Suggest optimal fasting windows based on their schedule
- Recommend walking goals based on their fitness level

Response Length: ${lengthInstruction}

You have access to these comprehensive functions:

**PROFILE & SETTINGS:**
1. get_user_profile - Get complete user profile and current stats
2. update_user_profile - Update user profile information (weight, height, age, goals, etc.)
3. calculate_bmr - Calculate Basal Metabolic Rate
4. get_user_preferences - Get user interface and behavior preferences
5. update_user_preferences - Update user preferences and settings

**FOOD & NUTRITION:**
6. add_food_entry - Add food items to nutrition log
7. get_food_entries - Get user's food entries for any date range
8. update_food_entry - Modify existing food entries
9. delete_food_entry - Remove food entries
10. toggle_food_consumption - Mark foods as eaten/logged
11. analyze_nutrition_trends - Get nutrition insights and recommendations

**WALKING & EXERCISE:**
12. start_walking_session - Begin a walking session
13. get_walking_sessions - Get walking history and statistics
14. end_walking_session - Complete current walking session
15. pause_walking_session - Pause current walking session
16. resume_walking_session - Resume paused walking session
17. update_walking_speed - Adjust walking pace during session

**FASTING:**
18. start_fasting_session - Begin a fasting period
19. get_fasting_sessions - Get fasting history and current status
20. end_fasting_session - Complete current fast
21. cancel_fasting_session - Cancel current fast
22. analyze_fasting_trends - Get fasting insights and recommendations

**MOTIVATORS & GUIDANCE:**
23. create_motivator - Create personalized motivational content
24. get_user_motivators - View all motivational content
25. update_motivator - Edit existing motivational content
26. delete_motivator - Remove motivational content
27. get_contextual_motivators - Get motivators relevant to current situation

**UI & NAVIGATION:**
28. suggest_ui_actions - Recommend interface actions based on user state
29. get_dashboard_insights - Generate dashboard content and recommendations
30. create_daily_plan - Generate personalized daily health plan

${isAdmin ? '**ADMIN FUNCTIONS:**\n31. save_admin_note - Save development notes and observations\n32. get_admin_notes - Retrieve saved admin notes' : ''}

**PROACTIVE BEHAVIOR:**
- Automatically fill missing profile data when mentioned in conversation
- Suggest relevant actions based on user's current state and goals
- Provide contextual guidance without being asked
- Create motivators from user's personal stories and goals
- Recommend UI features the user should explore

Be the intelligent brain that anticipates user needs and seamlessly manages their health journey.

Important: You can take actions automatically when the intent is clear, but always confirm major decisions.`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    // Comprehensive function definitions for AI-centric architecture
    const functions = [
      // PROFILE & SETTINGS
      {
        name: 'get_user_profile',
        description: 'Get complete user profile and current stats',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'update_user_profile',
        description: 'Update user profile information (weight, height, age, goals, etc.)',
        parameters: {
          type: 'object',
          properties: {
            weight: { type: 'number', description: 'Weight in kg' },
            height: { type: 'number', description: 'Height in cm' },
            age: { type: 'number', description: 'Age in years' },
            daily_calorie_goal: { type: 'number', description: 'Daily calorie goal' },
            daily_carb_goal: { type: 'number', description: 'Daily carb goal in grams' },
            activity_level: { 
              type: 'string', 
              enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
              description: 'Activity level for TDEE calculation' 
            }
          },
          required: []
        }
      },
      {
        name: 'calculate_bmr',
        description: 'Calculate user\'s Basal Metabolic Rate',
        parameters: {
          type: 'object',
          properties: {
            weight: { type: 'number', description: 'Weight in kg' },
            height: { type: 'number', description: 'Height in cm' },
            age: { type: 'number', description: 'Age in years' },
            gender: { type: 'string', enum: ['male', 'female'], description: 'Gender for BMR calculation' }
          },
          required: ['weight', 'height', 'age', 'gender']
        }
      },

      // FOOD & NUTRITION
      {
        name: 'add_food_entry',
        description: 'Add food items to nutrition log',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Name of the food item' },
            calories: { type: 'number', description: 'Total calories for this serving' },
            carbs: { type: 'number', description: 'Total carbs in grams for this serving' },
            serving_size: { type: 'number', description: 'Serving size in grams' },
            consumed: { type: 'boolean', description: 'Whether the food was actually eaten' }
          },
          required: ['name', 'calories', 'carbs', 'serving_size']
        }
      },
      {
        name: 'get_food_entries',
        description: 'Get user\'s food entries for any date range',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Date in YYYY-MM-DD format (defaults to today)' },
            days_back: { type: 'number', description: 'Number of days to look back from the date' }
          },
          required: []
        }
      },
      {
        name: 'update_food_entry',
        description: 'Modify existing food entries',
        parameters: {
          type: 'object',
          properties: {
            food_name: { type: 'string', description: 'Name of the food to update' },
            calories: { type: 'number', description: 'New calorie value' },
            carbs: { type: 'number', description: 'New carb value' },
            serving_size: { type: 'number', description: 'New serving size' }
          },
          required: ['food_name']
        }
      },
      {
        name: 'delete_food_entry',
        description: 'Remove food entries',
        parameters: {
          type: 'object',
          properties: {
            food_name: { type: 'string', description: 'Name of the food item to delete' }
          },
          required: ['food_name']
        }
      },
      {
        name: 'toggle_food_consumption',
        description: 'Mark foods as eaten/logged',
        parameters: {
          type: 'object',
          properties: {
            food_name: { type: 'string', description: 'Name of the food item to toggle' },
            consumed: { type: 'boolean', description: 'true to mark as eaten, false to mark as just logged' }
          },
          required: ['food_name', 'consumed']
        }
      },

      // WALKING & EXERCISE
      {
        name: 'start_walking_session',
        description: 'Begin a walking session',
        parameters: {
          type: 'object',
          properties: {
            speed_mph: { type: 'number', description: 'Walking speed in mph (default 3.0)' },
            confirm: { type: 'boolean', description: 'Confirmation that the user wants to start walking' }
          },
          required: ['confirm']
        }
      },
      {
        name: 'get_walking_sessions',
        description: 'Get walking history and statistics',
        parameters: {
          type: 'object',
          properties: {
            days_back: { type: 'number', description: 'Number of days to look back (default 7)' }
          },
          required: []
        }
      },
      {
        name: 'end_walking_session',
        description: 'Complete current walking session',
        parameters: {
          type: 'object',
          properties: {
            confirm: { type: 'boolean', description: 'Confirmation to end the session' }
          },
          required: ['confirm']
        }
      },
      {
        name: 'pause_walking_session',
        description: 'Pause current walking session',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'resume_walking_session',
        description: 'Resume paused walking session',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'update_walking_speed',
        description: 'Adjust walking pace during session',
        parameters: {
          type: 'object',
          properties: {
            speed_mph: { type: 'number', description: 'New walking speed in mph' }
          },
          required: ['speed_mph']
        }
      },

      // FASTING
      {
        name: 'start_fasting_session',
        description: 'Begin a fasting period',
        parameters: {
          type: 'object',
          properties: {
            goal_hours: { type: 'number', description: 'Goal fasting duration in hours' },
            confirm: { type: 'boolean', description: 'Confirmation to start fasting' }
          },
          required: ['goal_hours', 'confirm']
        }
      },
      {
        name: 'get_fasting_sessions',
        description: 'Get fasting history and current status',
        parameters: {
          type: 'object',
          properties: {
            days_back: { type: 'number', description: 'Number of days to look back (default 7)' }
          },
          required: []
        }
      },
      {
        name: 'end_fasting_session',
        description: 'Complete current fast',
        parameters: {
          type: 'object',
          properties: {
            confirm: { type: 'boolean', description: 'Confirmation to end the fast' }
          },
          required: ['confirm']
        }
      },
      {
        name: 'cancel_fasting_session',
        description: 'Cancel current fast',
        parameters: {
          type: 'object',
          properties: {
            reason: { type: 'string', description: 'Optional reason for canceling' }
          },
          required: []
        }
      },

      // MOTIVATORS & GUIDANCE
      {
        name: 'create_motivator',
        description: 'Create personalized motivational content',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'A short, inspiring title for the motivator' },
            content: { type: 'string', description: 'The motivational message content' },
            category: {
              type: 'string',
              enum: ['fasting', 'exercise', 'nutrition', 'general'],
              description: 'The category of motivation'
            }
          },
          required: ['title', 'content', 'category']
        }
      },
      {
        name: 'get_user_motivators',
        description: 'View all motivational content',
        parameters: {
          type: 'object',
          properties: {
            category: { 
              type: 'string', 
              enum: ['fasting', 'exercise', 'nutrition', 'general'],
              description: 'Filter by category (optional)' 
            }
          },
          required: []
        }
      },
      {
        name: 'update_motivator',
        description: 'Edit existing motivational content',
        parameters: {
          type: 'object',
          properties: {
            motivator_id: { type: 'string', description: 'ID of the motivator to update' },
            title: { type: 'string', description: 'New title for the motivator' },
            content: { type: 'string', description: 'New content for the motivator' },
            category: {
              type: 'string',
              enum: ['fasting', 'exercise', 'nutrition', 'general'],
              description: 'New category for the motivator'
            }
          },
          required: ['motivator_id']
        }
      },
      {
        name: 'delete_motivator',
        description: 'Remove motivational content',
        parameters: {
          type: 'object',
          properties: {
            motivator_id: { type: 'string', description: 'ID of the motivator to delete' }
          },
          required: ['motivator_id']
        }
      },

      // UI & NAVIGATION
      {
        name: 'suggest_ui_actions',
        description: 'Recommend interface actions based on user state',
        parameters: {
          type: 'object',
          properties: {
            context: { type: 'string', description: 'Current user context or situation' }
          },
          required: []
        }
      },
      {
        name: 'get_dashboard_insights',
        description: 'Generate dashboard content and recommendations',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'create_daily_plan',
        description: 'Generate personalized daily health plan',
        parameters: {
          type: 'object',
          properties: {
            focus: { 
              type: 'string', 
              enum: ['fasting', 'exercise', 'nutrition', 'balance'],
              description: 'Primary focus for the daily plan' 
            }
          },
          required: []
        }
      }
    ];

    // Remove admin functions from being sent to OpenAI to reduce costs
    // Admin notes are excluded from AI context for performance

        // Send to OpenAI Chat Completions API
    console.log('Sending request to OpenAI with', functions.length, 'functions available');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: messages,
        functions: functions,
        function_call: 'auto',
        max_tokens: 1000,
        temperature: 0.7
      }),
    });

    console.log('OpenAI response status:', response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Chat completion successful');

    const choice = result.choices[0];
    const message_response = choice.message;
    
    // Handle function calls
    if (message_response.function_call) {
      console.log('Function call detected:', message_response.function_call.name);
      console.log('Function arguments:', message_response.function_call.arguments);
      
      try {
        const functionArgs = JSON.parse(message_response.function_call.arguments);
        let functionResult = null;
        
        // Add function call confidence and validation
        console.log('Executing function:', message_response.function_call.name, 'with args:', functionArgs);

        switch (message_response.function_call.name) {
          case 'create_motivator':
            console.log('Creating motivator with args:', functionArgs);
            const { data: motivator, error: motivatorError } = await supabase
              .from('motivators')
              .insert([{
                user_id: userId,
                title: functionArgs.title,
                content: functionArgs.content,
                category: functionArgs.category
              }])
              .select()
              .single();
            
            if (motivatorError) {
              functionResult = `Error creating motivator: ${motivatorError.message}`;
            } else {
              functionResult = `Motivator saved successfully: "${functionArgs.title}"`;
            }
            break;

          case 'get_user_motivators':
            console.log('Getting user motivators');
            const { data: userMotivators, error: getMotivatorsError } = await supabase
              .from('motivators')
              .select('id, title, content, category, created_at')
              .eq('user_id', userId)
              .eq('is_active', true)
              .order('created_at', { ascending: false });
            
            if (getMotivatorsError) {
              functionResult = `Error retrieving motivators: ${getMotivatorsError.message}`;
            } else {
              if (userMotivators && userMotivators.length > 0) {
                const motivatorsList = userMotivators.map(m => 
                  `• "${m.title}" (${m.category}) - ${m.content.substring(0, 80)}${m.content.length > 80 ? '...' : ''}`
                ).join('\n');
                functionResult = `Your current motivators:\n${motivatorsList}`;
              } else {
                functionResult = 'You don\'t have any motivators yet. Would you like me to create some for you?';
              }
            }
            break;

          case 'update_motivator':
            console.log('Updating motivator with args:', functionArgs);
            const updateData: any = {};
            if (functionArgs.title) updateData.title = functionArgs.title;
            if (functionArgs.content) updateData.content = functionArgs.content;
            if (functionArgs.category) updateData.category = functionArgs.category;
            
            const { data: updatedMotivator, error: updateError } = await supabase
              .from('motivators')
              .update(updateData)
              .eq('id', functionArgs.motivator_id)
              .eq('user_id', userId)
              .select()
              .single();
            
            if (updateError) {
              functionResult = `Error updating motivator: ${updateError.message}`;
            } else if (updatedMotivator) {
              functionResult = `Updated motivator: "${updatedMotivator.title}"`;
            } else {
              functionResult = 'Motivator not found or you don\'t have permission to update it.';
            }
            break;

          case 'delete_motivator':
            console.log('Deleting motivator with args:', functionArgs);
            const { data: deletedMotivator, error: deleteError } = await supabase
              .from('motivators')
              .update({ is_active: false })
              .eq('id', functionArgs.motivator_id)
              .eq('user_id', userId)
              .select('title')
              .single();
            
            if (deleteError) {
              functionResult = `Error deleting motivator: ${deleteError.message}`;
            } else if (deletedMotivator) {
              functionResult = `Deleted motivator: "${deletedMotivator.title}"`;
            } else {
              functionResult = 'Motivator not found or you don\'t have permission to delete it.';
            }
            break;

          case 'start_walking_session':
            if (functionArgs.confirm) {
              console.log('Starting walking session');
              const { data: session, error: sessionError } = await supabase
                .from('walking_sessions')
                .insert([{
                  user_id: userId,
                  start_time: new Date().toISOString(),
                  status: 'active'
                }])
                .select()
                .single();
              
              if (sessionError) {
                functionResult = `Error starting walking session: ${sessionError.message}`;
              } else {
                functionResult = `Walking session started successfully! Have a great walk!`;
              }
            } else {
              functionResult = 'Walking session not started - user declined';
            }
            break;

          case 'add_food_entry':
            console.log('Adding food entry with args:', functionArgs);
            
            // FIXED: Handle multiple food entries
            if (functionArgs.foods && Array.isArray(functionArgs.foods)) {
              // Multiple food entries
              const results = [];
              for (const food of functionArgs.foods) {
                const { data, error } = await supabase
                  .from('food_entries')
                  .insert([{
                    user_id: userId,
                    name: food.name,
                    calories: food.calories,
                    carbs: food.carbs,
                    serving_size: food.serving_size || 100,
                    consumed: food.consumed || false
                  }])
                  .select()
                  .single();
                
                if (error) {
                  console.error('Error adding food entry:', error);
                  results.push({ name: food.name, success: false, error: error.message });
                } else {
                  results.push({ name: food.name, success: true, data });
                }
              }
              
              const successCount = results.filter(r => r.success).length;
              const totalCount = functionArgs.foods.length;
              functionResult = `Added ${successCount}/${totalCount} foods to your log`;
              
              if (successCount < totalCount) {
                const failedFoods = results.filter(r => !r.success).map(r => r.name).join(', ');
                functionResult += `. Failed to add: ${failedFoods}`;
              }
            } else {
              // Single food entry (legacy support)
              const { data: foodEntry, error: foodError } = await supabase
                .from('food_entries')
                .insert([{
                  user_id: userId,
                  name: functionArgs.name,
                  calories: functionArgs.calories,
                  carbs: functionArgs.carbs,
                  serving_size: functionArgs.serving_size || 100,
                  consumed: functionArgs.consumed || false
                }])
                .select()
                .single();
              
              if (foodError) {
                functionResult = `Error adding food entry: ${foodError.message}`;
              } else {
                functionResult = `Food logged successfully: ${functionArgs.name} (${functionArgs.calories} calories, ${functionArgs.carbs}g carbs)`;
              }
            }
            break;

          case 'toggle_food_consumption':
            console.log('Toggling food consumption with args:', functionArgs);
            // Find today's food entry by name
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const { data: foodEntries, error: findError } = await supabase
              .from('food_entries')
              .select('id, name, consumed')
              .eq('user_id', userId)
              .eq('name', functionArgs.food_name)
              .gte('created_at', today.toISOString())
              .lt('created_at', tomorrow.toISOString())
              .order('created_at', { ascending: false })
              .limit(1);

            if (findError || !foodEntries || foodEntries.length === 0) {
              functionResult = `Food entry "${functionArgs.food_name}" not found in today's log.`;
            } else {
              const { data: updatedEntry, error: updateError } = await supabase
                .from('food_entries')
                .update({ consumed: functionArgs.consumed })
                .eq('id', foodEntries[0].id)
                .select()
                .single();

              if (updateError) {
                functionResult = `Error updating food entry: ${updateError.message}`;
              } else {
                const status = functionArgs.consumed ? 'eaten' : 'logged only';
                functionResult = `Updated "${functionArgs.food_name}" - marked as ${status}`;
              }
            }
            break;

          case 'delete_food_entry':
            console.log('Deleting food entry with args:', functionArgs);
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date(todayStart);
            todayEnd.setDate(todayEnd.getDate() + 1);

            const { data: entriesToDelete, error: findDeleteError } = await supabase
              .from('food_entries')
              .select('id, name')
              .eq('user_id', userId)
              .eq('name', functionArgs.food_name)
              .gte('created_at', todayStart.toISOString())
              .lt('created_at', todayEnd.toISOString())
              .order('created_at', { ascending: false })
              .limit(1);

            if (findDeleteError || !entriesToDelete || entriesToDelete.length === 0) {
              functionResult = `Food entry "${functionArgs.food_name}" not found in today's log.`;
            } else {
              const { error: deleteError } = await supabase
                .from('food_entries')
                .delete()
                .eq('id', entriesToDelete[0].id);

              if (deleteError) {
                functionResult = `Error deleting food entry: ${deleteError.message}`;
              } else {
                functionResult = `Deleted "${functionArgs.food_name}" from your food log.`;
              }
            }
            break;

          case 'get_user_profile':
            // Get user profile and current stats
            const { data: profile } = await supabase
              .from('profiles')
              .select('weight, height, age, daily_calorie_goal, daily_carb_goal')
              .eq('user_id', userId)
              .single();
            
            // Get today's food entries
            const profileToday = new Date();
            profileToday.setHours(0, 0, 0, 0);
            const profileTomorrow = new Date(profileToday);
            profileTomorrow.setDate(profileTomorrow.getDate() + 1);

            const { data: todayFood } = await supabase
              .from('food_entries')
              .select('calories, carbs')
              .eq('user_id', userId)
              .gte('created_at', profileToday.toISOString())
              .lt('created_at', profileTomorrow.toISOString());

            const todayCalories = todayFood?.reduce((sum, entry) => sum + entry.calories, 0) || 0;
            const todayCarbs = todayFood?.reduce((sum, entry) => sum + entry.carbs, 0) || 0;

            // Get active walking session
            const { data: walkingSession } = await supabase
              .from('walking_sessions')
              .select('*')
              .eq('user_id', userId)
              .eq('status', 'active')
              .single();

            // Get today's walking stats
            const { data: todayWalking } = await supabase
              .from('walking_sessions')
              .select('start_time, end_time, calories_burned, distance')
              .eq('user_id', userId)
              .eq('status', 'completed')
              .gte('start_time', profileToday.toISOString())
              .lt('start_time', profileTomorrow.toISOString());

            const todayWalkingStats = todayWalking?.reduce(
              (acc, session) => {
                const duration = session.end_time && session.start_time
                  ? Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60))
                  : 0;
                
                return {
                  minutes: acc.minutes + duration,
                  calories: acc.calories + (session.calories_burned || 0),
                  distance: acc.distance + (session.distance || 0),
                };
              },
              { minutes: 0, calories: 0, distance: 0 }
            ) || { minutes: 0, calories: 0, distance: 0 };

            // Get weekly walking stats
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            
            const { data: weeklyWalking } = await supabase
              .from('walking_sessions')
              .select('start_time, end_time, calories_burned, distance')
              .eq('user_id', userId)
              .eq('status', 'completed')
              .gte('start_time', startOfWeek.toISOString());

            const weeklyWalkingStats = weeklyWalking?.reduce(
              (acc, session) => {
                const duration = session.end_time && session.start_time
                  ? Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60))
                  : 0;
                
                return {
                  minutes: acc.minutes + duration,
                  calories: acc.calories + (session.calories_burned || 0),
                  distance: acc.distance + (session.distance || 0),
                };
              },
              { minutes: 0, calories: 0, distance: 0 }
            ) || { minutes: 0, calories: 0, distance: 0 };

            // Calculate BMR if profile exists
            let bmr = null;
            if (profile?.weight && profile?.height && profile?.age) {
              // Using Mifflin-St Jeor equation (assuming male, can be adjusted)
              bmr = Math.round(10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5);
            }

            functionResult = `Profile and stats:
**Profile:**
${profile?.weight ? `Weight: ${profile.weight} kg` : 'Weight: Not set'}
${profile?.height ? `Height: ${profile.height} cm` : 'Height: Not set'}
${profile?.age ? `Age: ${profile.age} years` : 'Age: Not set'}
${bmr ? `Estimated BMR: ${bmr} calories/day` : ''}

**Daily Goals:**
${profile?.daily_calorie_goal ? `Calorie Goal: ${profile.daily_calorie_goal} cal` : 'Calorie Goal: Not set'}
${profile?.daily_carb_goal ? `Carb Goal: ${profile.daily_carb_goal}g` : 'Carb Goal: Not set'}

**Today's Progress:**
Calories consumed: ${todayCalories} cal
Carbs consumed: ${todayCarbs}g
Walking: ${todayWalkingStats.minutes} minutes, ${todayWalkingStats.calories} cal burned, ${todayWalkingStats.distance.toFixed(1)} miles
${walkingSession ? 'Currently on a walk! 🚶‍♂️' : 'No active walking session'}

**Weekly Walking Stats:**
Total walking: ${weeklyWalkingStats.minutes} minutes
Calories burned: ${weeklyWalkingStats.calories} cal
Distance covered: ${weeklyWalkingStats.distance.toFixed(1)} miles
${weeklyWalkingStats.minutes >= 150 ? '✅ WHO weekly activity goal achieved!' : `${150 - weeklyWalkingStats.minutes} minutes left for weekly goal`}

**Calorie Balance:**
Net calories: ${todayCalories - todayWalkingStats.calories} (consumed - burned walking)
${!profile?.weight || !profile?.height || !profile?.age ? 
  'Consider updating your profile in Settings to get personalized recommendations!' : 
  bmr && profile?.daily_calorie_goal ? 
    `Daily balance: ${todayCalories - profile.daily_calorie_goal > 0 ? '+' : ''}${todayCalories - profile.daily_calorie_goal} from calorie goal` : 
    ''
}`;
            break;

          case 'update_user_profile':
            console.log('Updating user profile with args:', functionArgs);
            const updateData: any = {};
            
            if (functionArgs.weight !== undefined) updateData.weight = functionArgs.weight;
            if (functionArgs.height !== undefined) updateData.height = functionArgs.height;
            if (functionArgs.age !== undefined) updateData.age = functionArgs.age;
            if (functionArgs.daily_calorie_goal !== undefined) updateData.daily_calorie_goal = functionArgs.daily_calorie_goal;
            if (functionArgs.daily_carb_goal !== undefined) updateData.daily_carb_goal = functionArgs.daily_carb_goal;
            if (functionArgs.activity_level !== undefined) updateData.activity_level = functionArgs.activity_level;
            
            const { data: updatedProfile, error: profileUpdateError } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('user_id', userId)
              .select()
              .single();
            
            if (profileUpdateError) {
              functionResult = `Error updating profile: ${profileUpdateError.message}`;
            } else {
              const updates = Object.keys(updateData).join(', ');
              functionResult = `Profile updated successfully! Updated: ${updates}`;
            }
            break;

          case 'calculate_bmr':
            const { weight, height, age, gender } = functionArgs;
            
            // Mifflin-St Jeor equation
            let calculatedBmr;
            if (gender === 'male') {
              calculatedBmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5);
            } else {
              calculatedBmr = Math.round(10 * weight + 6.25 * height - 5 * age - 161);
            }

            functionResult = `BMR calculation for ${weight}kg, ${height}cm, ${age} years old, ${gender}:

**Basal Metabolic Rate (BMR): ${calculatedBmr} calories/day**

Daily calorie needs based on activity level:
- Sedentary (little/no exercise): ${Math.round(calculatedBmr * 1.2)} cal/day
- Light activity (1-3 days/week): ${Math.round(calculatedBmr * 1.375)} cal/day  
- Moderate activity (3-5 days/week): ${Math.round(calculatedBmr * 1.55)} cal/day
- Very active (6-7 days/week): ${Math.round(calculatedBmr * 1.725)} cal/day`;
            break;

          case 'get_food_entries':
            console.log('Getting food entries with args:', functionArgs);
            const entryDate = functionArgs.date ? new Date(functionArgs.date) : new Date();
            const daysBack = functionArgs.days_back || 0;
            
            const startDate = new Date(entryDate);
            startDate.setDate(startDate.getDate() - daysBack);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(entryDate);
            endDate.setHours(23, 59, 59, 999);
            
            const { data: foodEntries, error: foodEntriesError } = await supabase
              .from('food_entries')
              .select('*')
              .eq('user_id', userId)
              .gte('created_at', startDate.toISOString())
              .lte('created_at', endDate.toISOString())
              .order('created_at', { ascending: false });
              
            if (foodEntriesError) {
              functionResult = `Error retrieving food entries: ${foodEntriesError.message}`;
            } else if (!foodEntries || foodEntries.length === 0) {
              functionResult = `No food entries found for the specified date range.`;
            } else {
              const totalCalories = foodEntries.reduce((sum, entry) => sum + (entry.consumed ? entry.calories : 0), 0);
              const totalCarbs = foodEntries.reduce((sum, entry) => sum + (entry.consumed ? entry.carbs : 0), 0);
              
              let entriesList = foodEntries.map(entry => 
                `• ${entry.name}: ${entry.calories} cal, ${entry.carbs}g carbs ${entry.consumed ? '✅ eaten' : '📝 logged'}`
              ).join('\n');
              
              functionResult = `Food entries (${daysBack > 0 ? `last ${daysBack + 1} days` : 'today'}):\n\n${entriesList}\n\n**Totals consumed:** ${totalCalories} calories, ${totalCarbs}g carbs`;
            }
            break;

          case 'update_food_entry':
            console.log('Updating food entry with args:', functionArgs);
            const updateFoodDate = new Date();
            updateFoodDate.setHours(0, 0, 0, 0);
            const updateFoodEnd = new Date(updateFoodDate);
            updateFoodEnd.setDate(updateFoodEnd.getDate() + 1);

            const { data: foodToUpdate, error: findFoodError } = await supabase
              .from('food_entries')
              .select('id')
              .eq('user_id', userId)
              .eq('name', functionArgs.food_name)
              .gte('created_at', updateFoodDate.toISOString())
              .lt('created_at', updateFoodEnd.toISOString())
              .order('created_at', { ascending: false })
              .limit(1);

            if (findFoodError || !foodToUpdate || foodToUpdate.length === 0) {
              functionResult = `Food entry "${functionArgs.food_name}" not found in today's log.`;
            } else {
              const foodUpdateData: any = {};
              if (functionArgs.calories !== undefined) foodUpdateData.calories = functionArgs.calories;
              if (functionArgs.carbs !== undefined) foodUpdateData.carbs = functionArgs.carbs;
              if (functionArgs.serving_size !== undefined) foodUpdateData.serving_size = functionArgs.serving_size;
              
              const { error: updateFoodError } = await supabase
                .from('food_entries')
                .update(foodUpdateData)
                .eq('id', foodToUpdate[0].id);

              if (updateFoodError) {
                functionResult = `Error updating food entry: ${updateFoodError.message}`;
              } else {
                const updates = Object.keys(foodUpdateData).join(', ');
                functionResult = `Updated "${functionArgs.food_name}" - changed: ${updates}`;
              }
            }
            break;

          case 'get_walking_sessions':
            console.log('Getting walking sessions with args:', functionArgs);
            const walkingDaysBack = functionArgs.days_back || 7;
            const walkingStartDate = new Date();
            walkingStartDate.setDate(walkingStartDate.getDate() - walkingDaysBack);
            walkingStartDate.setHours(0, 0, 0, 0);
            
            const { data: walkingSessions, error: walkingError } = await supabase
              .from('walking_sessions')
              .select('*')
              .eq('user_id', userId)
              .gte('start_time', walkingStartDate.toISOString())
              .order('start_time', { ascending: false });
              
            if (walkingError) {
              functionResult = `Error retrieving walking sessions: ${walkingError.message}`;
            } else if (!walkingSessions || walkingSessions.length === 0) {
              functionResult = `No walking sessions found in the last ${walkingDaysBack} days.`;
            } else {
              const totalSessions = walkingSessions.length;
              const completedSessions = walkingSessions.filter(s => s.status === 'completed');
              const totalMinutes = completedSessions.reduce((sum, session) => {
                if (session.start_time && session.end_time) {
                  return sum + Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60));
                }
                return sum;
              }, 0);
              const totalCalories = completedSessions.reduce((sum, session) => sum + (session.calories_burned || 0), 0);
              const totalDistance = completedSessions.reduce((sum, session) => sum + (session.distance || 0), 0);
              
              functionResult = `Walking summary (last ${walkingDaysBack} days):
              
**Stats:**
- Sessions: ${completedSessions.length} completed, ${totalSessions - completedSessions.length} incomplete
- Total time: ${totalMinutes} minutes (${Math.round(totalMinutes / 60 * 10) / 10} hours)
- Calories burned: ${totalCalories} cal
- Distance: ${totalDistance.toFixed(1)} miles
- Average pace: ${totalDistance > 0 ? (totalMinutes / totalDistance).toFixed(1) : 'N/A'} min/mile

${walkingSessions.find(s => s.status === 'active') ? '🚶‍♂️ You have an active walking session!' : ''}`;
            }
            break;

          case 'end_walking_session':
            if (!functionArgs.confirm) {
              functionResult = 'Walking session not ended - user declined confirmation.';
              break;
            }
            
            console.log('Ending walking session');
            const { data: activeWalkingSession, error: findWalkingError } = await supabase
              .from('walking_sessions')
              .select('*')
              .eq('user_id', userId)
              .eq('status', 'active')
              .single();
              
            if (findWalkingError || !activeWalkingSession) {
              functionResult = 'No active walking session found to end.';
            } else {
              const endTime = new Date().toISOString();
              const durationMs = new Date(endTime).getTime() - new Date(activeWalkingSession.start_time).getTime();
              const durationMinutes = Math.floor(durationMs / (1000 * 60));
              
              // Calculate distance and calories (simplified calculation)
              const speedMph = activeWalkingSession.speed_mph || 3;
              const distance = (speedMph * durationMinutes) / 60;
              const caloriesBurned = Math.round(durationMinutes * 4.5); // Approximate
              
              const { error: endWalkingError } = await supabase
                .from('walking_sessions')
                .update({
                  end_time: endTime,
                  status: 'completed',
                  distance: distance,
                  calories_burned: caloriesBurned
                })
                .eq('id', activeWalkingSession.id);
                
              if (endWalkingError) {
                functionResult = `Error ending walking session: ${endWalkingError.message}`;
              } else {
                functionResult = `Great job! 🎉 Walking session completed:
- Duration: ${durationMinutes} minutes
- Distance: ${distance.toFixed(1)} miles  
- Calories burned: ${caloriesBurned} cal
- Average pace: ${(durationMinutes / distance).toFixed(1)} min/mile`;
              }
            }
            break;

          case 'pause_walking_session':
            console.log('Pausing walking session');
            const { data: walkingToPause, error: pauseFindError } = await supabase
              .from('walking_sessions')
              .select('*')
              .eq('user_id', userId)
              .eq('status', 'active')
              .eq('session_state', 'active')
              .single();
              
            if (pauseFindError || !walkingToPause) {
              functionResult = 'No active walking session found to pause.';
            } else {
              const { error: pauseError } = await supabase
                .from('walking_sessions')
                .update({
                  session_state: 'paused',
                  pause_start_time: new Date().toISOString()
                })
                .eq('id', walkingToPause.id);
                
              if (pauseError) {
                functionResult = `Error pausing walking session: ${pauseError.message}`;
              } else {
                functionResult = 'Walking session paused. Take a break! 🛑';
              }
            }
            break;

          case 'resume_walking_session':
            console.log('Resuming walking session');
            const { data: walkingToResume, error: resumeFindError } = await supabase
              .from('walking_sessions')
              .select('*')
              .eq('user_id', userId)
              .eq('status', 'active')
              .eq('session_state', 'paused')
              .single();
              
            if (resumeFindError || !walkingToResume) {
              functionResult = 'No paused walking session found to resume.';
            } else {
              // Calculate pause duration and add to total
              const pauseDuration = Math.floor((new Date().getTime() - new Date(walkingToResume.pause_start_time).getTime()) / 1000);
              const totalPauseDuration = (walkingToResume.total_pause_duration || 0) + pauseDuration;
              
              const { error: resumeError } = await supabase
                .from('walking_sessions')
                .update({
                  session_state: 'active',
                  pause_start_time: null,
                  total_pause_duration: totalPauseDuration
                })
                .eq('id', walkingToResume.id);
                
              if (resumeError) {
                functionResult = `Error resuming walking session: ${resumeError.message}`;
              } else {
                functionResult = 'Walking session resumed! Keep going! 🚶‍♂️';
              }
            }
            break;

          case 'update_walking_speed':
            console.log('Updating walking speed with args:', functionArgs);
            const { data: walkingToUpdate, error: speedFindError } = await supabase
              .from('walking_sessions')
              .select('*')
              .eq('user_id', userId)
              .eq('status', 'active')
              .single();
              
            if (speedFindError || !walkingToUpdate) {
              functionResult = 'No active walking session found to update speed.';
            } else {
              const { error: speedUpdateError } = await supabase
                .from('walking_sessions')
                .update({ speed_mph: functionArgs.speed_mph })
                .eq('id', walkingToUpdate.id);
                
              if (speedUpdateError) {
                functionResult = `Error updating walking speed: ${speedUpdateError.message}`;
              } else {
                functionResult = `Walking speed updated to ${functionArgs.speed_mph} mph! 🏃‍♂️`;
              }
            }
            break;

          case 'start_fasting_session':
            if (!functionArgs.confirm) {
              functionResult = 'Fasting session not started - user declined confirmation.';
              break;
            }
            
            console.log('Starting fasting session with args:', functionArgs);
            // Cancel any existing active fasting sessions
            await supabase
              .from('fasting_sessions')
              .update({ status: 'cancelled' })
              .eq('user_id', userId)
              .eq('status', 'active');
              
            const goalDurationSeconds = functionArgs.goal_hours * 3600;
            const { data: fastingSession, error: fastingError } = await supabase
              .from('fasting_sessions')
              .insert([{
                user_id: userId,
                start_time: new Date().toISOString(),
                goal_duration_seconds: goalDurationSeconds,
                status: 'active'
              }])
              .select()
              .single();
              
            if (fastingError) {
              functionResult = `Error starting fasting session: ${fastingError.message}`;
            } else {
              functionResult = `Fasting session started! 🕒 Goal: ${functionArgs.goal_hours} hours. You can do this!`;
            }
            break;

          case 'get_fasting_sessions':
            console.log('Getting fasting sessions with args:', functionArgs);
            const fastingDaysBack = functionArgs.days_back || 7;
            const fastingStartDate = new Date();
            fastingStartDate.setDate(fastingStartDate.getDate() - fastingDaysBack);
            
            const { data: fastingSessions, error: fastingSessionsError } = await supabase
              .from('fasting_sessions')
              .select('*')
              .eq('user_id', userId)
              .gte('start_time', fastingStartDate.toISOString())
              .order('start_time', { ascending: false });
              
            if (fastingSessionsError) {
              functionResult = `Error retrieving fasting sessions: ${fastingSessionsError.message}`;
            } else if (!fastingSessions || fastingSessions.length === 0) {
              functionResult = `No fasting sessions found in the last ${fastingDaysBack} days.`;
            } else {
              const activeFast = fastingSessions.find(s => s.status === 'active');
              const completedFasts = fastingSessions.filter(s => s.status === 'completed');
              const averageDuration = completedFasts.length > 0 
                ? Math.round(completedFasts.reduce((sum, fast) => sum + (fast.duration_seconds || 0), 0) / completedFasts.length / 3600 * 10) / 10
                : 0;
                
              let result = `Fasting summary (last ${fastingDaysBack} days):
              
**Stats:**
- Total fasts: ${fastingSessions.length}
- Completed: ${completedFasts.length}
- Average duration: ${averageDuration} hours
- Success rate: ${fastingSessions.length > 0 ? Math.round(completedFasts.length / fastingSessions.length * 100) : 0}%`;

              if (activeFast) {
                const currentDuration = Math.floor((Date.now() - new Date(activeFast.start_time).getTime()) / (1000 * 3600 * 100)) / 100;
                const goalHours = (activeFast.goal_duration_seconds || 0) / 3600;
                result += `\n\n🕒 **Currently fasting:** ${currentDuration} hours (goal: ${goalHours} hours)`;
              }
              
              functionResult = result;
            }
            break;

          case 'end_fasting_session':
            if (!functionArgs.confirm) {
              functionResult = 'Fasting session not ended - user declined confirmation.';
              break;
            }
            
            console.log('Ending fasting session');
            const { data: activeFastingSession, error: findFastingError } = await supabase
              .from('fasting_sessions')
              .select('*')
              .eq('user_id', userId)
              .eq('status', 'active')
              .single();
              
            if (findFastingError || !activeFastingSession) {
              functionResult = 'No active fasting session found to end.';
            } else {
              const endTime = new Date().toISOString();
              const durationSeconds = Math.floor((new Date(endTime).getTime() - new Date(activeFastingSession.start_time).getTime()) / 1000);
              const durationHours = Math.round(durationSeconds / 3600 * 100) / 100;
              const goalHours = (activeFastingSession.goal_duration_seconds || 0) / 3600;
              
              const { error: endFastingError } = await supabase
                .from('fasting_sessions')
                .update({
                  end_time: endTime,
                  status: 'completed',
                  duration_seconds: durationSeconds
                })
                .eq('id', activeFastingSession.id);
                
              if (endFastingError) {
                functionResult = `Error ending fasting session: ${endFastingError.message}`;
              } else {
                const goalAchieved = durationHours >= goalHours;
                functionResult = `Fasting session completed! 🎉
- Duration: ${durationHours} hours
- Goal: ${goalHours} hours
- ${goalAchieved ? '✅ Goal achieved!' : '📊 Progress made'}

Great job on your dedication to health!`;
              }
            }
            break;

          case 'cancel_fasting_session':
            console.log('Canceling fasting session with args:', functionArgs);
            const { data: fastingToCancel, error: cancelFindError } = await supabase
              .from('fasting_sessions')
              .select('*')
              .eq('user_id', userId)
              .eq('status', 'active')
              .single();
              
            if (cancelFindError || !fastingToCancel) {
              functionResult = 'No active fasting session found to cancel.';
            } else {
              const { error: cancelError } = await supabase
                .from('fasting_sessions')
                .update({ status: 'cancelled' })
                .eq('id', fastingToCancel.id);
                
              if (cancelError) {
                functionResult = `Error canceling fasting session: ${cancelError.message}`;
              } else {
                const reason = functionArgs.reason ? ` Reason: ${functionArgs.reason}` : '';
                functionResult = `Fasting session canceled.${reason} That's okay - every journey has its adjustments! 💪`;
              }
            }
            break;

          case 'suggest_ui_actions':
            console.log('Suggesting UI actions with args:', functionArgs);
            // Get current user state to provide contextual suggestions
            const { data: currentProfile } = await supabase
              .from('profiles')
              .select('weight, height, age, daily_calorie_goal')
              .eq('user_id', userId)
              .single();
              
            const { data: activeWalking } = await supabase
              .from('walking_sessions')
              .select('*')
              .eq('user_id', userId)
              .eq('status', 'active')
              .single();
              
            const { data: activeFasting } = await supabase
              .from('fasting_sessions')
              .select('*')
              .eq('user_id', userId)
              .eq('status', 'active')
              .single();
              
            let suggestions = "**Suggested actions based on your current state:**\n\n";
            
            if (!currentProfile?.weight || !currentProfile?.height || !currentProfile?.age) {
              suggestions += "📋 **Complete your profile** - Add weight, height, and age for personalized recommendations\n";
            }
            
            if (!currentProfile?.daily_calorie_goal) {
              suggestions += "🎯 **Set daily calorie goal** - Establish your nutrition targets\n";
            }
            
            if (activeWalking) {
              suggestions += "🚶‍♂️ **Active walking session** - You're currently walking! Consider pausing or ending when done\n";
            } else {
              suggestions += "👟 **Start a walk** - Great time for some physical activity\n";
            }
            
            if (activeFasting) {
              const fastingHours = Math.floor((Date.now() - new Date(activeFasting.start_time).getTime()) / (1000 * 3600 * 100)) / 100;
              suggestions += `🕒 **Currently fasting** - ${fastingHours} hours in. Stay strong!\n`;
            } else {
              suggestions += "🍽️ **Consider starting a fast** - Plan your next intermittent fasting session\n";
            }
            
            suggestions += "📊 **Review progress** - Check your nutrition and exercise stats\n";
            suggestions += "💪 **Browse motivators** - Get inspired with personalized content\n";
            
            functionResult = suggestions;
            break;

          case 'get_dashboard_insights':
            console.log('Getting dashboard insights');
            // Comprehensive dashboard with all user data
            const dashboardToday = new Date();
            dashboardToday.setHours(0, 0, 0, 0);
            const dashboardTomorrow = new Date(dashboardToday);
            dashboardTomorrow.setDate(dashboardTomorrow.getDate() + 1);
            
            // Get all relevant data in parallel
            const [profileResult, todayFoodResult, activeFastResult, activeWalkResult] = await Promise.all([
              supabase.from('profiles').select('*').eq('user_id', userId).single(),
              supabase.from('food_entries').select('*').eq('user_id', userId).gte('created_at', dashboardToday.toISOString()).lt('created_at', dashboardTomorrow.toISOString()),
              supabase.from('fasting_sessions').select('*').eq('user_id', userId).eq('status', 'active').single(),
              supabase.from('walking_sessions').select('*').eq('user_id', userId).eq('status', 'active').single()
            ]);
            
            let insights = "# 📊 Your Health Dashboard\n\n";
            
            // Profile completeness
            if (profileResult.data) {
              const p = profileResult.data;
              const completeness = [p.weight, p.height, p.age, p.daily_calorie_goal].filter(Boolean).length;
              insights += `**Profile:** ${completeness}/4 complete ${completeness === 4 ? '✅' : '⚠️'}\n`;
            }
            
            // Today's nutrition
            if (todayFoodResult.data) {
              const foods = todayFoodResult.data;
              const consumedCalories = foods.filter(f => f.consumed).reduce((sum, f) => sum + f.calories, 0);
              const loggedCalories = foods.reduce((sum, f) => sum + f.calories, 0);
              insights += `**Today's Nutrition:** ${consumedCalories} cal consumed, ${loggedCalories - consumedCalories} cal logged\n`;
            } else {
              insights += "**Today's Nutrition:** No food entries yet\n";
            }
            
            // Fasting status
            if (activeFastResult.data) {
              const fastingHours = Math.floor((Date.now() - new Date(activeFastResult.data.start_time).getTime()) / (1000 * 3600 * 100)) / 100;
              const goalHours = (activeFastResult.data.goal_duration_seconds || 0) / 3600;
              insights += `**Fasting:** 🕒 ${fastingHours}h / ${goalHours}h (${Math.round(fastingHours / goalHours * 100)}%)\n`;
            } else {
              insights += "**Fasting:** Not currently fasting\n";
            }
            
            // Walking status
            if (activeWalkResult.data) {
              const walkingMinutes = Math.floor((Date.now() - new Date(activeWalkResult.data.start_time).getTime()) / (1000 * 60));
              insights += `**Walking:** 🚶‍♂️ Active session - ${walkingMinutes} minutes\n`;
            } else {
              insights += "**Walking:** No active session\n";
            }
            
            insights += "\n**Recommendations:**\n";
            if (!profileResult.data?.weight) insights += "• Complete your profile for personalized insights\n";
            if (!todayFoodResult.data?.length) insights += "• Log your first meal of the day\n";
            if (!activeFastResult.data && !activeWalkResult.data) insights += "• Start a fasting session or walking session\n";
            
            functionResult = insights;
            break;

          case 'create_daily_plan':
            console.log('Creating daily plan with args:', functionArgs);
            const focus = functionArgs.focus || 'balance';
            
            // Get user data for personalized planning
            const { data: planProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', userId)
              .single();
              
            let plan = `# 🎯 Your Personalized Daily Plan (${focus.toUpperCase()} Focus)\n\n`;
            
            const currentHour = new Date().getHours();
            
            if (focus === 'fasting' || focus === 'balance') {
              plan += "## 🕒 Fasting Schedule\n";
              if (currentHour < 12) {
                plan += "- **Morning:** Continue/start intermittent fast\n";
                plan += "- **Afternoon:** Break fast around 12-2 PM with balanced meal\n";
                plan += "- **Evening:** Last meal by 8 PM\n";
              } else {
                plan += "- **Now:** Consider starting evening fast after last meal\n";
                plan += "- **Tomorrow:** Aim for 16:8 intermittent fasting\n";
              }
              plan += "\n";
            }
            
            if (focus === 'exercise' || focus === 'balance') {
              plan += "## 🚶‍♂️ Exercise Plan\n";
              plan += "- **Walking:** 30 minutes at moderate pace\n";
              plan += "- **Target:** 150+ minutes weekly (WHO recommendation)\n";
              if (planProfile?.weight) {
                plan += `- **Estimated burn:** ~${Math.round(30 * 4.5)} calories for 30min walk\n`;
              }
              plan += "\n";
            }
            
            if (focus === 'nutrition' || focus === 'balance') {
              plan += "## 🍽️ Nutrition Goals\n";
              if (planProfile?.daily_calorie_goal) {
                plan += `- **Calorie target:** ${planProfile.daily_calorie_goal} calories\n`;
              } else {
                plan += "- **Set calorie goal** for personalized targets\n";
              }
              if (planProfile?.daily_carb_goal) {
                plan += `- **Carb target:** ${planProfile.daily_carb_goal}g\n`;
              }
              plan += "- **Focus:** Whole foods, adequate protein, healthy fats\n";
              plan += "\n";
            }
            
            plan += "## ✅ Action Items\n";
            plan += "1. Track all food intake in the app\n";
            plan += "2. Complete at least one walking session\n";
            plan += "3. Stay hydrated throughout the day\n";
            plan += "4. Check in with your progress before bed\n";
            plan += "\n*This plan is generated based on your current profile and goals.*";
            
            functionResult = plan;
            break;

          case 'save_admin_note':
            if (!isAdmin) {
              functionResult = 'Error: Admin access required for this function';
              break;
            }
            
            console.log('Saving admin note with args:', functionArgs);
            const noteData = {
              content: functionArgs.content,
              category: functionArgs.category,
              priority: functionArgs.priority,
              timestamp: new Date().toISOString(),
              user_id: userId
            };
            
            // Create a unique key for this note
            const noteKey = `admin_note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const { error: noteError } = await supabase
              .from('shared_settings')
              .insert([{
                setting_key: noteKey,
                setting_value: JSON.stringify(noteData)
              }]);
            
            if (noteError) {
              functionResult = `Error saving admin note: ${noteError.message}`;
            } else {
              functionResult = `Admin note saved successfully!\n\n**Category:** ${functionArgs.category}\n**Priority:** ${functionArgs.priority}\n**Content:** ${functionArgs.content}\n\nNote ID: ${noteKey}`;
            }
            break;

          case 'get_admin_notes':
            if (!isAdmin) {
              functionResult = 'Error: Admin access required for this function';
              break;
            }
            
            console.log('Retrieving admin notes with args:', functionArgs);
            const { data: notes, error: notesError } = await supabase
              .from('shared_settings')
              .select('setting_key, setting_value')
              .like('setting_key', 'admin_note_%');
            
            if (notesError) {
              functionResult = `Error retrieving admin notes: ${notesError.message}`;
              break;
            }
            
            if (!notes || notes.length === 0) {
              functionResult = 'No admin notes found.';
              break;
            }
            
            // Parse and filter notes
            const parsedNotes = notes.map(note => {
              try {
                const data = JSON.parse(note.setting_value);
                return {
                  id: note.setting_key,
                  ...data
                };
              } catch (e) {
                return null;
              }
            }).filter(Boolean);
            
            // Filter by category if specified
            const categoryFilter = functionArgs.category || 'all';
            const filteredNotes = categoryFilter === 'all' 
              ? parsedNotes 
              : parsedNotes.filter(note => note.category === categoryFilter);
            
            if (filteredNotes.length === 0) {
              functionResult = `No admin notes found for category: ${categoryFilter}`;
              break;
            }
            
            // Sort by priority and timestamp
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            filteredNotes.sort((a, b) => {
              const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
              if (priorityDiff !== 0) return priorityDiff;
              return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });
            
            // Format notes for display
            let notesDisplay = `## Admin Notes Summary ${categoryFilter !== 'all' ? `(${categoryFilter})` : ''}\n\n`;
            notesDisplay += `**Total Notes:** ${filteredNotes.length}\n\n`;
            
            // Group by category and priority
            const categories = ['bug', 'improvement', 'feature', 'observation', 'general'];
            const priorities = ['critical', 'high', 'medium', 'low'];
            
            categories.forEach(cat => {
              const categoryNotes = filteredNotes.filter(note => note.category === cat);
              if (categoryNotes.length > 0) {
                notesDisplay += `### ${cat.toUpperCase()} (${categoryNotes.length} notes)\n\n`;
                
                priorities.forEach(pri => {
                  const priorityNotes = categoryNotes.filter(note => note.priority === pri);
                  if (priorityNotes.length > 0) {
                    notesDisplay += `**${pri.toUpperCase()} Priority:**\n`;
                    priorityNotes.forEach((note, index) => {
                      const date = new Date(note.timestamp).toLocaleDateString();
                      notesDisplay += `${index + 1}. ${note.content} *(${date})*\n`;
                    });
                    notesDisplay += '\n';
                  }
                });
              }
            });
            
            notesDisplay += `\n**Next Steps:**\n`;
            notesDisplay += `- Critical/High priority items should be addressed first\n`;
            notesDisplay += `- Consider grouping related improvements for efficient implementation\n`;
            notesDisplay += `- Review and test each bug fix thoroughly\n`;
            notesDisplay += `- Update user documentation for new features\n\n`;
            notesDisplay += `*Use "save this to admin notes" to add new observations while testing.*`;
            
            functionResult = notesDisplay;
            break;

          default:
            console.error('Unknown function called:', message_response.function_call.name);
            functionResult = `I'm not sure how to handle "${message_response.function_call.name}". Could you please rephrase your request? 

I have comprehensive abilities to help you with:

**Profile & Health Data:**
• Get and update your profile information
• Calculate BMR and calorie needs
• Track your progress and stats

**Food & Nutrition:**
• Add, update, delete, and track food entries
• Get nutrition history and insights
• Mark foods as consumed or just logged

**Walking & Exercise:**
• Start, pause, resume, and end walking sessions
• Get walking history and statistics
• Update walking speed during sessions

**Fasting:**
• Start, end, and cancel fasting sessions
• Get fasting history and progress
• Track fasting goals and achievements

**Motivation & Guidance:**
• Create and manage personalized motivators
• Get contextual suggestions and recommendations
• Generate daily health plans

**Smart Assistance:**
• Provide UI action suggestions
• Generate dashboard insights
• Create personalized daily plans

${isAdmin ? '**Admin Functions:**\n• Save and retrieve development notes\n• Track app improvements and observations' : ''}

What would you like me to help you with?`;
            break;
        }

        // Track usage if not using own API key
        if (!profile?.use_own_api_key) {
          console.log('Updating monthly AI requests count');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              monthly_ai_requests: (profile?.monthly_ai_requests || 0) + 1 
            })
            .eq('user_id', userId);
          
          if (updateError) {
            console.error('Error updating usage count:', updateError);
          }
        }

        return new Response(
          JSON.stringify({ 
            completion: message_response.content || functionResult,
            functionCall: {
              name: message_response.function_call.name,
              arguments: functionArgs,
              result: functionResult
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );

      } catch (parseError) {
        console.error('Error parsing function arguments:', parseError);
        return new Response(
          JSON.stringify({ 
            completion: "I tried to help, but there was an error processing the function call.",
            error: "Function call parsing failed"
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
    }

    const completion = message_response.content;
    console.log('Regular completion received');

    // Track usage if not using own API key
    if (!profile?.use_own_api_key) {
      console.log('Updating monthly AI requests count');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          monthly_ai_requests: (profile?.monthly_ai_requests || 0) + 1 
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Error updating usage count:', updateError);
      }
    }

    console.log('Chat completion successful');
    return new Response(
      JSON.stringify({ completion }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in chat-completion function:', error);
    let statusCode = 500;
    let errorMessage = 'An unexpected error occurred';

    if (error.message.includes('not authenticated')) {
      statusCode = 401;
      errorMessage = 'Authentication required';
    } else if (error.message.includes('API key')) {
      statusCode = 400;
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode 
      }
    );
  }
});

// Helper function to provide user-friendly function feedback
function getFriendlyFunctionFeedback(functionName: string, result: any): string {
  const feedbackMap: Record<string, string> = {
    'create_motivator': '💪 New motivator created successfully!',
    'get_user_motivators': `📋 Retrieved ${typeof result === 'string' && result.includes('motivators:') ? 'your' : '0'} motivators.`,
    'update_motivator': '✅ Motivator updated successfully!',
    'delete_motivator': '🗑️ Motivator removed successfully!',
    'start_walking_session': '🚶 Walking session started! Have a great walk!',
    'add_food_entry': '🍽️ Food entry added to your tracking!',
    'toggle_food_consumption': '✅ Food consumption status updated!',
    'delete_food_entry': '🗑️ Food entry removed from your log!',
    'get_user_profile': '👤 Profile information retrieved.',
    'calculate_bmr': '🔥 BMR calculated successfully!'
  };
  
  return feedbackMap[functionName] || `✅ ${typeof result === 'string' ? result : 'Action completed successfully!'}`;
}

// Helper function to provide specific error guidance
function getFunctionErrorGuidance(functionName: string, error: any): string {
  const errorGuidanceMap: Record<string, string> = {
    'create_motivator': "I couldn't create the motivator. Please try again with different content or check if you have the necessary permissions.",
    'get_user_motivators': "I couldn't retrieve your motivators. Please check your connection and try again.",
    'update_motivator': "I couldn't update the motivator. Please make sure it exists and you have permission to edit it.",
    'delete_motivator': "I couldn't delete the motivator. Please verify it exists and you have permission to remove it.",
    'start_walking_session': "I couldn't start your walking session. Please check if you already have an active session or try again.",
    'add_food_entry': "I couldn't add the food entry. Please make sure all required information is provided and try again.",
    'toggle_food_consumption': "I couldn't update the food consumption status. Please check if the food entry exists.",
    'delete_food_entry': "I couldn't remove the food entry. Please verify it exists in your log.",
    'get_user_profile': "I couldn't retrieve your profile. Please check your login status and try again.",
    'calculate_bmr': "I couldn't calculate your BMR. Please ensure all required information (weight, height, age, gender) is provided."
  };
  
  return errorGuidanceMap[functionName] || "I apologize, but I encountered an error while trying to help you. Please try again or rephrase your request.";
}