import { supabase } from '@/integrations/supabase/client';

// Final batch: Hours 48-72
const importFinal24Hours = async () => {
  const batchData = [
    {
      hour: 48,
      stage: "48‑hour milestone",
      metabolic_changes: "Two days in, insulin sensitivity generally improves. Inflammatory signaling may be lower. The endocrine picture is 'low‑insulin, low‑IGF‑1, high‑fat‑use'.",
      physiological_effects: "Hour 48: Gut is quiet; gastric acid and enzymes are at rest. Electrolytes matter more now—add a pinch of salt to water if headaches appear.",
      mental_emotional_state: ["Satisfaction from progress can boost mood", "plan something relaxing tonight", "If you wake early, low‑intensity movement the next day often restores sleep pressure"],
      benefits_challenges: "Benefit: Noticeable insulin‑sensitivity and appetite control.\nChallenge: Sleep can be light—prioritize wind‑down and magnesium if appropriate.",
      content_snippet: "Hour 48: 48‑hour milestone — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 49,
      stage: "Day 3: maintenance on ketones",
      metabolic_changes: "Your brain is comfortable on ketones; glucose needs are mostly covered by the liver. Thyroid T3 may tick down slightly as a normal conservation signal.",
      physiological_effects: "Hour 49: You're running comfortably on internal fuel. Some people notice cooler hands/feet as the body conserves heat.",
      mental_emotional_state: ["Clarity continues, though patience for stress might be lower", "Once your body switches to fat, the brain runs smoothly on ketones and glucose made by the liver"],
      benefits_challenges: "Benefit: Very stable energy and calm mind.\nChallenge: Training intensity must stay modest; protect joints.",
      content_snippet: "Hour 49: Day 3: maintenance on ketones — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 50,
      stage: "Day 3: maintenance on ketones",
      metabolic_changes: "Your brain is comfortable on ketones; glucose needs are mostly covered by the liver. Thyroid T3 may tick down slightly as a normal conservation signal.",
      physiological_effects: "Hour 50: You're running comfortably on internal fuel. Some people notice cooler hands/feet as the body conserves heat.",
      mental_emotional_state: ["Clarity continues, though patience for stress might be lower", "Stable energy replaces post‑meal dips, which can feel surprisingly calm"],
      benefits_challenges: "Benefit: Very stable energy and calm mind.\nChallenge: Training intensity must stay modest; protect joints.",
      content_snippet: "Hour 50: Day 3: maintenance on ketones — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 51,
      stage: "Day 3: maintenance on ketones",
      metabolic_changes: "Your brain is comfortable on ketones; glucose needs are mostly covered by the liver. Thyroid T3 may tick down slightly as a normal conservation signal.",
      physiological_effects: "Hour 51: You're running comfortably on internal fuel. Some people notice cooler hands/feet as the body conserves heat.",
      mental_emotional_state: ["Clarity continues, though patience for stress might be lower", "Mood often flattens—in a good way—as blood sugar swings are reduced"],
      benefits_challenges: "Benefit: Very stable energy and calm mind.\nChallenge: Training intensity must stay modest; protect joints.",
      content_snippet: "Hour 51: Day 3: maintenance on ketones — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 52,
      stage: "Day 3: maintenance on ketones",
      metabolic_changes: "Your brain is comfortable on ketones; glucose needs are mostly covered by the liver. Thyroid T3 may tick down slightly as a normal conservation signal.",
      physiological_effects: "Hour 52: You're running comfortably on internal fuel. Some people notice cooler hands/feet as the body conserves heat.",
      mental_emotional_state: ["Clarity continues, though patience for stress might be lower", "Many report a clean, 'even' focus from steady ketones"],
      benefits_challenges: "Benefit: Very stable energy and calm mind.\nChallenge: Training intensity must stay modest; protect joints.",
      content_snippet: "Hour 52: Day 3: maintenance on ketones — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 53,
      stage: "Ongoing repair; watch electrolytes",
      metabolic_changes: "Hormones remain in a maintenance pattern: low insulin, steady glucagon, adequate catecholamines. Autophagy‑related pathways likely remain active, though exact human timing varies.",
      physiological_effects: "Hour 53: Tendon and connective‑tissue turnover benefits from the 'repair over growth' bias. Cramps hint at low minerals—magnesium/potassium help if your clinician agrees.",
      mental_emotional_state: ["If mood dips, it's often minerals or sleep—address those inputs first", "Sodium and potassium needs rise slightly because insulin is low and the kidneys excrete more salt"],
      benefits_challenges: "Benefit: Continued cellular maintenance.\nChallenge: Cramps or palpitations suggest low minerals—address electrolytes.",
      content_snippet: "Hour 53: Ongoing repair; watch electrolytes — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 54,
      stage: "Ongoing repair; watch electrolytes",
      metabolic_changes: "Hormones remain in a maintenance pattern: low insulin, steady glucagon, adequate catecholamines. Autophagy‑related pathways likely remain active, though exact human timing varies.",
      physiological_effects: "Hour 54: Tendon and connective‑tissue turnover benefits from the 'repair over growth' bias. Cramps hint at low minerals—magnesium/potassium help if your clinician agrees.",
      mental_emotional_state: ["If mood dips, it's often minerals or sleep—address those inputs first", "If you feel dizzy standing up, consider electrolytes and slower position changes"],
      benefits_challenges: "Benefit: Continued cellular maintenance.\nChallenge: Cramps or palpitations suggest low minerals—address electrolytes.",
      content_snippet: "Hour 54: Ongoing repair; watch electrolytes — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 55,
      stage: "Ongoing repair; watch electrolytes",
      metabolic_changes: "Hormones remain in a maintenance pattern: low insulin, steady glucagon, adequate catecholamines. Autophagy‑related pathways likely remain active, though exact human timing varies.",
      physiological_effects: "Hour 55: Tendon and connective‑tissue turnover benefits from the 'repair over growth' bias. Cramps hint at low minerals—magnesium/potassium help if your clinician agrees.",
      mental_emotional_state: ["If mood dips, it's often minerals or sleep—address those inputs first", "A pinch of salt under the tongue or mineral water may quickly settle lightheadedness"],
      benefits_challenges: "Benefit: Continued cellular maintenance.\nChallenge: Cramps or palpitations suggest low minerals—address electrolytes.",
      content_snippet: "Hour 55: Ongoing repair; watch electrolytes — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 56,
      stage: "Ongoing repair; watch electrolytes",
      metabolic_changes: "Hormones remain in a maintenance pattern: low insulin, steady glucagon, adequate catecholamines. Autophagy‑related pathways likely remain active, though exact human timing varies.",
      physiological_effects: "Hour 56: Tendon and connective‑tissue turnover benefits from the 'repair over growth' bias. Cramps hint at low minerals—magnesium/potassium help if your clinician agrees.",
      mental_emotional_state: ["If mood dips, it's often minerals or sleep—address those inputs first", "Light salt in water or broth can ease headaches and help maintain fluid balance"],
      benefits_challenges: "Benefit: Continued cellular maintenance.\nChallenge: Cramps or palpitations suggest low minerals—address electrolytes.",
      content_snippet: "Hour 56: Ongoing repair; watch electrolytes — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 57,
      stage: "Stable ketosis; system 'idling'",
      metabolic_changes: "Metabolism hums along on fat and ketones. Protein‑sparing continues; gluconeogenesis is modest and targeted to essentials.",
      physiological_effects: "Hour 57: Digestion is minimal; bowel movements may slow until re‑feeding. Hydrate steadily; clear urine is not required, pale straw is fine.",
      mental_emotional_state: ["Quiet confidence is typical", "social eating cues may be your main triggers now", "Hunger tends to arrive in brief waves tied to your usual meal times—if you wait 10–20 minutes, it often fades"],
      benefits_challenges: "Benefit: Digestive rest and reduced bloating.\nChallenge: Slower bowel movements—fiber on re‑feed will help.",
      content_snippet: "Hour 57: Stable ketosis; system 'idling' — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 58,
      stage: "Stable ketosis; system 'idling'",
      metabolic_changes: "Metabolism hums along on fat and ketones. Protein‑sparing continues; gluconeogenesis is modest and targeted to essentials.",
      physiological_effects: "Hour 58: Digestion is minimal; bowel movements may slow until re‑feeding. Hydrate steadily; clear urine is not required, pale straw is fine.",
      mental_emotional_state: ["Quiet confidence is typical", "social eating cues may be your main triggers now", "Cravings are often cue-driven: smells, social cues, and the clock. A short walk or a glass of water usually helps"],
      benefits_challenges: "Benefit: Digestive rest and reduced bloating.\nChallenge: Slower bowel movements—fiber on re‑feed will help.",
      content_snippet: "Hour 58: Stable ketosis; system 'idling' — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 59,
      stage: "Stable ketosis; system 'idling'",
      metabolic_changes: "Metabolism hums along on fat and ketones. Protein‑sparing continues; gluconeogenesis is modest and targeted to essentials.",
      physiological_effects: "Hour 59: Digestion is minimal; bowel movements may slow until re‑feeding. Hydrate steadily; clear urine is not required, pale straw is fine.",
      mental_emotional_state: ["Quiet confidence is typical", "social eating cues may be your main triggers now", "Ghrelin, the 'hunger hormone,' pulses around prior mealtimes. The signal rises and falls; distraction helps it pass"],
      benefits_challenges: "Benefit: Digestive rest and reduced bloating.\nChallenge: Slower bowel movements—fiber on re‑feed will help.",
      content_snippet: "Hour 59: Stable ketosis; system 'idling' — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 60,
      stage: "Stable ketosis; system 'idling'",
      metabolic_changes: "Metabolism hums along on fat and ketones. Protein‑sparing continues; gluconeogenesis is modest and targeted to essentials.",
      physiological_effects: "Hour 60: Digestion is minimal; bowel movements may slow until re‑feeding. Hydrate steadily; clear urine is not required, pale straw is fine.",
      mental_emotional_state: ["Quiet confidence is typical", "social eating cues may be your main triggers now", "Sips of water or unsweetened tea can blunt a hunger surge; most waves last only a few minutes"],
      benefits_challenges: "Benefit: Digestive rest and reduced bloating.\nChallenge: Slower bowel movements—fiber on re‑feed will help.",
      content_snippet: "Hour 60: Stable ketosis; system 'idling' — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 61,
      stage: "Conservation mode light",
      metabolic_changes: "The body economizes: thyroid activity and resting energy use can trend a bit lower. Leptin is reduced; appetite signals are calmer despite low food intake.",
      physiological_effects: "Hour 61: Non‑essential movements may feel less appealing; that's normal conservation. Keep activity gentle: walking, mobility work, light chores.",
      mental_emotional_state: ["Motivation for multitasking may drop", "keep expectations kind", "Many report a clean, 'even' focus from steady ketones"],
      benefits_challenges: "Benefit: Efficient fuel use; mental steadiness.\nChallenge: Motivation dips; keep tasks simple and time‑boxed.",
      content_snippet: "Hour 61: Conservation mode light — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 62,
      stage: "Conservation mode light",
      metabolic_changes: "The body economizes: thyroid activity and resting energy use can trend a bit lower. Leptin is reduced; appetite signals are calmer despite low food intake.",
      physiological_effects: "Hour 62: Non‑essential movements may feel less appealing; that's normal conservation. Keep activity gentle: walking, mobility work, light chores.",
      mental_emotional_state: ["Motivation for multitasking may drop", "keep expectations kind", "Once your body switches to fat, the brain runs smoothly on ketones and glucose made by the liver"],
      benefits_challenges: "Benefit: Efficient fuel use; mental steadiness.\nChallenge: Motivation dips; keep tasks simple and time‑boxed.",
      content_snippet: "Hour 62: Conservation mode light — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 63,
      stage: "Conservation mode light",
      metabolic_changes: "The body economizes: thyroid activity and resting energy use can trend a bit lower. Leptin is reduced; appetite signals are calmer despite low food intake.",
      physiological_effects: "Hour 63: Non‑essential movements may feel less appealing; that's normal conservation. Keep activity gentle: walking, mobility work, light chores.",
      mental_emotional_state: ["Motivation for multitasking may drop", "keep expectations kind", "Stable energy replaces post‑meal dips, which can feel surprisingly calm"],
      benefits_challenges: "Benefit: Efficient fuel use; mental steadiness.\nChallenge: Motivation dips; keep tasks simple and time‑boxed.",
      content_snippet: "Hour 63: Conservation mode light — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 64,
      stage: "Conservation mode light",
      metabolic_changes: "The body economizes: thyroid activity and resting energy use can trend a bit lower. Leptin is reduced; appetite signals are calmer despite low food intake.",
      physiological_effects: "Hour 64: Non‑essential movements may feel less appealing; that's normal conservation. Keep activity gentle: walking, mobility work, light chores.",
      mental_emotional_state: ["Motivation for multitasking may drop", "keep expectations kind", "Mood often flattens—in a good way—as blood sugar swings are reduced"],
      benefits_challenges: "Benefit: Efficient fuel use; mental steadiness.\nChallenge: Motivation dips; keep tasks simple and time‑boxed.",
      content_snippet: "Hour 64: Conservation mode light — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 65,
      stage: "Thyroid/T3 gently downshifts",
      metabolic_changes: "A gentle thyroid/T3 downshift may continue. Ketones plateau; insulin remains low. Stress hormones should be steady unless you over‑train or sleep poorly.",
      physiological_effects: "Hour 65: If you train, expect slower recovery. Protect sleep and keep stress low to avoid unnecessary cortisol spikes.",
      mental_emotional_state: ["Stay patient with yourself", "cognitive speed is fine, but 'drive' may soften", "If you wake early, low‑intensity movement the next day often restores sleep pressure"],
      benefits_challenges: "Benefit: Deep calm and low anxiety for many.\nChallenge: Feeling chilly or slower—normal at this stage.",
      content_snippet: "Hour 65: Thyroid/T3 gently downshifts — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 66,
      stage: "Thyroid/T3 gently downshifts",
      metabolic_changes: "A gentle thyroid/T3 downshift may continue. Ketones plateau; insulin remains low. Stress hormones should be steady unless you over‑train or sleep poorly.",
      physiological_effects: "Hour 66: If you train, expect slower recovery. Protect sleep and keep stress low to avoid unnecessary cortisol spikes.",
      mental_emotional_state: ["Stay patient with yourself", "cognitive speed is fine, but 'drive' may soften", "Sleep may feel lighter as catecholamines rise; a wind‑down routine and cool room can help"],
      benefits_challenges: "Benefit: Deep calm and low anxiety for many.\nChallenge: Feeling chilly or slower—normal at this stage.",
      content_snippet: "Hour 66: Thyroid/T3 gently downshifts — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 67,
      stage: "Thyroid/T3 gently downshifts",
      metabolic_changes: "A gentle thyroid/T3 downshift may continue. Ketones plateau; insulin remains low. Stress hormones should be steady unless you over‑train or sleep poorly.",
      physiological_effects: "Hour 67: If you train, expect slower recovery. Protect sleep and keep stress low to avoid unnecessary cortisol spikes.",
      mental_emotional_state: ["Stay patient with yourself", "cognitive speed is fine, but 'drive' may soften", "Early nights sometimes bring restlessness; breathing drills or a short walk may steady you"],
      benefits_challenges: "Benefit: Deep calm and low anxiety for many.\nChallenge: Feeling chilly or slower—normal at this stage.",
      content_snippet: "Hour 67: Thyroid/T3 gently downshifts — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 68,
      stage: "Thyroid/T3 gently downshifts",
      metabolic_changes: "A gentle thyroid/T3 downshift may continue. Ketones plateau; insulin remains low. Stress hormones should be steady unless you over‑train or sleep poorly.",
      physiological_effects: "Hour 68: If you train, expect slower recovery. Protect sleep and keep stress low to avoid unnecessary cortisol spikes.",
      mental_emotional_state: ["Stay patient with yourself", "cognitive speed is fine, but 'drive' may soften", "Dream recall can increase; if sleep is choppy, aim for consistent bed/wake times"],
      benefits_challenges: "Benefit: Deep calm and low anxiety for many.\nChallenge: Feeling chilly or slower—normal at this stage.",
      content_snippet: "Hour 68: Thyroid/T3 gently downshifts — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 69,
      stage: "Approach re‑feed",
      metabolic_changes: "Hormones are primed for a careful return to eating: insulin sensitivity is higher, and the gut is resting. Keep mTOR suppressed until re‑feed to maximize cleanup benefits.",
      physiological_effects: "Hour 69: Prepare the gut: plan a small, protein‑forward, low‑sugar first meal; chew well and eat slowly. Avoid a sudden carb flood to prevent discomfort.",
      mental_emotional_state: ["Anticipation can spike cravings", "review your re‑feed plan to stay calm and intentional", "Stable energy replaces post‑meal dips, which can feel surprisingly calm"],
      benefits_challenges: "Benefit: Strong appetite control going into re‑feed.\nChallenge: Avoid a large sugar hit first; reintroduce food gradually.",
      content_snippet: "Hour 69: Approach re‑feed — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 70,
      stage: "Approach re‑feed",
      metabolic_changes: "Hormones are primed for a careful return to eating: insulin sensitivity is higher, and the gut is resting. Keep mTOR suppressed until re‑feed to maximize cleanup benefits.",
      physiological_effects: "Hour 70: Prepare the gut: plan a small, protein‑forward, low‑sugar first meal; chew well and eat slowly. Avoid a sudden carb flood to prevent discomfort.",
      mental_emotional_state: ["Anticipation can spike cravings", "review your re‑feed plan to stay calm and intentional", "Mood often flattens—in a good way—as blood sugar swings are reduced"],
      benefits_challenges: "Benefit: Strong appetite control going into re‑feed.\nChallenge: Avoid a large sugar hit first; reintroduce food gradually.",
      content_snippet: "Hour 70: Approach re‑feed — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 71,
      stage: "Approach re‑feed",
      metabolic_changes: "Hormones are primed for a careful return to eating: insulin sensitivity is higher, and the gut is resting. Keep mTOR suppressed until re‑feed to maximize cleanup benefits.",
      physiological_effects: "Hour 71: Prepare the gut: plan a small, protein‑forward, low‑sugar first meal; chew well and eat slowly. Avoid a sudden carb flood to prevent discomfort.",
      mental_emotional_state: ["Anticipation can spike cravings", "review your re‑feed plan to stay calm and intentional", "Many report a clean, 'even' focus from steady ketones"],
      benefits_challenges: "Benefit: Strong appetite control going into re‑feed.\nChallenge: Avoid a large sugar hit first; reintroduce food gradually.",
      content_snippet: "Hour 71: Approach re‑feed — fat‑burn rises, insulin stays low, and focus gets steadier."
    },
    {
      hour: 72,
      stage: "Approach re‑feed",
      metabolic_changes: "Hormones are primed for a careful return to eating: insulin sensitivity is higher, and the gut is resting. Keep mTOR suppressed until re‑feed to maximize cleanup benefits.",
      physiological_effects: "Hour 72: Prepare the gut: plan a small, protein‑forward, low‑sugar first meal; chew well and eat slowly. Avoid a sudden carb flood to prevent discomfort.",
      mental_emotional_state: ["Anticipation can spike cravings", "review your re‑feed plan to stay calm and intentional", "Once your body switches to fat, the brain runs smoothly on ketones and glucose made by the liver"],
      benefits_challenges: "Benefit: Strong appetite control going into re‑feed.\nChallenge: Avoid a large sugar hit first; reintroduce food gradually.",
      content_snippet: "Hour 72: Approach re‑feed — fat‑burn rises, insulin stays low, and focus gets steadier."
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
          autophagy_milestone: (item.hour >= 53 && item.hour <= 56), // Ongoing repair phase
          ketosis_milestone: (item.hour >= 57 && item.hour <= 60), // Stable ketosis phase
          fat_burning_milestone: (item.hour >= 61 && item.hour <= 64) // Conservation mode
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

  console.log(`Final batch import completed: ${successCount} success, ${errorCount} errors`);
  return { success: successCount, errors: errorCount };
};

// Auto-import when this file loads
importFinal24Hours().then(result => {
  console.log('Hours 48-72 imported:', result);
});