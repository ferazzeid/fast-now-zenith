import { supabase } from '@/integrations/supabase/client';

// Second batch: Hours 24-47
const importSecond24Hours = async () => {
  const batchData = [
    {
      hour: 24,
      stage: "Deepening ketosis, low insulin",
      metabolic_changes: "Insulin and glucose sit near daily lows; glucagon, GH and noradrenaline support fat‑to‑ketone conversion. Gluconeogenesis covers essential glucose needs (red blood cells, parts of the kidney and brain).",
      physiological_effects: "Hour 24: Most day‑to‑day energy now comes from fat oxidation and ketones. If you exercise, intensity feels harder; zone‑2 work usually feels fine.",
      mental_emotional_state: ["Confidence rises as hunger stabilizes, though long meetings or workouts may feel harder", "Mood often flattens—in a good way—as blood sugar swings are reduced"],
      benefits_challenges: "Benefit: Insulin sensitivity improves; inflammation signals may ease.\nChallenge: Orthostatic dizziness—stand up slowly and mind electrolytes.",
      content_snippet: "Hour 24: Deepening ketosis, low insulin — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 25,
      stage: "Day 2: fat‑adaptation picks up",
      metabolic_changes: "Fatty acids supply most energy needs; ketones climb further. Leptin falls with lowered insulin, which can increase alertness. AMPK‑driven pathways favor repair over growth.",
      physiological_effects: "Hour 25: Liver glycogen is minimal. Breath acetone can be noticeable; mouth may feel dry. Joints often feel less puffy as water shifts out of tissues.",
      mental_emotional_state: ["Sense of control grows", "cravings are more psychological than physical", "Sips of water or unsweetened tea can blunt a hunger surge; most waves last only a few minutes"],
      benefits_challenges: "Benefit: Consistent fat loss from mobilized stores.\nChallenge: Dry mouth/acetone breath; hydrate and brush/tongue‑scrape.",
      content_snippet: "Hour 25: Day 2: fat‑adaptation picks up — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 26,
      stage: "Day 2: fat‑adaptation picks up",
      metabolic_changes: "Fatty acids supply most energy needs; ketones climb further. Leptin falls with lowered insulin, which can increase alertness. AMPK‑driven pathways favor repair over growth.",
      physiological_effects: "Hour 26: Liver glycogen is minimal. Breath acetone can be noticeable; mouth may feel dry. Joints often feel less puffy as water shifts out of tissues.",
      mental_emotional_state: ["Sense of control grows", "cravings are more psychological than physical", "Hunger tends to arrive in brief waves tied to your usual meal times—if you wait 10–20 minutes, it often fades"],
      benefits_challenges: "Benefit: Consistent fat loss from mobilized stores.\nChallenge: Dry mouth/acetone breath; hydrate and brush/tongue‑scrape.",
      content_snippet: "Hour 26: Day 2: fat‑adaptation picks up — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 27,
      stage: "Day 2: fat‑adaptation picks up",
      metabolic_changes: "Fatty acids supply most energy needs; ketones climb further. Leptin falls with lowered insulin, which can increase alertness. AMPK‑driven pathways favor repair over growth.",
      physiological_effects: "Hour 27: Liver glycogen is minimal. Breath acetone can be noticeable; mouth may feel dry. Joints often feel less puffy as water shifts out of tissues.",
      mental_emotional_state: ["Sense of control grows", "cravings are more psychological than physical", "Cravings are often cue-driven: smells, social cues, and the clock. A short walk or a glass of water usually helps"],
      benefits_challenges: "Benefit: Consistent fat loss from mobilized stores.\nChallenge: Dry mouth/acetone breath; hydrate and brush/tongue‑scrape.",
      content_snippet: "Hour 27: Day 2: fat‑adaptation picks up — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 28,
      stage: "Day 2: fat‑adaptation picks up",
      metabolic_changes: "Fatty acids supply most energy needs; ketones climb further. Leptin falls with lowered insulin, which can increase alertness. AMPK‑driven pathways favor repair over growth.",
      physiological_effects: "Hour 28: Liver glycogen is minimal. Breath acetone can be noticeable; mouth may feel dry. Joints often feel less puffy as water shifts out of tissues.",
      mental_emotional_state: ["Sense of control grows", "cravings are more psychological than physical", "Ghrelin, the 'hunger hormone,' pulses around prior mealtimes. The signal rises and falls; distraction helps it pass"],
      benefits_challenges: "Benefit: Consistent fat loss from mobilized stores.\nChallenge: Dry mouth/acetone breath; hydrate and brush/tongue‑scrape.",
      content_snippet: "Hour 28: Day 2: fat‑adaptation picks up — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 29,
      stage: "Autophagy signaling ramps",
      metabolic_changes: "Signals that promote autophagy and mitophagy are more pronounced now (especially with low insulin and mTOR). This is variable person‑to‑person but generally rises after the first full day without food.",
      physiological_effects: "Hour 29: Cells are busy with 'repair and recycle' tasks; mitochondria turnover (mitophagy) likely increases. Skin and gut may feel calmer as inflammatory signals ease.",
      mental_emotional_state: ["Many report 'mental spring‑cleaning'—a lightness and fewer intrusive food thoughts", "Stable energy replaces post‑meal dips, which can feel surprisingly calm"],
      benefits_challenges: "Benefit: Cellular cleanup/mitochondrial maintenance likely upregulated.\nChallenge: Keep activity sub‑max; recovery is different when fasting.",
      content_snippet: "Hour 29: Autophagy signaling ramps — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 30,
      stage: "Autophagy signaling ramps",
      metabolic_changes: "Signals that promote autophagy and mitophagy are more pronounced now (especially with low insulin and mTOR). This is variable person‑to‑person but generally rises after the first full day without food.",
      physiological_effects: "Hour 30: Cells are busy with 'repair and recycle' tasks; mitochondria turnover (mitophagy) likely increases. Skin and gut may feel calmer as inflammatory signals ease.",
      mental_emotional_state: ["Many report 'mental spring‑cleaning'—a lightness and fewer intrusive food thoughts", "Mood often flattens—in a good way—as blood sugar swings are reduced"],
      benefits_challenges: "Benefit: Cellular cleanup/mitochondrial maintenance likely upregulated.\nChallenge: Keep activity sub‑max; recovery is different when fasting.",
      content_snippet: "Hour 30: Autophagy signaling ramps — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 31,
      stage: "Autophagy signaling ramps",
      metabolic_changes: "Signals that promote autophagy and mitophagy are more pronounced now (especially with low insulin and mTOR). This is variable person‑to‑person but generally rises after the first full day without food.",
      physiological_effects: "Hour 31: Cells are busy with 'repair and recycle' tasks; mitochondria turnover (mitophagy) likely increases. Skin and gut may feel calmer as inflammatory signals ease.",
      mental_emotional_state: ["Many report 'mental spring‑cleaning'—a lightness and fewer intrusive food thoughts", "Many report a clean, 'even' focus from steady ketones"],
      benefits_challenges: "Benefit: Cellular cleanup/mitochondrial maintenance likely upregulated.\nChallenge: Keep activity sub‑max; recovery is different when fasting.",
      content_snippet: "Hour 31: Autophagy signaling ramps — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 32,
      stage: "Autophagy signaling ramps",
      metabolic_changes: "Signals that promote autophagy and mitophagy are more pronounced now (especially with low insulin and mTOR). This is variable person‑to‑person but generally rises after the first full day without food.",
      physiological_effects: "Hour 32: Cells are busy with 'repair and recycle' tasks; mitochondria turnover (mitophagy) likely increases. Skin and gut may feel calmer as inflammatory signals ease.",
      mental_emotional_state: ["Many report 'mental spring‑cleaning'—a lightness and fewer intrusive food thoughts", "Once your body switches to fat, the brain runs smoothly on ketones and glucose made by the liver"],
      benefits_challenges: "Benefit: Cellular cleanup/mitochondrial maintenance likely upregulated.\nChallenge: Keep activity sub‑max; recovery is different when fasting.",
      content_snippet: "Hour 32: Autophagy signaling ramps — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 33,
      stage: "Protein‑sparing, GH support",
      metabolic_changes: "Growth hormone remains elevated versus fed state, encouraging fat use and limiting protein breakdown. Ketones reduce the need for glucose, easing demand for amino acids in gluconeogenesis.",
      physiological_effects: "Hour 33: Lean tissue is maintained while fat stores are used. If you train, keep volume light; recovery capacity is different without incoming calories.",
      mental_emotional_state: ["Focus is steady", "motivation for intense tasks may dip", "Early nights sometimes bring restlessness; breathing drills or a short walk may steady you"],
      benefits_challenges: "Benefit: Muscle preservation with continued fat use.\nChallenge: Don't chase PRs—favor technique and mobility.",
      content_snippet: "Hour 33: Protein‑sparing, GH support — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 34,
      stage: "Protein‑sparing, GH support",
      metabolic_changes: "Growth hormone remains elevated versus fed state, encouraging fat use and limiting protein breakdown. Ketones reduce the need for glucose, easing demand for amino acids in gluconeogenesis.",
      physiological_effects: "Hour 34: Lean tissue is maintained while fat stores are used. If you train, keep volume light; recovery capacity is different without incoming calories.",
      mental_emotional_state: ["Focus is steady", "motivation for intense tasks may dip", "Dream recall can increase; if sleep is choppy, aim for consistent bed/wake times"],
      benefits_challenges: "Benefit: Muscle preservation with continued fat use.\nChallenge: Don't chase PRs—favor technique and mobility.",
      content_snippet: "Hour 34: Protein‑sparing, GH support — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 35,
      stage: "Protein‑sparing, GH support",
      metabolic_changes: "Growth hormone remains elevated versus fed state, encouraging fat use and limiting protein breakdown. Ketones reduce the need for glucose, easing demand for amino acids in gluconeogenesis.",
      physiological_effects: "Hour 35: Lean tissue is maintained while fat stores are used. If you train, keep volume light; recovery capacity is different without incoming calories.",
      mental_emotional_state: ["Focus is steady", "motivation for intense tasks may dip", "If you wake early, low‑intensity movement the next day often restores sleep pressure"],
      benefits_challenges: "Benefit: Muscle preservation with continued fat use.\nChallenge: Don't chase PRs—favor technique and mobility.",
      content_snippet: "Hour 35: Protein‑sparing, GH support — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 36,
      stage: "Protein‑sparing, GH support",
      metabolic_changes: "Growth hormone remains elevated versus fed state, encouraging fat use and limiting protein breakdown. Ketones reduce the need for glucose, easing demand for amino acids in gluconeogenesis.",
      physiological_effects: "Hour 36: Lean tissue is maintained while fat stores are used. If you train, keep volume light; recovery capacity is different without incoming calories.",
      mental_emotional_state: ["Focus is steady", "motivation for intense tasks may dip", "Sleep may feel lighter as catecholamines rise; a wind‑down routine and cool room can help"],
      benefits_challenges: "Benefit: Muscle preservation with continued fat use.\nChallenge: Don't chase PRs—favor technique and mobility.",
      content_snippet: "Hour 36: Protein‑sparing, GH support — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 37,
      stage: "Cellular cleanup deepens",
      metabolic_changes: "With insulin low and ketones steady, cleanup and recycling processes stay active. IGF‑1 signaling drifts lower, nudging the body toward maintenance over growth.",
      physiological_effects: "Hour 37: Immune cell housekeeping continues; older cells are culled and replaced over time. Joints may feel looser; bloating is typically reduced.",
      mental_emotional_state: ["Calm, even moods are common", "Dream recall can increase; if sleep is choppy, aim for consistent bed/wake times"],
      benefits_challenges: "Benefit: Ongoing immune housekeeping; debloating.\nChallenge: Feeling cold; add layers and warm, non‑caloric drinks.",
      content_snippet: "Hour 37: Cellular cleanup deepens — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 38,
      stage: "Cellular cleanup deepens",
      metabolic_changes: "With insulin low and ketones steady, cleanup and recycling processes stay active. IGF‑1 signaling drifts lower, nudging the body toward maintenance over growth.",
      physiological_effects: "Hour 38: Immune cell housekeeping continues; older cells are culled and replaced over time. Joints may feel looser; bloating is typically reduced.",
      mental_emotional_state: ["Calm, even moods are common", "If you wake early, low‑intensity movement the next day often restores sleep pressure"],
      benefits_challenges: "Benefit: Ongoing immune housekeeping; debloating.\nChallenge: Feeling cold; add layers and warm, non‑caloric drinks.",
      content_snippet: "Hour 38: Cellular cleanup deepens — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 39,
      stage: "Cellular cleanup deepens",
      metabolic_changes: "With insulin low and ketones steady, cleanup and recycling processes stay active. IGF‑1 signaling drifts lower, nudging the body toward maintenance over growth.",
      physiological_effects: "Hour 39: Immune cell housekeeping continues; older cells are culled and replaced over time. Joints may feel looser; bloating is typically reduced.",
      mental_emotional_state: ["Calm, even moods are common", "Sleep may feel lighter as catecholamines rise; a wind‑down routine and cool room can help"],
      benefits_challenges: "Benefit: Ongoing immune housekeeping; debloating.\nChallenge: Feeling cold; add layers and warm, non‑caloric drinks.",
      content_snippet: "Hour 39: Cellular cleanup deepens — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 40,
      stage: "Cellular cleanup deepens",
      metabolic_changes: "With insulin low and ketones steady, cleanup and recycling processes stay active. IGF‑1 signaling drifts lower, nudging the body toward maintenance over growth.",
      physiological_effects: "Hour 40: Immune cell housekeeping continues; older cells are culled and replaced over time. Joints may feel looser; bloating is typically reduced.",
      mental_emotional_state: ["Calm, even moods are common", "Early nights sometimes bring restlessness; breathing drills or a short walk may steady you"],
      benefits_challenges: "Benefit: Ongoing immune housekeeping; debloating.\nChallenge: Feeling cold; add layers and warm, non‑caloric drinks.",
      content_snippet: "Hour 40: Cellular cleanup deepens — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 41,
      stage: "Low IGF‑1 signal, steady ketones",
      metabolic_changes: "mTOR stays quiet; AMPK and sirtuin pathways have the upper hand. Ketone availability is high and stable; fat stores are the main fuel.",
      physiological_effects: "Hour 41: Tissues operate on a 'maintenance and repair' setting. Blood pressure can sit slightly lower; rise from chairs slowly to avoid dizziness.",
      mental_emotional_state: ["You may feel inward‑focused and reflective", "If you wake early, low‑intensity movement the next day often restores sleep pressure"],
      benefits_challenges: "Benefit: Repair‑over‑growth bias continues.\nChallenge: Lower blood pressure sensations; monitor how you feel.",
      content_snippet: "Hour 41: Low IGF‑1 signal, steady ketones — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 42,
      stage: "Low IGF‑1 signal, steady ketones",
      metabolic_changes: "mTOR stays quiet; AMPK and sirtuin pathways have the upper hand. Ketone availability is high and stable; fat stores are the main fuel.",
      physiological_effects: "Hour 42: Tissues operate on a 'maintenance and repair' setting. Blood pressure can sit slightly lower; rise from chairs slowly to avoid dizziness.",
      mental_emotional_state: ["You may feel inward‑focused and reflective", "Sleep may feel lighter as catecholamines rise; a wind‑down routine and cool room can help"],
      benefits_challenges: "Benefit: Repair‑over‑growth bias continues.\nChallenge: Lower blood pressure sensations; monitor how you feel.",
      content_snippet: "Hour 42: Low IGF‑1 signal, steady ketones — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 43,
      stage: "Low IGF‑1 signal, steady ketones",
      metabolic_changes: "mTOR stays quiet; AMPK and sirtuin pathways have the upper hand. Ketone availability is high and stable; fat stores are the main fuel.",
      physiological_effects: "Hour 43: Tissues operate on a 'maintenance and repair' setting. Blood pressure can sit slightly lower; rise from chairs slowly to avoid dizziness.",
      mental_emotional_state: ["You may feel inward‑focused and reflective", "Early nights sometimes bring restlessness; breathing drills or a short walk may steady you"],
      benefits_challenges: "Benefit: Repair‑over‑growth bias continues.\nChallenge: Lower blood pressure sensations; monitor how you feel.",
      content_snippet: "Hour 43: Low IGF‑1 signal, steady ketones — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 44,
      stage: "Low IGF‑1 signal, steady ketones",
      metabolic_changes: "mTOR stays quiet; AMPK and sirtuin pathways have the upper hand. Ketone availability is high and stable; fat stores are the main fuel.",
      physiological_effects: "Hour 44: Tissues operate on a 'maintenance and repair' setting. Blood pressure can sit slightly lower; rise from chairs slowly to avoid dizziness.",
      mental_emotional_state: ["You may feel inward‑focused and reflective", "Dream recall can increase; if sleep is choppy, aim for consistent bed/wake times"],
      benefits_challenges: "Benefit: Repair‑over‑growth bias continues.\nChallenge: Lower blood pressure sensations; monitor how you feel.",
      content_snippet: "Hour 44: Low IGF‑1 signal, steady ketones — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 45,
      stage: "48‑hour milestone",
      metabolic_changes: "Two days in, insulin sensitivity generally improves. Inflammatory signaling may be lower. The endocrine picture is 'low‑insulin, low‑IGF‑1, high‑fat‑use'.",
      physiological_effects: "Hour 45: Gut is quiet; gastric acid and enzymes are at rest. Electrolytes matter more now—add a pinch of salt to water if headaches appear.",
      mental_emotional_state: ["Satisfaction from progress can boost mood", "plan something relaxing tonight", "Sleep may feel lighter as catecholamines rise; a wind‑down routine and cool room can help"],
      benefits_challenges: "Benefit: Noticeable insulin‑sensitivity and appetite control.\nChallenge: Sleep can be light—prioritize wind‑down and magnesium if appropriate.",
      content_snippet: "Hour 45: 48‑hour milestone — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 46,
      stage: "48‑hour milestone",
      metabolic_changes: "Two days in, insulin sensitivity generally improves. Inflammatory signaling may be lower. The endocrine picture is 'low‑insulin, low‑IGF‑1, high‑fat‑use'.",
      physiological_effects: "Hour 46: Gut is quiet; gastric acid and enzymes are at rest. Electrolytes matter more now—add a pinch of salt to water if headaches appear.",
      mental_emotional_state: ["Satisfaction from progress can boost mood", "plan something relaxing tonight", "Early nights sometimes bring restlessness; breathing drills or a short walk may steady you"],
      benefits_challenges: "Benefit: Noticeable insulin‑sensitivity and appetite control.\nChallenge: Sleep can be light—prioritize wind‑down and magnesium if appropriate.",
      content_snippet: "Hour 46: 48‑hour milestone — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 47,
      stage: "48‑hour milestone",
      metabolic_changes: "Two days in, insulin sensitivity generally improves. Inflammatory signaling may be lower. The endocrine picture is 'low‑insulin, low‑IGF‑1, high‑fat‑use'.",
      physiological_effects: "Hour 47: Gut is quiet; gastric acid and enzymes are at rest. Electrolytes matter more now—add a pinch of salt to water if headaches appear.",
      mental_emotional_state: ["Satisfaction from progress can boost mood", "plan something relaxing tonight", "Dream recall can increase; if sleep is choppy, aim for consistent bed/wake times"],
      benefits_challenges: "Benefit: Noticeable insulin‑sensitivity and appetite control.\nChallenge: Sleep can be light—prioritize wind‑down and magnesium if appropriate.",
      content_snippet: "Hour 47: 48‑hour milestone — fat‑burn rises, insulin stays low, and focus gets steadier."
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
          difficulty: item.hour <= 16 ? 'easy' : item.hour <= 48 ? 'medium' : 'hard',
          autophagy_milestone: item.hour >= 29 && item.hour <= 32,
          ketosis_milestone: item.hour >= 17 && item.hour <= 23,
          fat_burning_milestone: item.hour >= 25 && item.hour <= 28
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

  console.log(`Second batch import completed: ${successCount} success, ${errorCount} errors`);
  return { success: successCount, errors: errorCount };
};

// Auto-import when this file loads
importSecond24Hours().then(result => {
  console.log('Hours 24-47 imported:', result);
});