import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-openai-api-key',
};

// Enhanced logging utility
const logWithTimestamp = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
};

// Enhanced error handling utility
const handleError = (error: any, context: string) => {
  logWithTimestamp('ERROR', `${context}: ${error.message}`, error);
  return {
    success: false,
    error: error.message,
    context,
    timestamp: new Date().toISOString()
  };
};

// Rate limiting utility (simple in-memory cache)
const rateLimitCache = new Map();
const isRateLimited = (userId: string, limit = 60, windowMs = 60000) => {
  const now = Date.now();
  const userKey = `${userId}_${Math.floor(now / windowMs)}`;
  const current = rateLimitCache.get(userKey) || 0;
  
  if (current >= limit) {
    return true;
  }
  
  rateLimitCache.set(userKey, current + 1);
  // Clean old entries
  for (const [key, _] of rateLimitCache) {
    if (key.split('_')[1] < Math.floor((now - windowMs) / windowMs)) {
      rateLimitCache.delete(key);
    }
  }
  
  return false;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId = 'anonymous';
  
  try {
    logWithTimestamp('INFO', 'Chat completion request received');
    const { message, conversationHistory = [] } = await req.json();
    
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message provided');
    }

    // Initialize Supabase client with enhanced configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://texnkijwcygodtywgedm.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration not available');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Enhanced user authentication
    const authHeader = req.headers.get('Authorization');
    logWithTimestamp('DEBUG', 'Auth header present:', !!authHeader);
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    logWithTimestamp('DEBUG', 'User authentication result:', { success: !!userData.user, error: userError?.message });
    
    if (userError || !userData.user) {
      throw new Error('User not authenticated');
    }

    userId = userData.user.id;

    // Rate limiting check
    if (isRateLimited(userId)) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    // Get user profile with caching consideration
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      logWithTimestamp('WARN', 'Profile fetch error:', profileError);
    }

    // Check admin status
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();
    
    const isAdmin = !!userRole;

    // Enhanced API key management
    let OPENAI_API_KEY;
    const clientApiKey = req.headers.get('X-OpenAI-API-Key');
    
    if (profile?.use_own_api_key && profile?.openai_api_key) {
      OPENAI_API_KEY = profile.openai_api_key;
      logWithTimestamp('DEBUG', 'Using user OpenAI API key from profile');
    } else if (clientApiKey) {
      OPENAI_API_KEY = clientApiKey;
      logWithTimestamp('DEBUG', 'Using client OpenAI API key');
    } else {
      OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not provided');
      }
      logWithTimestamp('DEBUG', 'Using system OpenAI API key');
    }

    // Get AI response length setting with caching
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

    // Enhanced system prompt
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

**FOOD & NUTRITION:**
4. add_food_entry - Add food items to nutrition log
5. get_food_entries - Get user's food entries for any date range
6. update_food_entry - Modify existing food entries
7. delete_food_entry - Remove food entries
8. toggle_food_consumption - Mark foods as eaten/logged

**WALKING & EXERCISE:**
9. start_walking_session - Begin a walking session
10. get_walking_sessions - Get walking history and statistics
11. end_walking_session - Complete current walking session
12. pause_walking_session - Pause current walking session
13. resume_walking_session - Resume paused walking session
14. update_walking_speed - Adjust walking pace during session

**FASTING:**
15. start_fasting_session - Begin a fasting period
16. get_fasting_sessions - Get fasting history and current status
17. end_fasting_session - Complete current fast
18. cancel_fasting_session - Cancel current fast

**MOTIVATORS & GUIDANCE:**
19. create_motivator - Create personalized motivational content
20. get_user_motivators - View all motivational content
21. update_motivator - Edit existing motivational content
22. delete_motivator - Remove motivational content

**UI & NAVIGATION:**
23. suggest_ui_actions - Recommend interface actions based on user state
24. get_dashboard_insights - Generate dashboard content and recommendations

${isAdmin ? '**ADMIN FUNCTIONS:**\n25. save_admin_note - Save development notes and observations\n26. get_admin_notes - Retrieve saved admin notes' : ''}

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

    // Enhanced function definitions
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
            current_context: { type: 'string', description: 'Current page or context user is in' }
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
      }
    ];

    // Add admin functions if user is admin
    if (isAdmin) {
      functions.push(
        {
          name: 'save_admin_note',
          description: 'Save development notes and observations',
          parameters: {
            type: 'object',
            properties: {
              note: { type: 'string', description: 'The admin note to save' },
              category: { type: 'string', description: 'Category for the note' }
            },
            required: ['note']
          }
        },
        {
          name: 'get_admin_notes',
          description: 'Retrieve saved admin notes',
          parameters: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Filter by category (optional)' }
            },
            required: []
          }
        }
      );
    }

    // Enhanced OpenAI API call with retry logic
    let openAIResponse;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        logWithTimestamp('DEBUG', `OpenAI API call attempt ${retryCount + 1}`);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
            messages,
            functions,
            function_call: 'auto',
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
        }

        openAIResponse = await response.json();
        break; // Success, exit retry loop
        
      } catch (error) {
        retryCount++;
        logWithTimestamp('WARN', `OpenAI API call failed (attempt ${retryCount}):`, error.message);
        
        if (retryCount >= maxRetries) {
          throw new Error(`OpenAI API failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    const completion = openAIResponse.choices[0].message;
    let functionResult = '';

    // Enhanced function execution with proper error handling
    if (completion.function_call) {
      const functionName = completion.function_call.name;
      let functionArgs;

      try {
        functionArgs = JSON.parse(completion.function_call.arguments);
        logWithTimestamp('INFO', `Executing function: ${functionName}`, functionArgs);
      } catch (error) {
        logWithTimestamp('ERROR', 'Failed to parse function arguments:', error);
        functionResult = 'Error: Invalid function arguments provided';
      }

      if (functionArgs) {
        try {
          // Execute the appropriate function with enhanced error handling
          switch (functionName) {
            case 'get_user_profile':
              const { data: profileData, error: getProfileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

              if (getProfileError) {
                functionResult = `Error retrieving profile: ${getProfileError.message}`;
              } else if (!profileData) {
                functionResult = 'No profile found. Please complete your profile first.';
              } else {
                const profileInfo = [
                  profileData.weight ? `Weight: ${profileData.weight}kg` : 'Weight: Not set',
                  profileData.height ? `Height: ${profileData.height}cm` : 'Height: Not set',
                  profileData.age ? `Age: ${profileData.age} years` : 'Age: Not set',
                  profileData.daily_calorie_goal ? `Daily calorie goal: ${profileData.daily_calorie_goal}` : 'Calorie goal: Not set',
                  profileData.daily_carb_goal ? `Daily carb goal: ${profileData.daily_carb_goal}g` : 'Carb goal: Not set',
                  profileData.activity_level ? `Activity level: ${profileData.activity_level}` : 'Activity level: Not set'
                ].join('\n');
                
                functionResult = `**Your Profile:**\n${profileInfo}`;
              }
              break;

            case 'update_user_profile':
              const updateData: any = {};
              if (functionArgs.weight !== undefined) updateData.weight = functionArgs.weight;
              if (functionArgs.height !== undefined) updateData.height = functionArgs.height;
              if (functionArgs.age !== undefined) updateData.age = functionArgs.age;
              if (functionArgs.daily_calorie_goal !== undefined) updateData.daily_calorie_goal = functionArgs.daily_calorie_goal;
              if (functionArgs.daily_carb_goal !== undefined) updateData.daily_carb_goal = functionArgs.daily_carb_goal;
              if (functionArgs.activity_level !== undefined) updateData.activity_level = functionArgs.activity_level;

              const { error: updateProfileError } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('user_id', userId);

              if (updateProfileError) {
                functionResult = `Error updating profile: ${updateProfileError.message}`;
              } else {
                const updates = Object.keys(updateData).join(', ');
                functionResult = `Profile updated successfully! Updated: ${updates}`;
              }
              break;

            case 'calculate_bmr':
              const { weight, height, age, gender } = functionArgs;
              let bmr;
              
              if (gender.toLowerCase() === 'male') {
                bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
              } else {
                bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
              }
              
              const activityMultipliers = {
                sedentary: 1.2,
                light: 1.375,
                moderate: 1.55,
                active: 1.725,
                very_active: 1.9
              };
              
              const tdeeResults = Object.entries(activityMultipliers).map(([level, multiplier]) => 
                `${level}: ${Math.round(bmr * multiplier)} calories`
              ).join('\n');
              
              functionResult = `**BMR Calculation:**\nBasal Metabolic Rate: ${Math.round(bmr)} calories/day\n\n**TDEE by Activity Level:**\n${tdeeResults}`;
              break;

            case 'add_food_entry':
              const { name, calories, carbs, serving_size, consumed = false } = functionArgs;
              
              const { error: addFoodError } = await supabase
                .from('food_entries')
                .insert({
                  user_id: userId,
                  name,
                  calories,
                  carbs,
                  serving_size,
                  consumed
                });

              if (addFoodError) {
                functionResult = `Error adding food entry: ${addFoodError.message}`;
              } else {
                functionResult = `Added "${name}" to your food log: ${calories} calories, ${carbs}g carbs (${serving_size}g serving) - ${consumed ? 'marked as eaten' : 'logged for tracking'}`;
              }
              break;

            case 'get_food_entries':
              const entryDate = functionArgs.date ? new Date(functionArgs.date) : new Date();
              const daysBack = functionArgs.days_back || 0;
              
              const startDate = new Date(entryDate);
              startDate.setDate(startDate.getDate() - daysBack);
              startDate.setHours(0, 0, 0, 0);
              
              const endDate = new Date(entryDate);
              endDate.setHours(23, 59, 59, 999);
              
              const { data: entriesData, error: foodEntriesError } = await supabase
                .from('food_entries')
                .select('*')
                .eq('user_id', userId)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: false });
                
              if (foodEntriesError) {
                functionResult = `Error retrieving food entries: ${foodEntriesError.message}`;
              } else if (!entriesData || entriesData.length === 0) {
                functionResult = `No food entries found for the specified date range.`;
              } else {
                const totalCalories = entriesData.reduce((sum, entry) => sum + (entry.consumed ? entry.calories : 0), 0);
                const totalCarbs = entriesData.reduce((sum, entry) => sum + (entry.consumed ? entry.carbs : 0), 0);
                
                const entriesList = entriesData.map(entry => 
                  `• ${entry.name}: ${entry.calories} cal, ${entry.carbs}g carbs ${entry.consumed ? '✅ eaten' : '📝 logged'}`
                ).join('\n');
                
                functionResult = `Food entries (${daysBack > 0 ? `last ${daysBack + 1} days` : 'today'}):\n\n${entriesList}\n\n**Totals consumed:** ${totalCalories} calories, ${totalCarbs}g carbs`;
              }
              break;

            case 'update_food_entry':
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

            case 'delete_food_entry':
              const deleteFoodDate = new Date();
              deleteFoodDate.setHours(0, 0, 0, 0);
              const deleteFoodEnd = new Date(deleteFoodDate);
              deleteFoodEnd.setDate(deleteFoodEnd.getDate() + 1);

              const { data: foodToDelete, error: findDeleteError } = await supabase
                .from('food_entries')
                .select('id')
                .eq('user_id', userId)
                .eq('name', functionArgs.food_name)
                .gte('created_at', deleteFoodDate.toISOString())
                .lt('created_at', deleteFoodEnd.toISOString())
                .order('created_at', { ascending: false })
                .limit(1);

              if (findDeleteError || !foodToDelete || foodToDelete.length === 0) {
                functionResult = `Food entry "${functionArgs.food_name}" not found in today's log.`;
              } else {
                const { error: deleteFoodError } = await supabase
                  .from('food_entries')
                  .delete()
                  .eq('id', foodToDelete[0].id);

                if (deleteFoodError) {
                  functionResult = `Error deleting food entry: ${deleteFoodError.message}`;
                } else {
                  functionResult = `Deleted "${functionArgs.food_name}" from your food log.`;
                }
              }
              break;

            case 'toggle_food_consumption':
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);

              const { data: toggleEntries, error: findError } = await supabase
                .from('food_entries')
                .select('id, name, consumed')
                .eq('user_id', userId)
                .eq('name', functionArgs.food_name)
                .gte('created_at', today.toISOString())
                .lt('created_at', tomorrow.toISOString())
                .order('created_at', { ascending: false })
                .limit(1);

              if (findError || !toggleEntries || toggleEntries.length === 0) {
                functionResult = `Food entry "${functionArgs.food_name}" not found in today's log.`;
              } else {
                const { error: toggleError } = await supabase
                  .from('food_entries')
                  .update({ consumed: functionArgs.consumed })
                  .eq('id', toggleEntries[0].id);

                if (toggleError) {
                  functionResult = `Error updating food consumption: ${toggleError.message}`;
                } else {
                  functionResult = `Marked "${functionArgs.food_name}" as ${functionArgs.consumed ? 'eaten ✅' : 'logged only 📝'}`;
                }
              }
              break;

            case 'start_walking_session':
              if (!functionArgs.confirm) {
                functionResult = 'Please confirm that you want to start a walking session.';
                break;
              }

              // Check for active session
              const { data: activeWalkingSession } = await supabase
                .from('walking_sessions')
                .select('*')
                .eq('user_id', userId)
                .is('ended_at', null)
                .single();

              if (activeWalkingSession) {
                functionResult = 'You already have an active walking session. Please end it first or use resume_walking_session.';
              } else {
                const speed = functionArgs.speed_mph || 3.0;
                const { error: walkingError } = await supabase
                  .from('walking_sessions')
                  .insert({
                    user_id: userId,
                    speed_mph: speed,
                    started_at: new Date().toISOString()
                  });

                if (walkingError) {
                  functionResult = `Error starting walking session: ${walkingError.message}`;
                } else {
                  functionResult = `🚶‍♀️ Walking session started! Speed: ${speed} mph. Good luck on your walk!`;
                }
              }
              break;

            case 'get_walking_sessions':
              const walkingDaysBack = functionArgs.days_back || 7;
              const walkingStartDate = new Date();
              walkingStartDate.setDate(walkingStartDate.getDate() - walkingDaysBack);

              const { data: walkingSessions, error: walkingSessionsError } = await supabase
                .from('walking_sessions')
                .select('*')
                .eq('user_id', userId)
                .gte('started_at', walkingStartDate.toISOString())
                .order('started_at', { ascending: false });

              if (walkingSessionsError) {
                functionResult = `Error retrieving walking sessions: ${walkingSessionsError.message}`;
              } else if (!walkingSessions || walkingSessions.length === 0) {
                functionResult = `No walking sessions found in the last ${walkingDaysBack} days.`;
              } else {
                const activeSession = walkingSessions.find(session => !session.ended_at);
                let sessionsList = walkingSessions.map(session => {
                  const duration = session.ended_at 
                    ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000)
                    : Math.round((new Date().getTime() - new Date(session.started_at).getTime()) / 60000);
                  const status = session.ended_at ? '✅ completed' : '🔄 active';
                  const distance = session.distance_miles ? ` - ${session.distance_miles.toFixed(2)} miles` : '';
                  const calories = session.calories_burned ? ` - ${session.calories_burned} cal` : '';
                  return `• ${new Date(session.started_at).toLocaleDateString()}: ${duration} min ${status}${distance}${calories}`;
                }).join('\n');

                functionResult = `Walking sessions (last ${walkingDaysBack} days):\n\n${sessionsList}`;
                if (activeSession) {
                  functionResult += `\n\n**Active session:** Started ${new Date(activeSession.started_at).toLocaleTimeString()}`;
                }
              }
              break;

            case 'end_walking_session':
              if (!functionArgs.confirm) {
                functionResult = 'Please confirm that you want to end your walking session.';
                break;
              }

              const { data: currentWalkingSession, error: findWalkingError } = await supabase
                .from('walking_sessions')
                .select('*')
                .eq('user_id', userId)
                .is('ended_at', null)
                .single();

              if (findWalkingError || !currentWalkingSession) {
                functionResult = 'No active walking session found.';
              } else {
                const endTime = new Date();
                const startTime = new Date(currentWalkingSession.started_at);
                const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
                const distanceMiles = (currentWalkingSession.speed_mph * durationMinutes / 60);
                
                // Simple calorie calculation (roughly 0.4 calories per minute per mph for walking)
                const caloriesBurned = Math.round(durationMinutes * currentWalkingSession.speed_mph * 0.4);

                const { error: endWalkingError } = await supabase
                  .from('walking_sessions')
                  .update({
                    ended_at: endTime.toISOString(),
                    duration_minutes: Math.round(durationMinutes),
                    distance_miles: distanceMiles,
                    calories_burned: caloriesBurned
                  })
                  .eq('id', currentWalkingSession.id);

                if (endWalkingError) {
                  functionResult = `Error ending walking session: ${endWalkingError.message}`;
                } else {
                  functionResult = `🎉 Walking session completed!\n\nDuration: ${Math.round(durationMinutes)} minutes\nDistance: ${distanceMiles.toFixed(2)} miles\nCalories burned: ${caloriesBurned}\nGreat job!`;
                }
              }
              break;

            case 'pause_walking_session':
              const { data: walkingSessionToPause, error: pauseWalkingError } = await supabase
                .from('walking_sessions')
                .select('*')
                .eq('user_id', userId)
                .is('ended_at', null)
                .single();

              if (pauseWalkingError || !walkingSessionToPause) {
                functionResult = 'No active walking session found to pause.';
              } else {
                const { error: updatePauseError } = await supabase
                  .from('walking_sessions')
                  .update({ is_paused: true, paused_at: new Date().toISOString() })
                  .eq('id', walkingSessionToPause.id);

                if (updatePauseError) {
                  functionResult = `Error pausing walking session: ${updatePauseError.message}`;
                } else {
                  functionResult = '⏸️ Walking session paused. Take a rest and resume when ready!';
                }
              }
              break;

            case 'resume_walking_session':
              const { data: walkingSessionToResume, error: resumeWalkingError } = await supabase
                .from('walking_sessions')
                .select('*')
                .eq('user_id', userId)
                .is('ended_at', null)
                .eq('is_paused', true)
                .single();

              if (resumeWalkingError || !walkingSessionToResume) {
                functionResult = 'No paused walking session found to resume.';
              } else {
                const { error: updateResumeError } = await supabase
                  .from('walking_sessions')
                  .update({ is_paused: false, paused_at: null })
                  .eq('id', walkingSessionToResume.id);

                if (updateResumeError) {
                  functionResult = `Error resuming walking session: ${updateResumeError.message}`;
                } else {
                  functionResult = '▶️ Walking session resumed! Keep going, you\'re doing great!';
                }
              }
              break;

            case 'update_walking_speed':
              const { data: walkingSessionToUpdate, error: updateSpeedError } = await supabase
                .from('walking_sessions')
                .select('*')
                .eq('user_id', userId)
                .is('ended_at', null)
                .single();

              if (updateSpeedError || !walkingSessionToUpdate) {
                functionResult = 'No active walking session found to update speed.';
              } else {
                const { error: speedUpdateError } = await supabase
                  .from('walking_sessions')
                  .update({ speed_mph: functionArgs.speed_mph })
                  .eq('id', walkingSessionToUpdate.id);

                if (speedUpdateError) {
                  functionResult = `Error updating walking speed: ${speedUpdateError.message}`;
                } else {
                  functionResult = `🚶‍♀️ Walking speed updated to ${functionArgs.speed_mph} mph`;
                }
              }
              break;

            case 'start_fasting_session':
              if (!functionArgs.confirm) {
                functionResult = 'Please confirm that you want to start a fasting session.';
                break;
              }

              // Check for active fasting session
              const { data: activeFastingSession } = await supabase
                .from('fasting_sessions')
                .select('*')
                .eq('user_id', userId)
                .is('ended_at', null)
                .single();

              if (activeFastingSession) {
                functionResult = 'You already have an active fasting session. Please end it first.';
              } else {
                const { error: fastingError } = await supabase
                  .from('fasting_sessions')
                  .insert({
                    user_id: userId,
                    goal_hours: functionArgs.goal_hours,
                    started_at: new Date().toISOString()
                  });

                if (fastingError) {
                  functionResult = `Error starting fasting session: ${fastingError.message}`;
                } else {
                  functionResult = `🕐 Fasting session started! Goal: ${functionArgs.goal_hours} hours. You've got this!`;
                }
              }
              break;

            case 'get_fasting_sessions':
              const fastingDaysBack = functionArgs.days_back || 7;
              const fastingStartDate = new Date();
              fastingStartDate.setDate(fastingStartDate.getDate() - fastingDaysBack);

              const { data: fastingSessions, error: fastingSessionsError } = await supabase
                .from('fasting_sessions')
                .select('*')
                .eq('user_id', userId)
                .gte('started_at', fastingStartDate.toISOString())
                .order('started_at', { ascending: false });

              if (fastingSessionsError) {
                functionResult = `Error retrieving fasting sessions: ${fastingSessionsError.message}`;
              } else if (!fastingSessions || fastingSessions.length === 0) {
                functionResult = `No fasting sessions found in the last ${fastingDaysBack} days.`;
              } else {
                const activeFastingSession = fastingSessions.find(session => !session.ended_at);
                let fastingSessionsList = fastingSessions.map(session => {
                  const duration = session.ended_at 
                    ? (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 3600000
                    : (new Date().getTime() - new Date(session.started_at).getTime()) / 3600000;
                  const status = session.ended_at ? '✅ completed' : '🔄 active';
                  const goalStatus = session.goal_hours ? ` (goal: ${session.goal_hours}h)` : '';
                  return `• ${new Date(session.started_at).toLocaleDateString()}: ${duration.toFixed(1)}h ${status}${goalStatus}`;
                }).join('\n');

                functionResult = `Fasting sessions (last ${fastingDaysBack} days):\n\n${fastingSessionsList}`;
                if (activeFastingSession) {
                  const currentDuration = (new Date().getTime() - new Date(activeFastingSession.started_at).getTime()) / 3600000;
                  functionResult += `\n\n**Active session:** ${currentDuration.toFixed(1)} hours of ${activeFastingSession.goal_hours} hours`;
                }
              }
              break;

            case 'end_fasting_session':
              if (!functionArgs.confirm) {
                functionResult = 'Please confirm that you want to end your fasting session.';
                break;
              }

              const { data: currentFastingSession, error: findFastingError } = await supabase
                .from('fasting_sessions')
                .select('*')
                .eq('user_id', userId)
                .is('ended_at', null)
                .single();

              if (findFastingError || !currentFastingSession) {
                functionResult = 'No active fasting session found.';
              } else {
                const endTime = new Date();
                const startTime = new Date(currentFastingSession.started_at);
                const durationHours = (endTime.getTime() - startTime.getTime()) / 3600000;

                const { error: endFastingError } = await supabase
                  .from('fasting_sessions')
                  .update({
                    ended_at: endTime.toISOString(),
                    actual_hours: durationHours
                  })
                  .eq('id', currentFastingSession.id);

                if (endFastingError) {
                  functionResult = `Error ending fasting session: ${endFastingError.message}`;
                } else {
                  const goalReached = durationHours >= currentFastingSession.goal_hours;
                  functionResult = `🎉 Fasting session completed!\n\nDuration: ${durationHours.toFixed(1)} hours\nGoal: ${currentFastingSession.goal_hours} hours\n${goalReached ? '✅ Goal achieved! Excellent work!' : '📝 Good effort! Every fast is progress.'}`;
                }
              }
              break;

            case 'cancel_fasting_session':
              const { data: fastingSessionToCancel, error: cancelFastingError } = await supabase
                .from('fasting_sessions')
                .select('*')
                .eq('user_id', userId)
                .is('ended_at', null)
                .single();

              if (cancelFastingError || !fastingSessionToCancel) {
                functionResult = 'No active fasting session found to cancel.';
              } else {
                const { error: deleteFastingError } = await supabase
                  .from('fasting_sessions')
                  .delete()
                  .eq('id', fastingSessionToCancel.id);

                if (deleteFastingError) {
                  functionResult = `Error canceling fasting session: ${deleteFastingError.message}`;
                } else {
                  const reason = functionArgs.reason ? ` Reason: ${functionArgs.reason}` : '';
                  functionResult = `Fasting session canceled.${reason} Remember, it's okay to listen to your body!`;
                }
              }
              break;

            case 'create_motivator':
              const { title, content, category } = functionArgs;
              const { error: createMotivatorError } = await supabase
                .from('motivators')
                .insert({
                  user_id: userId,
                  title,
                  content,
                  category
                });

              if (createMotivatorError) {
                functionResult = `Error creating motivator: ${createMotivatorError.message}`;
              } else {
                functionResult = `✨ Motivator created successfully!\n\n**${title}**\n${content}\n\nCategory: ${category}`;
              }
              break;

            case 'get_user_motivators':
              const categoryFilter = functionArgs.category;
              let motivatorQuery = supabase
                .from('motivators')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

              if (categoryFilter) {
                motivatorQuery = motivatorQuery.eq('category', categoryFilter);
              }

              const { data: motivators, error: motivatorsError } = await motivatorQuery;

              if (motivatorsError) {
                functionResult = `Error retrieving motivators: ${motivatorsError.message}`;
              } else if (!motivators || motivators.length === 0) {
                functionResult = categoryFilter 
                  ? `No motivators found in the ${categoryFilter} category.`
                  : 'No motivators found. Create your first motivator to get started!';
              } else {
                const motivatorsList = motivators.map(motivator => 
                  `**${motivator.title}**\n${motivator.content}\n*Category: ${motivator.category}*`
                ).join('\n\n---\n\n');
                
                functionResult = `Your motivators${categoryFilter ? ` (${categoryFilter})` : ''}:\n\n${motivatorsList}`;
              }
              break;

            case 'update_motivator':
              const motivatorUpdateData: any = {};
              if (functionArgs.title !== undefined) motivatorUpdateData.title = functionArgs.title;
              if (functionArgs.content !== undefined) motivatorUpdateData.content = functionArgs.content;
              if (functionArgs.category !== undefined) motivatorUpdateData.category = functionArgs.category;

              const { error: updateMotivatorError } = await supabase
                .from('motivators')
                .update(motivatorUpdateData)
                .eq('id', functionArgs.motivator_id)
                .eq('user_id', userId);

              if (updateMotivatorError) {
                functionResult = `Error updating motivator: ${updateMotivatorError.message}`;
              } else {
                const updates = Object.keys(motivatorUpdateData).join(', ');
                functionResult = `Motivator updated successfully! Changed: ${updates}`;
              }
              break;

            case 'delete_motivator':
              const { error: deleteMotivatorError } = await supabase
                .from('motivators')
                .delete()
                .eq('id', functionArgs.motivator_id)
                .eq('user_id', userId);

              if (deleteMotivatorError) {
                functionResult = `Error deleting motivator: ${deleteMotivatorError.message}`;
              } else {
                functionResult = 'Motivator deleted successfully.';
              }
              break;

            case 'suggest_ui_actions':
              // Get user's current data to make suggestions
              const { data: currentProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

              const { data: todayFood } = await supabase
                .from('food_entries')
                .select('*')
                .eq('user_id', userId)
                .gte('created_at', new Date().toISOString().split('T')[0])
                .lt('created_at', new Date(Date.now() + 86400000).toISOString().split('T')[0]);

              const { data: activeSession } = await supabase
                .from('fasting_sessions')
                .select('*')
                .eq('user_id', userId)
                .is('ended_at', null)
                .single();

              let suggestions = [];

              if (!currentProfile?.weight || !currentProfile?.height) {
                suggestions.push('📋 Complete your profile to get personalized recommendations');
              }

              if (!todayFood || todayFood.length === 0) {
                suggestions.push('🍎 Log your first meal in the Food Tracking section');
              }

              if (!activeSession) {
                suggestions.push('⏰ Start a fasting session to track your progress');
              }

              suggestions.push('🚶‍♀️ Try the Walking timer for active recovery');
              suggestions.push('💪 Create a personal motivator for inspiration');
              suggestions.push('📊 Check your dashboard for daily insights');

              functionResult = `**Suggested actions:**\n\n${suggestions.map(s => `• ${s}`).join('\n')}`;
              break;

            case 'get_dashboard_insights':
              // Gather comprehensive user data for insights
              const { data: dashboardProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

              const todayStart = new Date();
              todayStart.setHours(0, 0, 0, 0);
              const todayEnd = new Date();
              todayEnd.setHours(23, 59, 59, 999);

              const { data: todayFoodEntries } = await supabase
                .from('food_entries')
                .select('*')
                .eq('user_id', userId)
                .gte('created_at', todayStart.toISOString())
                .lte('created_at', todayEnd.toISOString());

              const { data: currentFast } = await supabase
                .from('fasting_sessions')
                .select('*')
                .eq('user_id', userId)
                .is('ended_at', null)
                .single();

              let insights = ['**Today\'s Dashboard:**\n'];

              // Food insights
              if (todayFoodEntries && todayFoodEntries.length > 0) {
                const totalCals = todayFoodEntries.reduce((sum, entry) => sum + (entry.consumed ? entry.calories : 0), 0);
                const totalCarbs = todayFoodEntries.reduce((sum, entry) => sum + (entry.consumed ? entry.carbs : 0), 0);
                insights.push(`🍎 **Nutrition:** ${totalCals} calories, ${totalCarbs}g carbs consumed`);
                
                if (dashboardProfile?.daily_calorie_goal) {
                  const remaining = dashboardProfile.daily_calorie_goal - totalCals;
                  insights.push(`📊 **Goal progress:** ${remaining > 0 ? `${remaining} calories remaining` : `${Math.abs(remaining)} calories over goal`}`);
                }
              } else {
                insights.push('🍎 **Nutrition:** No food logged today');
              }

              // Fasting insights
              if (currentFast) {
                const fastingHours = (new Date().getTime() - new Date(currentFast.started_at).getTime()) / 3600000;
                const progress = (fastingHours / currentFast.goal_hours) * 100;
                insights.push(`⏰ **Fasting:** ${fastingHours.toFixed(1)}/${currentFast.goal_hours}h (${progress.toFixed(1)}%)`);
              } else {
                insights.push('⏰ **Fasting:** No active fast');
              }

              // Profile completeness
              if (dashboardProfile) {
                const profileFields = ['weight', 'height', 'age', 'daily_calorie_goal'];
                const completedFields = profileFields.filter(field => dashboardProfile[field]).length;
                const completeness = (completedFields / profileFields.length) * 100;
                insights.push(`👤 **Profile:** ${completeness.toFixed(0)}% complete`);
              }

              functionResult = insights.join('\n');
              break;

            // Admin functions
            case 'save_admin_note':
              if (!isAdmin) {
                functionResult = 'Admin access required for this function.';
                break;
              }

              const { error: saveNoteError } = await supabase
                .from('admin_notes')
                .insert({
                  user_id: userId,
                  note: functionArgs.note,
                  category: functionArgs.category || 'general'
                });

              if (saveNoteError) {
                functionResult = `Error saving admin note: ${saveNoteError.message}`;
              } else {
                functionResult = 'Admin note saved successfully.';
              }
              break;

            case 'get_admin_notes':
              if (!isAdmin) {
                functionResult = 'Admin access required for this function.';
                break;
              }

              let adminNotesQuery = supabase
                .from('admin_notes')
                .select('*')
                .order('created_at', { ascending: false });

              if (functionArgs.category) {
                adminNotesQuery = adminNotesQuery.eq('category', functionArgs.category);
              }

              const { data: adminNotes, error: adminNotesError } = await adminNotesQuery;

              if (adminNotesError) {
                functionResult = `Error retrieving admin notes: ${adminNotesError.message}`;
              } else if (!adminNotes || adminNotes.length === 0) {
                functionResult = 'No admin notes found.';
              } else {
                const notesList = adminNotes.map(note => 
                  `**${new Date(note.created_at).toLocaleDateString()}** (${note.category})\n${note.note}`
                ).join('\n\n---\n\n');
                
                functionResult = `Admin notes:\n\n${notesList}`;
              }
              break;

            default:
              functionResult = `Unknown function: ${functionName}`;
              logWithTimestamp('ERROR', `Unknown function called: ${functionName}`);
          }

        } catch (error) {
          logWithTimestamp('ERROR', `Function execution error for ${functionName}:`, error);
          functionResult = `Error executing ${functionName}: ${error.message}`;
        }
      }

      // Track usage
      try {
        await supabase.rpc('track_usage_event', {
          _user_id: userId,
          _event_type: functionName || 'chat_completion',
          _requests_count: 1
        });
      } catch (trackingError) {
        logWithTimestamp('WARN', 'Usage tracking failed:', trackingError);
      }

      // Return function result
      const duration = Date.now() - startTime;
      logWithTimestamp('INFO', `Request completed in ${duration}ms`);
      
      return new Response(JSON.stringify({ 
        content: completion.content || functionResult,
        function_result: functionResult,
        processing_time: duration
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // No function call, return the completion
    const duration = Date.now() - startTime;
    logWithTimestamp('INFO', `Request completed in ${duration}ms`);
    
    return new Response(JSON.stringify({ 
      content: completion.content,
      processing_time: duration
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorResponse = handleError(error, 'Chat completion request');
    
    logWithTimestamp('ERROR', `Request failed after ${duration}ms for user ${userId}:`, error);
    
    return new Response(JSON.stringify({
      error: errorResponse.error,
      context: errorResponse.context,
      processing_time: duration
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});