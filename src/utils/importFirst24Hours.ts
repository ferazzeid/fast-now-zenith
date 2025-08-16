import { supabase } from '@/integrations/supabase/client';

// First batch of 24 hours data
const importFirst24Hours = async () => {
  const batchData = [
    {
      hour: 1,
      stage: "Post‑meal absorption",
      metabolic_changes: "Insulin is high to usher glucose into cells and top up liver and muscle glycogen. Incretins (GLP‑1/GIP) rise from gut signaling. Leptin increases slightly after eating, while glucagon is suppressed. AMPK is quiet; mTOR is active for nutrient handling.",
      physiological_effects: "Hour 1: Stomach and small intestine are actively processing your last meal. Blood flow is centered in the gut; the liver packages nutrients, forming glycogen and triglycerides.",
      mental_emotional_state: ["Comfortable and satisfied", "focus may dip briefly as blood flows to digestion", "Once your body switches to fat, the brain runs smoothly on ketones and glucose made by the liver"],
      benefits_challenges: "Benefit: Efficient nutrient handling and glycogen loading.\nChallenge: Post‑meal slump or reflux if portions were large.",
      content_snippet: "Hour 1: Post‑meal absorption — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 2,
      stage: "Post‑meal absorption",
      metabolic_changes: "Insulin is high to usher glucose into cells and top up liver and muscle glycogen. Incretins (GLP‑1/GIP) rise from gut signaling. Leptin increases slightly after eating, while glucagon is suppressed. AMPK is quiet; mTOR is active for nutrient handling.",
      physiological_effects: "Hour 2: Stomach and small intestine are actively processing your last meal. Blood flow is centered in the gut; the liver packages nutrients, forming glycogen and triglycerides.",
      mental_emotional_state: ["Comfortable and satisfied", "focus may dip briefly as blood flows to digestion", "Stable energy replaces post‑meal dips, which can feel surprisingly calm"],
      benefits_challenges: "Benefit: Efficient nutrient handling and glycogen loading.\nChallenge: Post‑meal slump or reflux if portions were large.",
      content_snippet: "Hour 2: Post‑meal absorption — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 3,
      stage: "Post‑meal absorption",
      metabolic_changes: "Insulin is high to usher glucose into cells and top up liver and muscle glycogen. Incretins (GLP‑1/GIP) rise from gut signaling. Leptin increases slightly after eating, while glucagon is suppressed. AMPK is quiet; mTOR is active for nutrient handling.",
      physiological_effects: "Hour 3: Stomach and small intestine are actively processing your last meal. Blood flow is centered in the gut; the liver packages nutrients, forming glycogen and triglycerides.",
      mental_emotional_state: ["Comfortable and satisfied", "focus may dip briefly as blood flows to digestion", "Mood often flattens—in a good way—as blood sugar swings are reduced"],
      benefits_challenges: "Benefit: Efficient nutrient handling and glycogen loading.\nChallenge: Post‑meal slump or reflux if portions were large.",
      content_snippet: "Hour 3: Post‑meal absorption — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 4,
      stage: "Post‑meal absorption",
      metabolic_changes: "Insulin is high to usher glucose into cells and top up liver and muscle glycogen. Incretins (GLP‑1/GIP) rise from gut signaling. Leptin increases slightly after eating, while glucagon is suppressed. AMPK is quiet; mTOR is active for nutrient handling.",
      physiological_effects: "Hour 4: Stomach and small intestine are actively processing your last meal. Blood flow is centered in the gut; the liver packages nutrients, forming glycogen and triglycerides.",
      mental_emotional_state: ["Comfortable and satisfied", "focus may dip briefly as blood flows to digestion", "Many report a clean, 'even' focus from steady ketones"],
      benefits_challenges: "Benefit: Efficient nutrient handling and glycogen loading.\nChallenge: Post‑meal slump or reflux if portions were large.",
      content_snippet: "Hour 4: Post‑meal absorption — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 5,
      stage: "Late absorption → Early post‑absorptive",
      metabolic_changes: "Insulin starts to fall and glucagon rises. The liver shifts from storing to releasing glucose via glycogen breakdown. Hormone‑sensitive lipase (HSL) begins freeing fatty acids from fat tissue.",
      physiological_effects: "Hour 5: Gastric emptying slows. The liver begins releasing glucose into blood; muscles draw on stored glycogen for light activity.",
      mental_emotional_state: ["Mild hunger can flicker as insulin falls", "Cravings are often cue-driven: smells, social cues, and the clock", "A short walk or a glass of water usually helps"],
      benefits_challenges: "Benefit: Transition toward fat‑burning begins.\nChallenge: First hunger waves and slight irritability.",
      content_snippet: "Hour 5: Late absorption → Early post‑absorptive — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 6,
      stage: "Late absorption → Early post‑absorptive",
      metabolic_changes: "Insulin starts to fall and glucagon rises. The liver shifts from storing to releasing glucose via glycogen breakdown. Hormone‑sensitive lipase (HSL) begins freeing fatty acids from fat tissue.",
      physiological_effects: "Hour 6: Gastric emptying slows. The liver begins releasing glucose into blood; muscles draw on stored glycogen for light activity.",
      mental_emotional_state: ["Mild hunger can flicker as insulin falls", "Ghrelin, the 'hunger hormone,' pulses around prior mealtimes", "The signal rises and falls; distraction helps it pass"],
      benefits_challenges: "Benefit: Transition toward fat‑burning begins.\nChallenge: First hunger waves and slight irritability.",
      content_snippet: "Hour 6: Late absorption → Early post‑absorptive — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 7,
      stage: "Late absorption → Early post‑absorptive",
      metabolic_changes: "Insulin starts to fall and glucagon rises. The liver shifts from storing to releasing glucose via glycogen breakdown. Hormone‑sensitive lipase (HSL) begins freeing fatty acids from fat tissue.",
      physiological_effects: "Hour 7: Gastric emptying slows. The liver begins releasing glucose into blood; muscles draw on stored glycogen for light activity.",
      mental_emotional_state: ["Mild hunger can flicker as insulin falls", "Sips of water or unsweetened tea can blunt a hunger surge", "most waves last only a few minutes"],
      benefits_challenges: "Benefit: Transition toward fat‑burning begins.\nChallenge: First hunger waves and slight irritability.",
      content_snippet: "Hour 7: Late absorption → Early post‑absorptive — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 8,
      stage: "Late absorption → Early post‑absorptive",
      metabolic_changes: "Insulin starts to fall and glucagon rises. The liver shifts from storing to releasing glucose via glycogen breakdown. Hormone‑sensitive lipase (HSL) begins freeing fatty acids from fat tissue.",
      physiological_effects: "Hour 8: Gastric emptying slows. The liver begins releasing glucose into blood; muscles draw on stored glycogen for light activity.",
      mental_emotional_state: ["Mild hunger can flicker as insulin falls", "Hunger tends to arrive in brief waves tied to your usual meal times", "if you wait 10–20 minutes, it often fades"],
      benefits_challenges: "Benefit: Transition toward fat‑burning begins.\nChallenge: First hunger waves and slight irritability.",
      content_snippet: "Hour 8: Late absorption → Early post‑absorptive — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 9,
      stage: "Post‑absorptive transition",
      metabolic_changes: "Hepatic glycogen is being used steadily; catecholamines support normal metabolic rate. Early ketone generation begins (small amounts of β‑hydroxybutyrate). AMPK activity edges up; mTOR quiets.",
      physiological_effects: "Hour 9: Breath may start to carry a hint of acetone later today as fat burning rises. Hydration and gentle movement aid the transition.",
      mental_emotional_state: ["A steadier energy curve replaces post‑meal swings", "Stable energy replaces post‑meal dips, which can feel surprisingly calm"],
      benefits_challenges: "Benefit: Reduced glucose swings; energy steadies.\nChallenge: Headache risk if hydration and salt are low.",
      content_snippet: "Hour 9: Post‑absorptive transition — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 10,
      stage: "Post‑absorptive transition",
      metabolic_changes: "Hepatic glycogen is being used steadily; catecholamines support normal metabolic rate. Early ketone generation begins (small amounts of β‑hydroxybutyrate). AMPK activity edges up; mTOR quiets.",
      physiological_effects: "Hour 10: Breath may start to carry a hint of acetone later today as fat burning rises. Hydration and gentle movement aid the transition.",
      mental_emotional_state: ["A steadier energy curve replaces post‑meal swings", "Mood often flattens—in a good way—as blood sugar swings are reduced"],
      benefits_challenges: "Benefit: Reduced glucose swings; energy steadies.\nChallenge: Headache risk if hydration and salt are low.",
      content_snippet: "Hour 10: Post‑absorptive transition — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 11,
      stage: "Post‑absorptive transition",
      metabolic_changes: "Hepatic glycogen is being used steadily; catecholamines support normal metabolic rate. Early ketone generation begins (small amounts of β‑hydroxybutyrate). AMPK activity edges up; mTOR quiets.",
      physiological_effects: "Hour 11: Breath may start to carry a hint of acetone later today as fat burning rises. Hydration and gentle movement aid the transition.",
      mental_emotional_state: ["A steadier energy curve replaces post‑meal swings", "Many report a clean, 'even' focus from steady ketones"],
      benefits_challenges: "Benefit: Reduced glucose swings; energy steadies.\nChallenge: Headache risk if hydration and salt are low.",
      content_snippet: "Hour 11: Post‑absorptive transition — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 12,
      stage: "Post‑absorptive transition",
      metabolic_changes: "Hepatic glycogen is being used steadily; catecholamines support normal metabolic rate. Early ketone generation begins (small amounts of β‑hydroxybutyrate). AMPK activity edges up; mTOR quiets.",
      physiological_effects: "Hour 12: Breath may start to carry a hint of acetone later today as fat burning rises. Hydration and gentle movement aid the transition.",
      mental_emotional_state: ["A steadier energy curve replaces post‑meal swings", "Once your body switches to fat, the brain runs smoothly on ketones and glucose made by the liver"],
      benefits_challenges: "Benefit: Reduced glucose swings; energy steadies.\nChallenge: Headache risk if hydration and salt are low.",
      content_snippet: "Hour 12: Post‑absorptive transition — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 13,
      stage: "Early fasting: fat‑switch begins",
      metabolic_changes: "Insulin is low, glucagon higher; lipolysis accelerates. The liver increases gluconeogenesis (from lactate, glycerol, and some amino acids) while ketone output picks up.",
      physiological_effects: "Hour 13: Liver glycogen is shrinking. Adipose tissue releases fatty acids; the liver turns some into ketones. GI motility calms; you may notice fewer bowel sounds.",
      mental_emotional_state: ["Mood can wobble as your brain samples more ketones", "Ghrelin, the 'hunger hormone,' pulses around prior mealtimes", "The signal rises and falls; distraction helps it pass"],
      benefits_challenges: "Benefit: Fat mobilization and metabolic flexibility increase.\nChallenge: Mood wobbles and lightheadedness possible—salt and fluids help.",
      content_snippet: "Hour 13: Early fasting: fat‑switch begins — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 14,
      stage: "Early fasting: fat‑switch begins",
      metabolic_changes: "Insulin is low, glucagon higher; lipolysis accelerates. The liver increases gluconeogenesis (from lactate, glycerol, and some amino acids) while ketone output picks up.",
      physiological_effects: "Hour 14: Liver glycogen is shrinking. Adipose tissue releases fatty acids; the liver turns some into ketones. GI motility calms; you may notice fewer bowel sounds.",
      mental_emotional_state: ["Mood can wobble as your brain samples more ketones", "Sips of water or unsweetened tea can blunt a hunger surge", "most waves last only a few minutes"],
      benefits_challenges: "Benefit: Fat mobilization and metabolic flexibility increase.\nChallenge: Mood wobbles and lightheadedness possible—salt and fluids help.",
      content_snippet: "Hour 14: Early fasting: fat‑switch begins — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 15,
      stage: "Early fasting: fat‑switch begins",
      metabolic_changes: "Insulin is low, glucagon higher; lipolysis accelerates. The liver increases gluconeogenesis (from lactate, glycerol, and some amino acids) while ketone output picks up.",
      physiological_effects: "Hour 15: Liver glycogen is shrinking. Adipose tissue releases fatty acids; the liver turns some into ketones. GI motility calms; you may notice fewer bowel sounds.",
      mental_emotional_state: ["Mood can wobble as your brain samples more ketones", "Hunger tends to arrive in brief waves tied to your usual meal times", "if you wait 10–20 minutes, it often fades"],
      benefits_challenges: "Benefit: Fat mobilization and metabolic flexibility increase.\nChallenge: Mood wobbles and lightheadedness possible—salt and fluids help.",
      content_snippet: "Hour 15: Early fasting: fat‑switch begins — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 16,
      stage: "Early fasting: fat‑switch begins",
      metabolic_changes: "Insulin is low, glucagon higher; lipolysis accelerates. The liver increases gluconeogenesis (from lactate, glycerol, and some amino acids) while ketone output picks up.",
      physiological_effects: "Hour 16: Liver glycogen is shrinking. Adipose tissue releases fatty acids; the liver turns some into ketones. GI motility calms; you may notice fewer bowel sounds.",
      mental_emotional_state: ["Mood can wobble as your brain samples more ketones", "Cravings are often cue-driven: smells, social cues, and the clock", "A short walk or a glass of water usually helps"],
      benefits_challenges: "Benefit: Fat mobilization and metabolic flexibility increase.\nChallenge: Mood wobbles and lightheadedness possible—salt and fluids help.",
      content_snippet: "Hour 16: Early fasting: fat‑switch begins — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 17,
      stage: "Rising ketosis",
      metabolic_changes: "Ketogenesis is now meaningful; the brain starts using a mix of glucose and ketones. Growth hormone trends upward, helping preserve lean tissue. Ghrelin pulses but average appetite wanes.",
      physiological_effects: "Hour 17: Kidneys excrete a bit more sodium and water as insulin stays low (mild diuresis). You might see a lower scale weight from fluid shifts—not just fat loss yet.",
      mental_emotional_state: ["Many feel a clearer, quieter focus", "Mood often flattens—in a good way—as blood sugar swings are reduced"],
      benefits_challenges: "Benefit: Brain ketone use grows; appetite naturally shrinks.\nChallenge: Intense workouts may feel tougher.",
      content_snippet: "Hour 17: Rising ketosis — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 18,
      stage: "Rising ketosis",
      metabolic_changes: "Ketogenesis is now meaningful; the brain starts using a mix of glucose and ketones. Growth hormone trends upward, helping preserve lean tissue. Ghrelin pulses but average appetite wanes.",
      physiological_effects: "Hour 18: Kidneys excrete a bit more sodium and water as insulin stays low (mild diuresis). You might see a lower scale weight from fluid shifts—not just fat loss yet.",
      mental_emotional_state: ["Many feel a clearer, quieter focus", "Many report a clean, 'even' focus from steady ketones"],
      benefits_challenges: "Benefit: Brain ketone use grows; appetite naturally shrinks.\nChallenge: Intense workouts may feel tougher.",
      content_snippet: "Hour 18: Rising ketosis — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 19,
      stage: "Rising ketosis",
      metabolic_changes: "Ketogenesis is now meaningful; the brain starts using a mix of glucose and ketones. Growth hormone trends upward, helping preserve lean tissue. Ghrelin pulses but average appetite wanes.",
      physiological_effects: "Hour 19: Kidneys excrete a bit more sodium and water as insulin stays low (mild diuresis). You might see a lower scale weight from fluid shifts—not just fat loss yet.",
      mental_emotional_state: ["Many feel a clearer, quieter focus", "Once your body switches to fat, the brain runs smoothly on ketones and glucose made by the liver"],
      benefits_challenges: "Benefit: Brain ketone use grows; appetite naturally shrinks.\nChallenge: Intense workouts may feel tougher.",
      content_snippet: "Hour 19: Rising ketosis — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 20,
      stage: "Rising ketosis",
      metabolic_changes: "Ketogenesis is now meaningful; the brain starts using a mix of glucose and ketones. Growth hormone trends upward, helping preserve lean tissue. Ghrelin pulses but average appetite wanes.",
      physiological_effects: "Hour 20: Kidneys excrete a bit more sodium and water as insulin stays low (mild diuresis). You might see a lower scale weight from fluid shifts—not just fat loss yet.",
      mental_emotional_state: ["Many feel a clearer, quieter focus", "Stable energy replaces post‑meal dips, which can feel surprisingly calm"],
      benefits_challenges: "Benefit: Brain ketone use grows; appetite naturally shrinks.\nChallenge: Intense workouts may feel tougher.",
      content_snippet: "Hour 20: Rising ketosis — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 21,
      stage: "Deepening ketosis, low insulin",
      metabolic_changes: "Insulin and glucose sit near daily lows; glucagon, GH and noradrenaline support fat‑to‑ketone conversion. Gluconeogenesis covers essential glucose needs (red blood cells, parts of the kidney and brain).",
      physiological_effects: "Hour 21: Most day‑to‑day energy now comes from fat oxidation and ketones. If you exercise, intensity feels harder; zone‑2 work usually feels fine.",
      mental_emotional_state: ["Confidence rises as hunger stabilizes, though long meetings or workouts may feel harder", "Many report a clean, 'even' focus from steady ketones"],
      benefits_challenges: "Benefit: Insulin sensitivity improves; inflammation signals may ease.\nChallenge: Orthostatic dizziness—stand up slowly and mind electrolytes.",
      content_snippet: "Hour 21: Deepening ketosis, low insulin — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 22,
      stage: "Deepening ketosis, low insulin",
      metabolic_changes: "Insulin and glucose sit near daily lows; glucagon, GH and noradrenaline support fat‑to‑ketone conversion. Gluconeogenesis covers essential glucose needs (red blood cells, parts of the kidney and brain).",
      physiological_effects: "Hour 22: Most day‑to‑day energy now comes from fat oxidation and ketones. If you exercise, intensity feels harder; zone‑2 work usually feels fine.",
      mental_emotional_state: ["Confidence rises as hunger stabilizes, though long meetings or workouts may feel harder", "Once your body switches to fat, the brain runs smoothly on ketones and glucose made by the liver"],
      benefits_challenges: "Benefit: Insulin sensitivity improves; inflammation signals may ease.\nChallenge: Orthostatic dizziness—stand up slowly and mind electrolytes.",
      content_snippet: "Hour 22: Deepening ketosis, low insulin — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 23,
      stage: "Deepening ketosis, low insulin", 
      metabolic_changes: "Insulin and glucose sit near daily lows; glucagon, GH and noradrenaline support fat‑to‑ketone conversion. Gluconeogenesis covers essential glucose needs (red blood cells, parts of the kidney and brain).",
      physiological_effects: "Hour 23: Most day‑to‑day energy now comes from fat oxidation and ketones. If you exercise, intensity feels harder; zone‑2 work usually feels fine.",
      mental_emotional_state: ["Confidence rises as hunger stabilizes, though long meetings or workouts may feel harder", "Stable energy replaces post‑meal dips, which can feel surprisingly calm"],
      benefits_challenges: "Benefit: Insulin sensitivity improves; inflammation signals may ease.\nChallenge: Orthostatic dizziness—stand up slowly and mind electrolytes.",
      content_snippet: "Hour 23: Deepening ketosis, low insulin — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 24,
      stage: "Deepening ketosis, low insulin",
      metabolic_changes: "Insulin and glucose sit near daily lows; glucagon, GH and noradrenaline support fat‑to‑ketone conversion. Gluconeogenesis covers essential glucose needs (red blood cells, parts of the kidney and brain).",
      physiological_effects: "Hour 24: Most day‑to‑day energy now comes from fat oxidation and ketones. If you exercise, intensity feels harder; zone‑2 work usually feels fine.",
      mental_emotional_state: ["Confidence rises as hunger stabilizes, though long meetings or workouts may feel harder", "Mood often flattens—in a good way—as blood sugar swings are reduced"],
      benefits_challenges: "Benefit: Insulin sensitivity improves; inflammation signals may ease.\nChallenge: Orthostatic dizziness—stand up slowly and mind electrolytes.",
      content_snippet: "Hour 24: Deepening ketosis, low insulin — fat‑burn rises, insulin stays low, and focus gets steadier."
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const item of batchData) {
    try {
      // Build content rotation variants
      const variants = [];
      if (item.metabolic_changes) {
        variants.push({ type: 'metabolic', content: item.metabolic_changes });
      }
      if (item.physiological_effects) {
        variants.push({ type: 'physiological', content: item.physiological_effects });
      }
      if (item.mental_emotional_state?.length) {
        variants.push({ type: 'mental', content: item.mental_emotional_state.join(', ') });
      }
      if (item.benefits_challenges) {
        variants.push({ type: 'benefits', content: item.benefits_challenges });
      }
      if (item.content_snippet) {
        variants.push({ type: 'snippet', content: item.content_snippet });
      }

      const { error } = await supabase
        .from('fasting_hours')
        .upsert({
          hour: item.hour,
          day: Math.ceil(item.hour / 24),
          stage: item.stage,
          metabolic_changes: item.metabolic_changes,
          physiological_effects: item.physiological_effects,
          mental_emotional_state: item.mental_emotional_state,
          benefits_challenges: item.benefits_challenges,
          content_snippet: item.content_snippet,
          content_rotation_data: {
            current_index: 0,
            variants
          },
          title: `Hour ${item.hour}${item.stage ? ` - ${item.stage}` : ''}`,
          body_state: item.physiological_effects || `Hour ${item.hour} of fasting`,
          phase: item.stage || 'fasting',
          difficulty: item.hour <= 16 ? 'easy' : item.hour <= 48 ? 'medium' : 'hard'
        }, {
          onConflict: 'hour',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`Error importing hour ${item.hour}:`, error);
        errorCount++;
      } else {
        successCount++;
      }
    } catch (err) {
      console.error('Error processing hour:', item.hour, err);
      errorCount++;
    }
  }

  console.log(`Import completed: ${successCount} success, ${errorCount} errors`);
  return { success: successCount, errors: errorCount };
};

// Auto-import when this file loads
importFirst24Hours().then(result => {
  console.log('First 24 hours imported:', result);
});