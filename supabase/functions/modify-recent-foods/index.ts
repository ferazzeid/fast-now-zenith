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

    // Get today's food entries (within last 4 hours to be recent - extended window)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    
    const { data: recentEntries, error: entriesError } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('source_date', today)
      .gte('created_at', fourHoursAgo)
      .order('created_at', { ascending: false });

    if (entriesError) {
      console.error('Error fetching recent entries:', entriesError);
      throw new Error('Failed to fetch recent food entries');
    }

    console.log(`Found ${recentEntries?.length || 0} recent entries`);

    if (!recentEntries || recentEntries.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: "I couldn't find any recent food entries to modify. Food entries are only modifiable within 4 hours of being added."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find foods that match clarification context
    let targetEntries = recentEntries;
    
    // Enhanced fuzzy matching for food identification
    if (clarification_text) {
      const lowerClarification = clarification_text.toLowerCase();
      const potentialMatches = recentEntries.filter(entry => {
        const entryName = entry.name.toLowerCase();
        
        // Enhanced food type matching with better fuzzy logic
        const foodTypeMap = {
          'yogurt': ['yogurt', 'greek', 'plain', 'vanilla'],
          'cucumber': ['cucumber', 'cuke'],
          'apple': ['apple', 'apples'],
          'cheese': ['cheese', 'cheddar', 'feta', 'brie', 'mozzarella'],
          'chicken': ['chicken', 'breast', 'thigh'],
          'bread': ['bread', 'slice', 'loaf'],
          'egg': ['egg', 'eggs'],
          'milk': ['milk', 'dairy'],
          'rice': ['rice', 'grain'],
          'pasta': ['pasta', 'noodle', 'spaghetti']
        };
        
        // Check for exact food type matches
        for (const [type, keywords] of Object.entries(foodTypeMap)) {
          if (lowerClarification.includes(type)) {
            if (keywords.some(keyword => entryName.includes(keyword))) {
              return true;
            }
          }
        }
        
        // Check for direct partial matches (minimum 3 characters)
        const clarificationWords = lowerClarification.split(' ').filter(word => word.length >= 3);
        const entryWords = entryName.split(' ').filter(word => word.length >= 3);
        
        for (const clarWord of clarificationWords) {
          for (const entryWord of entryWords) {
            // Exact match
            if (clarWord === entryWord) return true;
            // Substring match (one contains the other)
            if (clarWord.includes(entryWord) || entryWord.includes(clarWord)) return true;
            // Similar length and similar characters (basic fuzzy)
            if (Math.abs(clarWord.length - entryWord.length) <= 2) {
              let matches = 0;
              const minLength = Math.min(clarWord.length, entryWord.length);
              for (let i = 0; i < minLength; i++) {
                if (clarWord[i] === entryWord[i]) matches++;
              }
              if (matches / minLength >= 0.7) return true; // 70% character match
            }
          }
        }
        
        return false;
      });
      
      if (potentialMatches.length > 0) {
        targetEntries = potentialMatches;
        console.log(`Matched ${targetEntries.length} entries based on enhanced clarification matching`);
      } else {
        console.log('No matches found with enhanced matching, using all recent entries as fallback');
      }
    }

    const updatePromises = [];
    let updatedCount = 0;

    // Apply modifications to target entries
    for (const entry of targetEntries) {
      const updates: any = {};
      let shouldUpdate = false;

      // Handle serving size modifications (per item)
      if (modifications.serving_size_each && modifications.serving_size_each !== entry.serving_size) {
        const ratio = modifications.serving_size_each / entry.serving_size;
        updates.serving_size = modifications.serving_size_each;
        updates.calories = Math.round(entry.calories * ratio);
        updates.carbs = Math.round(entry.carbs * ratio * 100) / 100;
        shouldUpdate = true;
        console.log(`Updating ${entry.name}: ${entry.serving_size}g -> ${modifications.serving_size_each}g`);
      }
      
      // Handle overall serving size modifications
      if (modifications.serving_size && modifications.serving_size !== entry.serving_size) {
        const ratio = modifications.serving_size / entry.serving_size;
        updates.serving_size = modifications.serving_size;
        updates.calories = Math.round(entry.calories * ratio);
        updates.carbs = Math.round(entry.carbs * ratio * 100) / 100;
        shouldUpdate = true;
        console.log(`Updating ${entry.name}: ${entry.serving_size}g -> ${modifications.serving_size}g`);
      }
      
      // Handle quantity modifications (this would need to duplicate/remove entries)
      if (modifications.quantity && modifications.quantity !== 1) {
        console.log(`Quantity modification requested for ${entry.name}: ${modifications.quantity} items`);
        // Note: Quantity modifications are complex and might need separate handling
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