import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { PROTECTED_CORS_HEADERS, PROTECTED_OPENAI_CONFIG, resolveOpenAIApiKey } from '../_shared/protected-config.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: PROTECTED_CORS_HEADERS });
  }

  try {
    const { foodName, amount, unit } = await req.json();
    
    if (!foodName) {
      throw new Error('Food name is required');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Resolve OpenAI API key using existing infrastructure
    const openAIApiKey = await resolveOpenAIApiKey(supabase);

    const amountText = amount && unit ? ` for ${amount}${unit}` : '';
    const prompt = `Please estimate the nutritional information for "${foodName}"${amountText}. 
    
Respond with ONLY a JSON object in this exact format:
{
  "calories": number,
  "carbs": number,
  "protein": number,
  "fat": number,
  "confidence": number (0-1),
  "reasoning": "brief explanation"
}

Guidelines:
- Provide realistic estimates based on typical preparation methods
- Confidence should reflect how certain you are (0.9+ for common foods, 0.5-0.8 for less common)
- All nutritional values should be for the EXACT amount specified
- If no amount specified, assume 100g portion
- Be conservative with estimates when uncertain`;

    console.log('Sending prompt to OpenAI:', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PROTECTED_OPENAI_CONFIG.CHAT_MODEL,
        messages: [
          { 
            role: 'system', 
            content: 'You are a nutrition expert. Provide accurate nutritional estimates in the requested JSON format only.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No response from OpenAI');
    }

    console.log('OpenAI response:', generatedText);

    // Try to parse the JSON response
    let nutritionData;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : generatedText;
      nutritionData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('Invalid response format from AI');
    }

    // Validate the response structure
    if (typeof nutritionData.calories !== 'number' || 
        typeof nutritionData.carbs !== 'number' || 
        typeof nutritionData.protein !== 'number' || 
        typeof nutritionData.fat !== 'number') {
      throw new Error('Invalid nutrition data structure');
    }

    // Ensure confidence is between 0 and 1
    if (typeof nutritionData.confidence !== 'number') {
      nutritionData.confidence = 0.7; // Default confidence
    }
    nutritionData.confidence = Math.max(0, Math.min(1, nutritionData.confidence));

    return new Response(JSON.stringify(nutritionData), {
      headers: { ...PROTECTED_CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in estimate-food-nutrition function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      confidence: 0,
      reasoning: 'Error occurred during estimation'
    }), {
      status: 500,
      headers: { ...PROTECTED_CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});