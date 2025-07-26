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

    // Enhanced system prompt with functions
    const systemPrompt = `You are a helpful AI companion for a health and wellness app focused on intermittent fasting, walking, and nutrition tracking.

Current user context: The user is using an app that helps them track fasting periods, walking sessions, and food intake.

You have access to the following functions to help users:
1. create_motivator - Create personalized motivational content
2. start_walking_session - Start a walking session for the user
3. add_food_entry - Add a food entry to the user's log

You can help users with:
- Fasting guidance and motivation
- Starting and tracking walking sessions
- Adding food entries to their log
- Creating personalized motivational content
- General nutrition advice and goal setting

When users mention starting a walk or wanting to go for a walk, offer to start a walking session for them.
When users provide food information or ask to log food, offer to add it to their food log.
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
        description: 'Create a personalized motivational message for the user',
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
        name: 'get_user_profile',
        description: 'Get user\'s profile information including goals, BMR, and current stats',
        parameters: {
          type: 'object',
          properties: {},
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

    // Send to OpenAI Chat Completions API
    console.log('Sending request to OpenAI');
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
      
      try {
        const functionArgs = JSON.parse(message_response.function_call.arguments);
        let functionResult = null;

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
              functionResult = `Created motivator: "${functionArgs.title}"`;
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
                functionResult = `Walking session started! Session ID: ${session.id}`;
              }
            } else {
              functionResult = 'Walking session not started - user declined';
            }
            break;

          case 'add_food_entry':
            console.log('Adding food entry with args:', functionArgs);
            const { data: foodEntry, error: foodError } = await supabase
              .from('food_entries')
              .insert([{
                user_id: userId,
                name: functionArgs.name,
                calories: functionArgs.calories,
                carbs: functionArgs.carbs,
                serving_size: functionArgs.serving_size
              }])
              .select()
              .single();
            
            if (foodError) {
              functionResult = `Error adding food entry: ${foodError.message}`;
            } else {
              functionResult = `Added food entry: ${functionArgs.name} (${functionArgs.calories} calories, ${functionArgs.carbs}g carbs)`;
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
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const { data: todayFood } = await supabase
              .from('food_entries')
              .select('calories, carbs')
              .eq('user_id', userId)
              .gte('created_at', today.toISOString())
              .lt('created_at', tomorrow.toISOString());

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
              .gte('start_time', today.toISOString())
              .lt('start_time', tomorrow.toISOString());

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

          default:
            functionResult = `Unknown function: ${message_response.function_call.name}`;
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
            completion: message_response.content || `I've executed the ${message_response.function_call.name} function. ${functionResult}`,
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