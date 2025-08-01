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

    // Enhanced system prompt with functions
    const systemPrompt = `You are a helpful AI companion for a health and wellness app focused on intermittent fasting, walking, and nutrition tracking.

Current user context: The user is using an app that helps them track fasting periods, walking sessions, and food intake.

Response Length: ${lengthInstruction}

CRITICAL MOTIVATOR RULE: When users mention wanting motivation, motivators, inspiration, or quotes:
- IMMEDIATELY ask "What motivational message would you like me to create?" 
- Then use create_motivator function with their response
- Do NOT ask about categories first - choose automatically based on context
- Default to 'general' category if unclear

You have access to the following functions to help users:
1. create_motivator - Create personalized motivational content (USE IMMEDIATELY when users want motivation)
2. get_user_motivators - View all your motivational content
3. update_motivator - Edit existing motivational content  
4. delete_motivator - Remove motivational content
5. start_walking_session - Start a walking session for the user
6. add_food_entry - Add a food entry to the user's log
7. update_profile - Update user profile (weight, height, age, goals)
8. get_user_profile - Get user profile information
${isAdmin ? '9. save_admin_note - Save notes about bugs, improvements, or observations (admin only)\n10. get_admin_notes - Retrieve all saved admin notes (admin only)' : ''}

You can help users with:
- Fasting guidance and motivation
- Starting and tracking walking sessions
- Adding food entries to their log
- Updating profile information (weight, height, age, calorie/carb goals)
- Getting current profile information and calculating BMR
- Creating, viewing, editing, and managing personalized motivational content
- General nutrition advice and goal setting
${isAdmin ? '- Saving development notes and feedback (admin only)\n- Retrieving saved notes for review (admin only)' : ''}

When users mention starting a walk or wanting to go for a walk, offer to start a walking session for them.
When users provide food information or ask to log food, offer to add it to their food log.
When users provide profile information like weight, height, age, or goals, use the update_profile function to save it.
${isAdmin ? 'When users say things like "save this to admin notes", "note for later", "add to notes", or similar phrases, use the save_admin_note function.\nWhen users ask to "show admin notes", "review notes", or "what notes do we have", use the get_admin_notes function.' : ''}
Be supportive, encouraging, and provide practical advice. Keep responses concise but helpful.

Important: Always ask for confirmation before taking actions like starting walking sessions or adding food entries.`;

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

    // Enhanced function definitions for the AI
    const functions = [
      {
        name: 'create_motivator',
        description: 'Create a personalized motivational message for the user. ALWAYS use this when users mention motivation, inspiration, quotes, or motivational content.',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'A short, inspiring title for the motivator'
            },
            content: {
              type: 'string', 
              description: 'The motivational message content'
            },
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
        description: 'Get all active motivators for the user',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'update_motivator',
        description: 'Update an existing motivator',
        parameters: {
          type: 'object',
          properties: {
            motivator_id: {
              type: 'string',
              description: 'ID of the motivator to update'
            },
            title: {
              type: 'string',
              description: 'New title for the motivator'
            },
            content: {
              type: 'string',
              description: 'New content for the motivator'
            },
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
        description: 'Delete a motivator',
        parameters: {
          type: 'object',
          properties: {
            motivator_id: {
              type: 'string',
              description: 'ID of the motivator to delete'
            }
          },
          required: ['motivator_id']
        }
      },
      {
        name: 'start_walking_session',
        description: 'Start a walking session for the user',
        parameters: {
          type: 'object',
          properties: {
            confirm: {
              type: 'boolean',
              description: 'Confirmation that the user wants to start walking'
            }
          },
          required: ['confirm']
        }
      },
      {
        name: 'add_food_entry',
        description: 'Add a food item to the user\'s nutrition log',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the food item'
            },
            calories: {
              type: 'number',
              description: 'Total calories for this serving'
            },
            carbs: {
              type: 'number', 
              description: 'Total carbs in grams for this serving'
            },
            serving_size: {
              type: 'number',
              description: 'Serving size in grams'
            }
          },
          required: ['name', 'calories', 'carbs', 'serving_size']
        }
      },
      {
        name: 'toggle_food_consumption',
        description: 'Mark a food entry as eaten or just logged',
        parameters: {
          type: 'object',
          properties: {
            food_name: {
              type: 'string',
              description: 'Name of the food item to toggle'
            },
            consumed: {
              type: 'boolean',
              description: 'true to mark as eaten, false to mark as just logged'
            }
          },
          required: ['food_name', 'consumed']
        }
      },
      {
        name: 'delete_food_entry',
        description: 'Remove a food entry from the user\'s log',
        parameters: {
          type: 'object',
          properties: {
            food_name: {
              type: 'string',
              description: 'Name of the food item to delete'
            }
          },
          required: ['food_name']
        }
      },
      {
        name: 'get_user_profile',
        description: 'Get user\'s profile information including goals, BMR, and current stats',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'update_profile',
        description: 'Update user profile information like weight, height, age, and goals',
        parameters: {
          type: 'object',
          properties: {
            weight: { type: 'number', description: 'Weight in kg' },
            height: { type: 'number', description: 'Height in cm' },
            age: { type: 'number', description: 'Age in years' },
            daily_calorie_goal: { type: 'number', description: 'Daily calorie goal' },
            daily_carb_goal: { type: 'number', description: 'Daily carb goal in grams' }
          },
          required: []
        }
      },
      {
        name: 'calculate_bmr',
        description: 'Calculate user\'s Basal Metabolic Rate based on their profile',
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

          case 'update_profile':
            console.log('Updating user profile with args:', functionArgs);
            
            // Build update object from provided parameters
            const profileUpdateData: any = {};
            if (functionArgs.weight !== undefined) profileUpdateData.weight = functionArgs.weight;
            if (functionArgs.height !== undefined) profileUpdateData.height = functionArgs.height;
            if (functionArgs.age !== undefined) profileUpdateData.age = functionArgs.age;
            if (functionArgs.daily_calorie_goal !== undefined) profileUpdateData.daily_calorie_goal = functionArgs.daily_calorie_goal;
            if (functionArgs.daily_carb_goal !== undefined) profileUpdateData.daily_carb_goal = functionArgs.daily_carb_goal;
            
            if (Object.keys(profileUpdateData).length === 0) {
              functionResult = 'No profile data provided to update.';
            } else {
              const { data: updatedProfile, error: profileUpdateError } = await supabase
                .from('profiles')
                .update(profileUpdateData)
                .eq('user_id', userId)
                .select()
                .single();
              
              if (profileUpdateError) {
                functionResult = `Error updating profile: ${profileUpdateError.message}`;
              } else {
                const updatedFields = Object.keys(profileUpdateData).map(key => {
                  const value = profileUpdateData[key];
                  switch(key) {
                    case 'weight': return `Weight: ${value}kg`;
                    case 'height': return `Height: ${value}cm`;
                    case 'age': return `Age: ${value} years`;
                    case 'daily_calorie_goal': return `Daily calorie goal: ${value} cal`;
                    case 'daily_carb_goal': return `Daily carb goal: ${value}g`;
                    default: return `${key}: ${value}`;
                  }
                }).join(', ');
                
                functionResult = `Profile updated successfully! Updated: ${updatedFields}`;
              }
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
            functionResult = `I'm not sure how to handle "${message_response.function_call.name}". Could you please rephrase your request? I can help with:
            
• Creating and managing motivational content
• Starting walking sessions  
• Adding food entries
• Getting user profile information
${isAdmin ? '• Saving and retrieving admin notes' : ''}

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
    'update_profile': '✅ Profile updated successfully!',
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
    'update_profile': "I couldn't update your profile. Please check the information provided and try again.",
    'calculate_bmr': "I couldn't calculate your BMR. Please ensure all required information (weight, height, age, gender) is provided."
  };
  
  return errorGuidanceMap[functionName] || "I apologize, but I encountered an error while trying to help you. Please try again or rephrase your request.";
}