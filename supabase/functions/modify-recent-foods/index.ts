import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { modifications, clarification_text } = await req.json();
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user.user) {
      throw new Error('Invalid user token');
    }

    const userId = user.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    console.log('🔍 Looking for recent food entries to modify...');
    console.log('Modifications:', modifications);
    console.log('Clarification:', clarification_text);

    // Get today's food entries (within last 2 hours to be recent)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const { data: recentEntries, error: entriesError } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('source_date', today)
      .gte('created_at', twoHoursAgo)
      .order('created_at', { ascending: false });

    if (entriesError) {
      console.error('Error fetching recent entries:', entriesError);
      throw new Error('Failed to fetch recent food entries');
    }

    console.log(`Found ${recentEntries?.length || 0} recent entries`);

    if (!recentEntries || recentEntries.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: "I couldn't find any recent food entries to modify. Food entries are only modifiable within 2 hours of being added."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find foods that match clarification context
    let targetEntries = recentEntries;
    
    // Try to match foods based on clarification text
    if (clarification_text) {
      const lowerClarification = clarification_text.toLowerCase();
      const potentialMatches = recentEntries.filter(entry => {
        const entryName = entry.name.toLowerCase();
        
        // Check for partial matches
        if (lowerClarification.includes('yogurt') && entryName.includes('yogurt')) return true;
        if (lowerClarification.includes('cucumber') && entryName.includes('cucumber')) return true;
        if (lowerClarification.includes('apple') && entryName.includes('apple')) return true;
        if (lowerClarification.includes('greek') && entryName.includes('greek')) return true;
        
        // Check if food name appears in clarification
        const foodWords = entryName.split(' ');
        return foodWords.some(word => word.length > 2 && lowerClarification.includes(word));
      });
      
      if (potentialMatches.length > 0) {
        targetEntries = potentialMatches;
        console.log(`Matched ${targetEntries.length} entries based on clarification`);
      }
    }

    const updatePromises = [];
    let updatedCount = 0;

    // Apply modifications to target entries
    for (const entry of targetEntries) {
      const updates: any = {};
      let shouldUpdate = false;

      // Handle serving size modifications
      if (modifications.serving_size_each && modifications.serving_size_each !== entry.serving_size) {
        const ratio = modifications.serving_size_each / entry.serving_size;
        updates.serving_size = modifications.serving_size_each;
        updates.calories = Math.round(entry.calories * ratio);
        updates.carbs = Math.round(entry.carbs * ratio * 100) / 100;
        shouldUpdate = true;
        console.log(`Updating ${entry.name}: ${entry.serving_size}g -> ${modifications.serving_size_each}g`);
      }

      if (shouldUpdate) {
        const updatePromise = supabase
          .from('food_entries')
          .update(updates)
          .eq('id', entry.id)
          .eq('user_id', userId);
        
        updatePromises.push(updatePromise);
        updatedCount++;
      }
    }

    // Execute all updates
    const results = await Promise.all(updatePromises);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Some updates failed:', errors);
      throw new Error('Failed to update some food entries');
    }

    console.log(`Successfully updated ${updatedCount} food entries`);

    return new Response(JSON.stringify({
      success: true,
      message: `Updated ${updatedCount} food entries with the new serving sizes.`,
      updated_count: updatedCount,
      details: modifications
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in modify-recent-foods:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: "I couldn't modify the recent foods. Please make sure you have recent food entries to modify."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});