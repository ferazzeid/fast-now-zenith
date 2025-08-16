import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting daily template application process...')

    // Get all users with daily reset enabled and who have template foods
    const { data: usersWithTemplates, error: usersError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        enable_daily_reset,
        daily_food_templates (
          id,
          name,
          calories,
          carbs,
          serving_size,
          image_url,
          sort_order
        )
      `)
      .eq('enable_daily_reset', true)

    if (usersError) {
      console.error('Error fetching users with templates:', usersError)
      throw usersError
    }

    console.log(`Found ${usersWithTemplates?.length || 0} users with daily reset enabled`)

    let processedUsers = 0
    let successfulApplications = 0

    for (const user of usersWithTemplates || []) {
      try {
        // Skip users without template foods
        if (!user.daily_food_templates || user.daily_food_templates.length === 0) {
          console.log(`User ${user.user_id} has no template foods, skipping...`)
          continue
        }

        console.log(`Processing user ${user.user_id} with ${user.daily_food_templates.length} template foods`)

        // Get today's date in UTC (we'll handle timezone logic below)
        const today = new Date().toISOString().split('T')[0]

        // Check if we've already applied templates today for this user
        const { data: existingEntries } = await supabase
          .from('food_entries')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('source_date', today)
          .limit(1)

        // If user already has entries for today, check if they were created recently (within last 2 hours)
        // This prevents re-applying templates if user already has food logged today
        if (existingEntries && existingEntries.length > 0) {
          const { data: recentEntries } = await supabase
            .from('food_entries')
            .select('created_at')
            .eq('user_id', user.user_id)
            .eq('source_date', today)
            .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
            .limit(1)

          if (recentEntries && recentEntries.length > 0) {
            console.log(`User ${user.user_id} already has recent entries for today, skipping...`)
            continue
          }
        }

        // Clear existing entries for today
        await supabase
          .from('food_entries')
          .delete()
          .eq('user_id', user.user_id)
          .eq('source_date', today)

        // Apply template foods
        const templateFoodEntries = user.daily_food_templates.map((template: any) => ({
          name: template.name,
          calories: template.calories,
          carbs: template.carbs,
          serving_size: template.serving_size,
          image_url: template.image_url,
          user_id: user.user_id,
          consumed: false,
          source_date: today
        }))

        const { error: insertError } = await supabase
          .from('food_entries')
          .insert(templateFoodEntries)

        if (insertError) {
          console.error(`Error applying template for user ${user.user_id}:`, insertError)
          continue
        }

        console.log(`Successfully applied template for user ${user.user_id}`)
        successfulApplications++

      } catch (userError) {
        console.error(`Error processing user ${user.user_id}:`, userError)
      }
      
      processedUsers++
    }

    console.log(`Daily template application completed. Processed: ${processedUsers}, Successful: ${successfulApplications}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Daily templates applied successfully`,
        stats: {
          totalUsersProcessed: processedUsers,
          successfulApplications: successfulApplications
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in apply-daily-templates function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})