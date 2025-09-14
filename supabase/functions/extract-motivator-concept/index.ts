import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple stopwords list for English
const STOPWORDS = new Set([
  "the","a","an","and","or","but","if","then","else","when","at","by","from","for","in","into","of","on","to","with","about","as","is","are","was","were","be","being","been","it","this","that","these","those","my","our","your","their","i","you","he","she","we","they","me","him","her","us","them","will","can","could","should","would","do","does","did","have","has","had"
]);

// Keyword to concept mapping (used as fallback only when AI extraction fails)
const MAPPINGS: Array<{ keywords: RegExp; concept: string }> = [
  { keywords: /(clothes?|outfit|jeans|pants|dress|suit|shirt|skirt|jacket|fit|fitting)/i, concept: "hanger" },
  { keywords: /(wedding|reunion|event|party|birthday|anniversary|deadline|date)/i, concept: "calendar" },
  { keywords: /(mirror|reflection|reflect)/i, concept: "mirror" },
  { keywords: /(countdown|timer|time|hour|hours|clock)/i, concept: "hourglass" },
  { keywords: /(walk|walking|steps|run|running|jog|jogging)/i, concept: "footprint" },
  { keywords: /(focus|goal|target|aim|objective)/i, concept: "target" },
  { keywords: /(progress|growth|improve|improvement|advance|better)/i, concept: "up arrow" },
  { keywords: /(strength|power|energy|energetic|charge)/i, concept: "lightning bolt" },
  { keywords: /(mountain|peak|summit|climb|climbing)/i, concept: "mountain" },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w));
}

function pickHeuristicConcept(title: string, content: string): string {
  const full = `${title} ${content}`.trim();
  if (!full) return "star";

  // Mapping-based detection first
  for (const map of MAPPINGS) {
    if (map.keywords.test(full)) return map.concept;
  }

  // Always return a concrete object, never abstract words
  return "star";
}

async function extractConceptWithAI(title: string, content: string, apiKey: string): Promise<string | null> {
  try {
    const prompt = `This is a weight loss motivation goal. What concrete visual object would best represent this goal as a motivational image? The goal is: "${title}. ${content}".

Examples:
- If someone wants to fit in old clothes → "clothes hanger"
- If someone wants to impress people → "shining star" 
- If someone wants to be healthy → "heart"
- If someone wants to be president → "crown"
- If someone has a deadline → "calendar"
- If someone wants to be strong → "mountain"

Return only 1-2 words for a concrete object that can be drawn as a simple icon. Avoid abstract concepts.`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Return only a concrete visual object (1-2 words) that can be drawn as a simple icon. No explanations.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    const data = await resp.json();
    const text: string | undefined = data?.choices?.[0]?.message?.content;
    if (!text) return null;

    // Normalize result
    const concept = text.trim().toLowerCase().replace(/[^a-z\s-]/g, '').slice(0, 40);
    if (!concept) return null;

    // If concept matches a mapping keyword, normalize to our canonical term
    for (const map of MAPPINGS) {
      if (map.keywords.test(concept)) return map.concept;
    }

    // Otherwise return as-is (limited length)
    return concept;
  } catch (e) {
    console.error('AI concept extraction failed:', e);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title = "", content = "", apiKey } = await req.json().catch(() => ({ title: "", content: "", apiKey: null }));

    // 🔑 SIMPLIFIED: Get OpenAI API key using standardized resolution
    console.log('🔑 Resolving OpenAI API key for motivator concept extraction...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    try {
      const openaiKey = await resolveOpenAIApiKey(supabase);
      console.log('OpenAI key found, trying AI extraction...');
      const aiConcept = await extractConceptWithAI(String(title), String(content), openaiKey);
      console.log(`AI extraction result: "${aiConcept}"`);
      if (aiConcept) concept = aiConcept;
    } catch (error) {
      console.error('AI extraction failed:', error);
      console.log('Falling back to heuristic extraction...');
    }

    if (!concept) {
      console.log('Using heuristic fallback...');
      concept = pickHeuristicConcept(String(title), String(content));
      console.log(`Heuristic result: "${concept}"`);
    }

    console.log(`Final concept: "${concept}"`);

    return new Response(
      JSON.stringify({ concept }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("extract-motivator-concept error:", error);
    return new Response(
      JSON.stringify({ concept: "star", error: "Failed to extract concept" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
