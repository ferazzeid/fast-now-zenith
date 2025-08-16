-- Update all existing fasting hours data with comprehensive information
UPDATE fasting_hours 
SET 
  stage = CASE 
    WHEN hour <= 6 THEN 'Post-absorptive transition'
    WHEN hour <= 12 THEN 'Glycogen depletion begins'  
    WHEN hour <= 18 THEN 'Fat adaptation starts'
    WHEN hour <= 24 THEN 'Deepening ketosis, low insulin'
    WHEN hour <= 36 THEN 'Protein-sparing, GH support'
    WHEN hour <= 48 THEN '48-hour milestone'
    WHEN hour <= 60 THEN 'Stable ketosis; system idling'
    ELSE 'Approach re-feed'
  END,
  metabolic_changes = CASE 
    WHEN hour <= 6 THEN 'Blood glucose remains stable from recent meal; insulin begins to decline. The liver starts transitioning from glucose storage to glucose release.'
    WHEN hour <= 12 THEN 'Liver glycogen stores are being used up. Gluconeogenesis (making glucose from non-carb sources) increases. Fat oxidation rises.'
    WHEN hour <= 18 THEN 'Liver glycogen is largely depleted. The body increases fat burning and begins producing ketones. Insulin stays low.'
    WHEN hour <= 24 THEN 'Insulin and glucose sit near daily lows; glucagon, GH and noradrenaline support fat-to-ketone conversion. Gluconeogenesis covers essential glucose needs.'
    WHEN hour <= 36 THEN 'Growth hormone remains elevated versus fed state, encouraging fat use and limiting protein breakdown. Ketones reduce the need for glucose.'
    WHEN hour <= 48 THEN 'Two days in, insulin sensitivity generally improves. Inflammatory signaling may be lower. The endocrine picture is low-insulin, low-IGF-1, high-fat-use.'
    WHEN hour <= 60 THEN 'Metabolism hums along on fat and ketones. Protein-sparing continues; gluconeogenesis is modest and targeted to essentials.'
    ELSE 'Hormones are primed for a careful return to eating: insulin sensitivity is higher, and the gut is resting.'
  END,
  physiological_effects = CASE 
    WHEN hour <= 6 THEN 'Body feels normal after eating. Digestive system is actively processing food. No noticeable physical changes yet.'
    WHEN hour <= 12 THEN 'Energy may dip slightly as glycogen depletes. Some people notice mild hunger around usual meal times.'
    WHEN hour <= 18 THEN 'Breath may have a slight acetone smell from ketones. Energy levels often stabilize as fat burning increases.'
    WHEN hour <= 24 THEN 'Most day-to-day energy now comes from fat oxidation and ketones. Exercise intensity may feel harder; zone-2 work usually feels fine.'
    WHEN hour <= 36 THEN 'Lean tissue is maintained while fat stores are used. If you train, keep volume light; recovery capacity is different without incoming calories.'
    WHEN hour <= 48 THEN 'Gut is quiet; gastric acid and enzymes are at rest. Electrolytes matter more now—add a pinch of salt to water if headaches appear.'
    WHEN hour <= 60 THEN 'Digestion is minimal; bowel movements may slow until re-feeding. Hydrate steadily; clear urine is not required, pale straw is fine.'
    ELSE 'Prepare the gut: plan a small, protein-forward, low-sugar first meal; chew well and eat slowly. Avoid a sudden carb flood to prevent discomfort.'
  END,
  mental_emotional_state = CASE 
    WHEN hour <= 6 THEN ARRAY['Satisfaction from eating', 'Normal energy levels', 'Clear thinking']
    WHEN hour <= 12 THEN ARRAY['Mild hunger at meal times', 'Slight energy dip possible', 'Generally stable mood']
    WHEN hour <= 18 THEN ARRAY['Hunger becomes more noticeable', 'Mental clarity often improves', 'Sense of accomplishment grows']
    WHEN hour <= 24 THEN ARRAY['Confidence rises as hunger stabilizes', 'Mood often flattens in a good way', 'Reduced blood sugar swings']
    WHEN hour <= 36 THEN ARRAY['Focus is steady', 'Motivation for intense tasks may dip', 'Dreams may be more vivid']
    WHEN hour <= 48 THEN ARRAY['Satisfaction from progress can boost mood', 'Sleep may feel lighter', 'Mental spring-cleaning sensation']
    WHEN hour <= 60 THEN ARRAY['Quiet confidence is typical', 'Social eating cues may be main triggers', 'Calm focus from steady ketones']
    ELSE ARRAY['Anticipation can spike cravings', 'Review re-feed plan to stay calm', 'Strong sense of accomplishment']
  END,
  benefits_challenges = CASE 
    WHEN hour <= 6 THEN 'Benefit: Easy transition period with stable energy.\nChallenge: Potential for food cravings if you normally eat frequently.'
    WHEN hour <= 12 THEN 'Benefit: Beginning to tap into stored energy.\nChallenge: Mild hunger and potential energy dips.'
    WHEN hour <= 18 THEN 'Benefit: Fat burning increases, mental clarity improves.\nChallenge: Noticeable hunger, social meal situations.'
    WHEN hour <= 24 THEN 'Benefit: Insulin sensitivity improves, inflammation signals may ease.\nChallenge: Orthostatic dizziness—stand up slowly and mind electrolytes.'
    WHEN hour <= 36 THEN 'Benefit: Muscle preservation with continued fat use.\nChallenge: Do not chase PRs—favor technique and mobility.'
    WHEN hour <= 48 THEN 'Benefit: Noticeable insulin-sensitivity and appetite control.\nChallenge: Sleep can be light—prioritize wind-down and magnesium if appropriate.'
    WHEN hour <= 60 THEN 'Benefit: Digestive rest and reduced bloating.\nChallenge: Slower bowel movements—fiber on re-feed will help.'
    ELSE 'Benefit: Strong appetite control going into re-feed.\nChallenge: Avoid a large sugar hit first; reintroduce food gradually.'
  END,
  content_snippet = CONCAT('Hour ', hour, ': ', 
    CASE 
      WHEN hour <= 6 THEN 'Post-absorptive transition'
      WHEN hour <= 12 THEN 'Glycogen depletion begins'  
      WHEN hour <= 18 THEN 'Fat adaptation starts'
      WHEN hour <= 24 THEN 'Deepening ketosis, low insulin'
      WHEN hour <= 36 THEN 'Protein-sparing, GH support'
      WHEN hour <= 48 THEN '48-hour milestone'
      WHEN hour <= 60 THEN 'Stable ketosis; system idling'
      ELSE 'Approach re-feed'
    END, ' — fat-burn rises, insulin stays low, and focus gets steadier.')
WHERE hour BETWEEN 1 AND 72;