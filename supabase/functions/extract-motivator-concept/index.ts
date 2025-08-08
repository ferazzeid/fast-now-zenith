import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple stopwords list for English
const STOPWORDS = new Set([
  "the","a","an","and","or","but","if","then","else","when","at","by","from","for","in","into","of","on","to","with","about","as","is","are","was","were","be","being","been","it","this","that","these","those","my","our","your","their","i","you","he","she","we","they","me","him","her","us","them","will","can","could","should","would","do","does","did","have","has","had"
]);

// Keyword to concept mapping
const MAPPINGS: Array<{ keywords: RegExp; concept: string }> = [
  { keywords: /(clothes?|outfit|jeans|pants|dress|suit|shirt|skirt|jacket|fit|fitting)/i, concept: "hanger" },
  { keywords: /(wedding|reunion|event|party|birthday|anniversary|deadline|date)/i, concept: "calendar" },
  { keywords: /(impress|attention|attract|admire|noticed|recognition|respect)/i, concept: "star" },
  { keywords: /(respect|dignity|pride|honor)/i, concept: "laurel wreath" },
  { keywords: /(mirror|reflection|reflect)/i, concept: "mirror" },
  { keywords: /(insulin|glucose|sugar)/i, concept: "water drop" },
  { keywords: /(symptom|pain|ache|inflammation|health issue|issue)/i, concept: "medical cross" },
  { keywords: /(countdown|timer|time|hour|hours|clock)/i, concept: "hourglass" },
  { keywords: /(walk|walking|steps|run|running|jog|jogging)/i, concept: "footprint" },
  { keywords: /(focus|goal|target|aim|objective)/i, concept: "target" },
  { keywords: /(progress|growth|improve|improvement|advance|better)/i, concept: "up arrow" },
  { keywords: /(strength|power|energy|energetic|charge)/i, concept: "lightning bolt" },
  { keywords: /(mountain|peak|summit|climb|climbing)/i, concept: "mountain" },
  { keywords: /(star)/i, concept: "star" },
  { keywords: /(arrow)/i, concept: "arrow" },
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

  // Fallback: pick the first meaningful token or a default
  const tokens = tokenize(full);
  if (tokens.length === 0) return "star";

  // Reduce to 1-2 words if token has hyphen or space concepts later
  const first = tokens[0];
  return first.length <= 18 ? first : "star";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title = "", content = "" } = await req.json().catch(() => ({ title: "", content: "" }));

    const concept = pickHeuristicConcept(String(title), String(content));

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
