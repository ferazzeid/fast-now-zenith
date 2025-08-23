-- Update fasting hours with new stage-based content
-- Hour 1-6: Glycogen Kickoff
UPDATE fasting_hours SET 
  title = 'Glycogen Kickoff',
  encouragement = 'Early fasting uses liver glycogen to stabilize blood glucose as insulin declines. Short craving waves are habit-driven; sip water and add a small salt pinch.',
  stage = 'Glycogen Kickoff',
  body_state = 'Early fasting phase using liver glycogen stores'
WHERE hour = 1;

UPDATE fasting_hours SET 
  title = 'Glycogen Kickoff',
  encouragement = 'Ghrelin rises at usual meal times but fades quickly if not reinforced. A brief walk or task-switching helps attention move away from food.',
  stage = 'Glycogen Kickoff',
  body_state = 'Ghrelin peaks at meal times but subsides'
WHERE hour = 2;

UPDATE fasting_hours SET 
  title = 'Glycogen Kickoff',
  encouragement = 'Sodium losses increase with lower insulin, so modest salt can prevent lightheadedness. Choose water, black coffee, or unsweetened tea.',
  stage = 'Glycogen Kickoff',
  body_state = 'Increased sodium needs as insulin drops'
WHERE hour = 3;

UPDATE fasting_hours SET 
  title = 'Glycogen Kickoff',
  encouragement = 'Low-intensity activity preserves comfort and helps regulate appetite signals. Save vigorous exercise for fed days or later fast stages if experienced.',
  stage = 'Glycogen Kickoff',
  body_state = 'Gentle activity supports appetite regulation'
WHERE hour = 4;

UPDATE fasting_hours SET 
  title = 'Glycogen Kickoff',
  encouragement = 'Urges often crest and fall like a tide rather than steadily climbing. Use a short, planned distraction—walk, shower, or tidy—to ride it out.',
  stage = 'Glycogen Kickoff',
  body_state = 'Hunger waves come and go naturally'
WHERE hour = 5;

UPDATE fasting_hours SET 
  title = 'Glycogen Kickoff',
  encouragement = 'Reduced evening caffeine and consistent bedtime improve adaptation. Limit kitchen exposure at night to avoid conditioned eating triggers.',
  stage = 'Glycogen Kickoff',
  body_state = 'Sleep quality supports fasting adaptation'
WHERE hour = 6;

-- Hour 7-12: Early Glycogen Drawdown
UPDATE fasting_hours SET 
  title = 'Early Glycogen Drawdown',
  encouragement = 'Hormonal balance tilts toward mobilizing stored fuels. Most people feel steady, with occasional mild emptiness rather than strong hunger.',
  stage = 'Early Glycogen Drawdown',
  body_state = 'Hormones shift to mobilize stored energy'
WHERE hour = 7;

UPDATE fasting_hours SET 
  title = 'Early Glycogen Drawdown',
  encouragement = 'The liver recycles lactate from muscle and glycerol from fat breakdown into glucose. This maintains essentials without constant eating.',
  stage = 'Early Glycogen Drawdown',
  body_state = 'Liver creates glucose from internal sources'
WHERE hour = 8;

UPDATE fasting_hours SET 
  title = 'Early Glycogen Drawdown',
  encouragement = 'Falling insulin increases sodium excretion, so salt helps. Magnesium supports muscle relaxation; potassium should be moderate and within guidelines.',
  stage = 'Early Glycogen Drawdown',
  body_state = 'Electrolyte balance shifts with insulin changes'
WHERE hour = 9;

UPDATE fasting_hours SET 
  title = 'Early Glycogen Drawdown',
  encouragement = 'Mild cold sensation is common and not dangerous for healthy adults. Extra layers or warm tea restore comfort without breaking the fast.',
  stage = 'Early Glycogen Drawdown',
  body_state = 'Mild temperature sensitivity is normal'
WHERE hour = 10;

UPDATE fasting_hours SET 
  title = 'Early Glycogen Drawdown',
  encouragement = 'Hunger peaks are brief; clarity usually follows. Batch focused work after waves pass to harness this predictable rhythm.',
  stage = 'Early Glycogen Drawdown',
  body_state = 'Brief hunger followed by mental clarity'
WHERE hour = 11;

UPDATE fasting_hours SET 
  title = 'Early Glycogen Drawdown',
  encouragement = 'Avoid maximal efforts while your fuel mix is shifting. Gentle walks, mobility work, or chores fit well here.',
  stage = 'Early Glycogen Drawdown',
  body_state = 'Energy systems are adapting to new fuel mix'
WHERE hour = 12;

-- Hour 13-18: Steady Glycogen Use
UPDATE fasting_hours SET 
  title = 'Steady Glycogen Use',
  encouragement = 'Hormones promote lipolysis, supplying tissues with fatty acids. This relieves pressure on glycogen and keeps energy stable.',
  stage = 'Steady Glycogen Use',
  body_state = 'Fat breakdown supplies steady energy'
WHERE hour = 13;

UPDATE fasting_hours SET 
  title = 'Steady Glycogen Use',
  encouragement = 'Non-caloric sweet taste can trigger anticipatory responses for some. If cravings spike, switch to plain beverages temporarily.',
  stage = 'Steady Glycogen Use',
  body_state = 'Sweet tastes may trigger cravings'
WHERE hour = 14;

UPDATE fasting_hours SET 
  title = 'Steady Glycogen Use',
  encouragement = 'Standing, stretching, or walking five minutes reduces perceived hunger. Movement blunts boredom-based snacking urges.',
  stage = 'Steady Glycogen Use',
  body_state = 'Movement reduces hunger perception'
WHERE hour = 15;

UPDATE fasting_hours SET 
  title = 'Steady Glycogen Use',
  encouragement = 'The body prioritizes fatty acids for fuel, sparing lean tissue in healthy adults. Adequate rest further protects muscle.',
  stage = 'Steady Glycogen Use',
  body_state = 'Fat becomes primary fuel, muscle preserved'
WHERE hour = 16;

UPDATE fasting_hours SET 
  title = 'Steady Glycogen Use',
  encouragement = 'Without food buffering, caffeine can hit faster. Prefer smaller servings earlier in the day to protect sleep.',
  stage = 'Steady Glycogen Use',
  body_state = 'Caffeine effects are more pronounced'
WHERE hour = 17;

UPDATE fasting_hours SET 
  title = 'Steady Glycogen Use',
  encouragement = 'Visual and olfactory cues amplify cravings. Choose non-food entertainment and set the kitchen dark or closed if possible.',
  stage = 'Steady Glycogen Use',
  body_state = 'Food cues trigger stronger responses'
WHERE hour = 18;

-- Hour 19-24: Glycogen Tightening
UPDATE fasting_hours SET 
  title = 'Glycogen Tightening',
  encouragement = 'As stores dip, the liver leans more on gluconeogenesis. Energy remains steady as fat use ramps further.',
  stage = 'Glycogen Tightening',
  body_state = 'Liver increases glucose production from other sources'
WHERE hour = 19;

UPDATE fasting_hours SET 
  title = 'Glycogen Tightening',
  encouragement = 'Orthostatic dips are common with salt loss. Sit, hydrate, and include a pinch of salt to normalize.',
  stage = 'Glycogen Tightening',
  body_state = 'Blood pressure may drop when standing'
WHERE hour = 20;

UPDATE fasting_hours SET 
  title = 'Glycogen Tightening',
  encouragement = 'A clear bedtime routine improves overnight adaptation. Journaling or a warm shower helps quiet mealtime associations.',
  stage = 'Glycogen Tightening',
  body_state = 'Evening routine supports adaptation'
WHERE hour = 21;

UPDATE fasting_hours SET 
  title = 'Glycogen Tightening',
  encouragement = 'Fasting favors hormonal patterns that support fat use and muscle maintenance. Prioritize rest to align with these signals.',
  stage = 'Glycogen Tightening',
  body_state = 'Hormones optimize for fat burning'
WHERE hour = 22;

UPDATE fasting_hours SET 
  title = 'Glycogen Tightening',
  encouragement = 'Decision fatigue amplifies urges at night. Commit to a prewritten plan and remove exposure to tempting cues.',
  stage = 'Glycogen Tightening',
  body_state = 'Evening decision fatigue increases urges'
WHERE hour = 23;

UPDATE fasting_hours SET 
  title = 'Glycogen Tightening',
  encouragement = 'A full day completed—physiology favors stored fuel more clearly now. Continue water and salt; expect calmer appetite tomorrow.',
  stage = 'Glycogen Tightening',
  body_state = '24-hour milestone - metabolism shifted to stored fuel'
WHERE hour = 24;

-- Hour 25-30: Late Glycogen Squeeze
UPDATE fasting_hours SET 
  title = 'Late Glycogen Squeeze',
  encouragement = 'Lactate, glycerol, and some amino acids provide glucose for essential needs. Most energy increasingly comes from fat.',
  stage = 'Late Glycogen Squeeze',
  body_state = 'Multiple pathways maintain glucose while fat dominates'
WHERE hour = 25;

UPDATE fasting_hours SET 
  title = 'Late Glycogen Squeeze',
  encouragement = 'Without mealtime spikes, energy steadies. Use predictable windows for focused work or gentle outdoor activity.',
  stage = 'Late Glycogen Squeeze',
  body_state = 'Stable energy without meal fluctuations'
WHERE hour = 26;

UPDATE fasting_hours SET 
  title = 'Late Glycogen Squeeze',
  encouragement = 'Balance water with sodium to avoid headaches and fatigue. Aim for light-yellow urine rather than crystal clear.',
  stage = 'Late Glycogen Squeeze',
  body_state = 'Proper hydration prevents common symptoms'
WHERE hour = 27;

UPDATE fasting_hours SET 
  title = 'Late Glycogen Squeeze',
  encouragement = 'Introducing stimulants or new compounds complicates feedback. Consistency helps you separate true hunger from habit.',
  stage = 'Late Glycogen Squeeze',
  body_state = 'Consistent routine clarifies hunger signals'
WHERE hour = 28;

UPDATE fasting_hours SET 
  title = 'Late Glycogen Squeeze',
  encouragement = 'Low-intensity activity complements shifting fuel use. Intense sessions are better after refeed or with experience.',
  stage = 'Late Glycogen Squeeze',
  body_state = 'Gentle activity matches current fuel state'
WHERE hour = 29;

UPDATE fasting_hours SET 
  title = 'Late Glycogen Squeeze',
  encouragement = 'Many report easier focus once routine solidifies. Use clear times to plan tomorrow''s schedule and simple environment.',
  stage = 'Late Glycogen Squeeze',
  body_state = 'Mental focus improves with routine'
WHERE hour = 30;

-- Hour 31-36: Transition Signals Begin
UPDATE fasting_hours SET 
  title = 'Transition Signals Begin',
  encouragement = 'The liver starts producing measurable ketones from fatty acids. Appetite typically softens as brain fuel becomes more diverse.',
  stage = 'Transition Signals Begin',
  body_state = 'Ketone production begins, appetite softens'
WHERE hour = 31;

UPDATE fasting_hours SET 
  title = 'Transition Signals Begin',
  encouragement = 'Acetone is a ketone byproduct and harmless at low levels. Hydration and fresh air reduce noticeable breath changes.',
  stage = 'Transition Signals Begin',
  body_state = 'Mild ketone breath is normal and harmless'
WHERE hour = 32;

UPDATE fasting_hours SET 
  title = 'Transition Signals Begin',
  encouragement = 'Keep salt modest but consistent unless medically restricted. This simple step prevents many avoidable symptoms.',
  stage = 'Transition Signals Begin',
  body_state = 'Consistent salt intake prevents symptoms'
WHERE hour = 33;

UPDATE fasting_hours SET 
  title = 'Transition Signals Begin',
  encouragement = 'Muscle prefers fat when insulin is low. Glucose is conserved for red blood cells and specific brain needs.',
  stage = 'Transition Signals Begin',
  body_state = 'Muscle uses fat, glucose reserved for essentials'
WHERE hour = 34;

UPDATE fasting_hours SET 
  title = 'Transition Signals Begin',
  encouragement = 'As ketones rise, many report smoother concentration. Use this period for deliberate, non-food routines and light tasks.',
  stage = 'Transition Signals Begin',
  body_state = 'Ketones support smoother concentration'
WHERE hour = 35;

UPDATE fasting_hours SET 
  title = 'Transition Signals Begin',
  encouragement = 'With glycogen tighter, fat-derived fuels carry more load. Continue electrolytes and gentle movement for comfort.',
  stage = 'Transition Signals Begin',
  body_state = 'Fat-derived fuels increasingly dominant'
WHERE hour = 36;

-- Hour 37-45: Ketone Onset
UPDATE fasting_hours SET 
  title = 'Ketone Onset',
  encouragement = 'Beta-hydroxybutyrate supports brain energy alongside glucose. Many feel calmer and less preoccupied with food.',
  stage = 'Ketone Onset',
  body_state = 'Ketones provide brain energy, reducing food thoughts'
WHERE hour = 37;

UPDATE fasting_hours SET 
  title = 'Ketone Onset',
  encouragement = 'Mildly lower glucose during fasting is expected. Focus on symptoms and routine rather than frequent measurements.',
  stage = 'Ketone Onset',
  body_state = 'Slightly lower glucose is normal during fasting'
WHERE hour = 38;

UPDATE fasting_hours SET 
  title = 'Ketone Onset',
  encouragement = 'These basics resolve most transient complaints. Keep evenings simple and screens dim to protect sleep quality.',
  stage = 'Ketone Onset',
  body_state = 'Evening routine protects sleep during adaptation'
WHERE hour = 39;

UPDATE fasting_hours SET 
  title = 'Ketone Onset',
  encouragement = 'Fat oxidation suits steady work. Reserve intense intervals until refeed unless you are highly adapted.',
  stage = 'Ketone Onset',
  body_state = 'Fat burning supports steady activity'
WHERE hour = 40;

UPDATE fasting_hours SET 
  title = 'Ketone Onset',
  encouragement = 'The gut gets a break from mechanical and chemical load. Many notice decreased reflux and improved comfort.',
  stage = 'Ketone Onset',
  body_state = 'Digestive system rests and recovers'
WHERE hour = 41;

UPDATE fasting_hours SET 
  title = 'Ketone Onset',
  encouragement = 'Clarity without constant eating decisions can be refreshing. Use a checklist so structure replaces old food cues.',
  stage = 'Ketone Onset',
  body_state = 'Mental clarity from reduced decision fatigue'
WHERE hour = 42;

UPDATE fasting_hours SET 
  title = 'Ketone Onset',
  encouragement = 'Short-term shifts occur as fuels change. Staying well hydrated supports kidneys and overall comfort.',
  stage = 'Ketone Onset',
  body_state = 'Fuel transitions require good hydration'
WHERE hour = 43;

UPDATE fasting_hours SET 
  title = 'Ketone Onset',
  encouragement = 'Conditioned responses weaken with repetition. Reinforce success by avoiding food imagery during vulnerable windows.',
  stage = 'Ketone Onset',
  body_state = 'Food conditioning weakens with practice'
WHERE hour = 44;

UPDATE fasting_hours SET 
  title = 'Ketone Onset',
  encouragement = 'Fuel flexibility is established for most healthy adults. Maintain basics and continue gentle, regular movement.',
  stage = 'Ketone Onset',
  body_state = 'Metabolic flexibility well established'
WHERE hour = 45;

-- Hour 46-54: Ketone Ramp-Up
UPDATE fasting_hours SET 
  title = 'Ketone Ramp-Up',
  encouragement = 'Many notice stable productivity with fewer dips. Keep salt consistent to avoid late-day fatigue.',
  stage = 'Ketone Ramp-Up',
  body_state = 'Stable productivity without energy dips'
WHERE hour = 46;

UPDATE fasting_hours SET 
  title = 'Ketone Ramp-Up',
  encouragement = 'Reduced insulin variability removes some cognitive noise. Use timers to alternate deep work with short movement breaks.',
  stage = 'Ketone Ramp-Up',
  body_state = 'Stable insulin improves cognitive function'
WHERE hour = 47;

UPDATE fasting_hours SET 
  title = 'Ketone Ramp-Up',
  encouragement = 'This is a common milestone for clear ketone benefits. Continue to prioritize sleep and low-stress routines.',
  stage = 'Ketone Ramp-Up',
  body_state = '48-hour milestone - clear ketone benefits'
WHERE hour = 48;

UPDATE fasting_hours SET 
  title = 'Ketone Ramp-Up',
  encouragement = 'Thermoregulation can feel different during fasting. Warm fluids and light movement restore comfort quickly.',
  stage = 'Ketone Ramp-Up',
  body_state = 'Temperature regulation may feel different'
WHERE hour = 49;

UPDATE fasting_hours SET 
  title = 'Ketone Ramp-Up',
  encouragement = 'Meetings, ads, and gatherings are potent triggers. Replace them with walks, calls, or non-food rituals.',
  stage = 'Ketone Ramp-Up',
  body_state = 'Social triggers remain powerful'
WHERE hour = 50;

UPDATE fasting_hours SET 
  title = 'Ketone Ramp-Up',
  encouragement = 'Sodium is the main lever during fasting. Use conservative, guideline-appropriate potassium from mineral water or food when refeeding.',
  stage = 'Ketone Ramp-Up',
  body_state = 'Sodium remains the key electrolyte'
WHERE hour = 51;

UPDATE fasting_hours SET 
  title = 'Ketone Ramp-Up',
  encouragement = 'A quiet gut is expected while not eating. Bowel movements will resume after refeed; no laxatives are necessary.',
  stage = 'Ketone Ramp-Up',
  body_state = 'Quiet digestion is normal during fasting'
WHERE hour = 52;

UPDATE fasting_hours SET 
  title = 'Ketone Ramp-Up',
  encouragement = 'Neuromotor drills or mobility work fit well. Postpone personal best attempts until after a controlled refeed.',
  stage = 'Ketone Ramp-Up',
  body_state = 'Light movement and mobility work ideal'
WHERE hour = 53;

UPDATE fasting_hours SET 
  title = 'Ketone Ramp-Up',
  encouragement = 'Planned structure beats willpower. Write your next-day plan before bed to reduce morning decisions.',
  stage = 'Ketone Ramp-Up',
  body_state = 'Planning reduces decision fatigue'
WHERE hour = 54;

-- Hour 55-63: Ketone Dominance
UPDATE fasting_hours SET 
  title = 'Ketone Dominance',
  encouragement = 'Metabolic flexibility is now prominent. Many report a steady, content mood with minimal food thoughts.',
  stage = 'Ketone Dominance',
  body_state = 'Full metabolic flexibility achieved'
WHERE hour = 55;

UPDATE fasting_hours SET 
  title = 'Ketone Dominance',
  encouragement = 'Cravings behave more like quick notifications than alarms. Keep beverages unsweetened to avoid reactivating appetite.',
  stage = 'Ketone Dominance',
  body_state = 'Cravings are mild and brief'
WHERE hour = 56;

UPDATE fasting_hours SET 
  title = 'Ketone Dominance',
  encouragement = 'Most headaches stem from sodium deficits or fatigue. Adjust basics first before adding anything new.',
  stage = 'Ketone Dominance',
  body_state = 'Headaches usually from electrolyte needs'
WHERE hour = 57;

UPDATE fasting_hours SET 
  title = 'Ketone Dominance',
  encouragement = 'Alternating deep focus with two-minute movement preserves comfort. Avoid long seated periods to limit restlessness.',
  stage = 'Ketone Dominance',
  body_state = 'Movement breaks prevent stiffness'
WHERE hour = 58;

UPDATE fasting_hours SET 
  title = 'Ketone Dominance',
  encouragement = 'Environmental triggers remain powerful. A deliberate pause protects momentum and reduces accidental nibbling.',
  stage = 'Ketone Dominance',
  body_state = 'Environmental awareness remains important'
WHERE hour = 59;

UPDATE fasting_hours SET 
  title = 'Ketone Dominance',
  encouragement = 'Think ahead about first foods and portions without obsessing. Planning reduces anxiety and prevents overeating on exit.',
  stage = 'Ketone Dominance',
  body_state = 'Planning refeed reduces exit anxiety'
WHERE hour = 60;

UPDATE fasting_hours SET 
  title = 'Ketone Dominance',
  encouragement = 'Your fuel mix favors steady outputs. Keep intensity modest to avoid unnecessary strain before refeed.',
  stage = 'Ketone Dominance',
  body_state = 'Steady fuel mix suits moderate activity'
WHERE hour = 61;

UPDATE fasting_hours SET 
  title = 'Ketone Dominance',
  encouragement = 'Most comfort issues resolve with these basics. If symptoms persist or worsen, consider ending the fast responsibly.',
  stage = 'Ketone Dominance',
  body_state = 'Most issues resolve with basic care'
WHERE hour = 62;

UPDATE fasting_hours SET 
  title = 'Ketone Dominance',
  encouragement = 'You''re well adapted for this fast''s context. Keep the routine simple and predictable heading into the final stretch.',
  stage = 'Ketone Dominance',
  body_state = 'Well adapted - maintain simple routine'
WHERE hour = 63;

-- Hour 64-72: Deep Ketone Steady-State
UPDATE fasting_hours SET 
  title = 'Deep Ketone Steady-State',
  encouragement = 'Fat provides the majority of energy now. Many experience calm focus and minimal food preoccupation.',
  stage = 'Deep Ketone Steady-State',
  body_state = 'Fat is primary energy source'
WHERE hour = 64;

UPDATE fasting_hours SET 
  title = 'Deep Ketone Steady-State',
  encouragement = 'Long sitting can feel stiff while fasting. Short, regular movement preserves comfort and circulation.',
  stage = 'Deep Ketone Steady-State',
  body_state = 'Regular movement prevents stiffness'
WHERE hour = 65;

UPDATE fasting_hours SET 
  title = 'Deep Ketone Steady-State',
  encouragement = 'Quality sleep supports recovery and appetite regulation. Keep bedtime consistent and screens dim.',
  stage = 'Deep Ketone Steady-State',
  body_state = 'Sleep quality remains crucial'
WHERE hour = 66;

UPDATE fasting_hours SET 
  title = 'Deep Ketone Steady-State',
  encouragement = 'A calm, controlled refeed prevents stomach discomfort. Avoid large, high-fat meals immediately after breaking.',
  stage = 'Deep Ketone Steady-State',
  body_state = 'Plan gentle refeed to avoid discomfort'
WHERE hour = 67;

UPDATE fasting_hours SET 
  title = 'Deep Ketone Steady-State',
  encouragement = 'Gentle carbs like cooked potatoes or rice sit comfortably. Add vegetables and fats progressively over subsequent meals.',
  stage = 'Deep Ketone Steady-State',
  body_state = 'Gentle carbs ideal for breaking fast'
WHERE hour = 68;

UPDATE fasting_hours SET 
  title = 'Deep Ketone Steady-State',
  encouragement = 'Sodium needs continue as insulin rises post-refeed. Balanced electrolytes support circulation and energy.',
  stage = 'Deep Ketone Steady-State',
  body_state = 'Electrolyte needs continue post-fast'
WHERE hour = 69;

UPDATE fasting_hours SET 
  title = 'Deep Ketone Steady-State',
  encouragement = 'Alcohol tolerance changes during fasting. Postpone until normal eating resumes and hydration is reestablished.',
  stage = 'Deep Ketone Steady-State',
  body_state = 'Avoid alcohol until eating resumes'
WHERE hour = 70;

UPDATE fasting_hours SET 
  title = 'Deep Ketone Steady-State',
  encouragement = 'Breaking late can disrupt rest and promote overeating. A daytime refeed supports better digestion and sleep.',
  stage = 'Deep Ketone Steady-State',
  body_state = 'Daytime refeed supports better recovery'
WHERE hour = 71;

UPDATE fasting_hours SET 
  title = 'Deep Ketone Steady-State',
  encouragement = 'Start with protein and fluids, then add simple carbohydrates. Pause between servings to gauge fullness and digestion.',
  stage = 'Deep Ketone Steady-State',
  body_state = '72-hour completion - break fast gently'
WHERE hour = 72;