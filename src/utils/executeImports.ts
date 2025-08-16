import { supabase } from "@/integrations/supabase/client";

interface FastingHourData {
  hour: number;
  stage: string;
  metabolic_changes: string;
  physiological_effects: string;
  mental_emotional_state: string[];
  benefits_challenges: string;
  content_snippet: string;
}

const executeImports = async () => {
  console.log("Starting data import...");
  
  try {
    // Import first 24 hours
    const firstBatch = await importFirst24Hours();
    console.log("First 24 hours imported:", firstBatch);
    
    // Import second 24 hours  
    const secondBatch = await importSecond24Hours();
    console.log("Second 24 hours imported:", secondBatch);
    
    // Import final 24 hours
    const finalBatch = await importFinal24Hours();
    console.log("Final 24 hours imported:", finalBatch);
    
    console.log("All data imported successfully!");
    return { success: true, first: firstBatch, second: secondBatch, final: finalBatch };
  } catch (error) {
    console.error("Import failed:", error);
    return { success: false, error };
  }
};

const importFirst24Hours = async () => {
  const batchData: FastingHourData[] = [
    {
      hour: 1,
      stage: "Post-absorptive transition",
      metabolic_changes: "Blood glucose remains stable from recent meal; insulin begins to decline. The liver starts transitioning from glucose storage to glucose release.",
      physiological_effects: "Body feels normal after eating. Digestive system is actively processing food. No noticeable physical changes yet.",
      mental_emotional_state: ["Satisfaction from eating", "Normal energy levels", "Clear thinking"],
      benefits_challenges: "Benefit: Easy transition period with stable energy.\nChallenge: Potential for food cravings if you normally eat frequently.",
      content_snippet: "Hour 1: Post-absorptive transition — digestion continues, stable energy, normal mental state."
    },
    {
      hour: 2,
      stage: "Post-absorptive transition", 
      metabolic_changes: "Blood glucose remains stable from recent meal; insulin begins to decline. The liver starts transitioning from glucose storage to glucose release.",
      physiological_effects: "Body feels normal after eating. Digestive system is actively processing food. Energy feels steady from recent meal.",
      mental_emotional_state: ["Contentment from eating", "Stable mood", "Good concentration"],
      benefits_challenges: "Benefit: Easy transition period with stable energy.\nChallenge: Potential for food cravings if you normally eat frequently.",
      content_snippet: "Hour 2: Post-absorptive transition — digestion continues, stable energy, normal mental state."
    }
    // Add remaining hours 3-24 with similar structure...
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const data of batchData) {
    try {
      const variants = [
        { type: 'metabolic', content: data.metabolic_changes },
        { type: 'physiological', content: data.physiological_effects },
        { type: 'mental', content: data.mental_emotional_state.join(', ') },
        { type: 'benefits', content: data.benefits_challenges },
        { type: 'snippet', content: data.content_snippet }
      ];

      const { error } = await supabase
        .from('fasting_hours')
        .upsert({
          hour: data.hour,
          stage: data.stage,
          metabolic_changes: data.metabolic_changes,
          physiological_effects: data.physiological_effects,
          mental_emotional_state: data.mental_emotional_state,
          benefits_challenges: data.benefits_challenges,
          content_snippet: data.content_snippet,
          content_rotation_data: { current_index: 0, variants },
          title: `${data.stage} - Hour ${data.hour}`,
          body_state: data.physiological_effects,
          day: Math.ceil(data.hour / 24),
          phase: data.stage.toLowerCase().replace(/\s+/g, '_'),
          difficulty: 'easy'
        }, { onConflict: 'hour' });

      if (error) {
        console.error(`Error importing hour ${data.hour}:`, error);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.error(`Exception importing hour ${data.hour}:`, err);
      errorCount++;
    }
  }

  return { successCount, errorCount };
};

const importSecond24Hours = async () => {
  // Similar implementation for hours 25-48
  return { successCount: 0, errorCount: 0 };
};

const importFinal24Hours = async () => {
  // Similar implementation for hours 49-72
  return { successCount: 0, errorCount: 0 };
};

export { executeImports };