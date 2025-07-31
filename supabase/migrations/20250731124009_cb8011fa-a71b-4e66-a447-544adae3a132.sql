-- Update admin_goal_ideas with custom motivators
UPDATE public.shared_settings 
SET setting_value = '[
  {
    "id": "1",
    "title": "Mirror Wake-Up",
    "description": "Seeing myself in the mirror or security camera and hating it. A harsh moment of clarity — when your reflection becomes a trigger. This is often the first jolt that forces real change.",
    "category": "personal",
    "imageUrl": "/src/assets/motivator-mirror-wake-up.jpg"
  },
  {
    "id": "2",
    "title": "Fit Into Old Clothes",
    "description": "Fitting into old clothes again. Nothing proves progress more than slipping into something that once felt impossible. A simple, physical milestone that means everything.",
    "category": "personal",
    "imageUrl": "/src/assets/motivator-fit-old-clothes.jpg"
  },
  {
    "id": "3",
    "title": "Fit Into New Clothes", 
    "description": "Finally fitting into expensive new clothes I bought and never wore. This is the revenge arc — the clothes you once bought in hope, now finally fitting. Symbolic of reclaiming self-worth.",
    "category": "personal",
    "imageUrl": "/src/assets/motivator-fit-new-clothes.jpg"
  },
  {
    "id": "4",
    "title": "Be Looked At",
    "description": "Wanting to be looked at again — to feel attractive and back on the market. After fading into the background, this goal is about becoming visible again — wanting to turn heads, feel attractive, reawaken desire.",
    "category": "personal", 
    "imageUrl": "/src/assets/motivator-be-looked-at.jpg"
  },
  {
    "id": "5",
    "title": "Impress Them All",
    "description": "Wanting to impress or surprise someone (romantic or not). This is about transformation being seen. To make someone''s jaw drop — not for revenge, but satisfaction.",
    "category": "personal",
    "imageUrl": "/src/assets/motivator-impress-them-all.jpg"
  },
  {
    "id": "6", 
    "title": "Regain Self-Respect",
    "description": "Getting confidence back — regaining self-respect through visible change. When you start showing up for yourself, your posture changes. This is about restoring dignity through action and discipline.",
    "category": "personal",
    "imageUrl": "/src/assets/motivator-regain-self-respect.jpg"
  },
  {
    "id": "7",
    "title": "Fix Insulin Levels", 
    "description": "Worrying about insulin levels or other early warning signs. A health scare — even minor — can flip the switch. This motivator is about prevention before crisis hits.",
    "category": "health",
    "imageUrl": "/src/assets/motivator-fix-insulin-levels.jpg"
  },
  {
    "id": "8",
    "title": "Fix Unexplained Symptoms",
    "description": "Struggling with weird, unexplained physical symptoms — and hoping weight loss will fix them. Strange symptoms without answers — bloating, aches, fatigue. When nothing works, the hope is that lifestyle change might.",
    "category": "health", 
    "imageUrl": "/src/assets/motivator-fix-unexplained-symptoms.jpg"
  },
  {
    "id": "9",
    "title": "Event Countdown",
    "description": "Getting ready for an upcoming event (wedding, reunion, etc.). A set date creates urgency. You picture yourself walking in transformed — and that image fuels every choice.",
    "category": "goals",
    "imageUrl": "/src/assets/motivator-event-countdown.jpg"
  },
  {
    "id": "10",
    "title": "Autophagy Clean-Up",
    "description": "Autophagy: triggering deep cellular cleanup through extended fasting. For those who fast, this motivator goes deeper — it''s about longevity, healing, and total reset from the inside out.",
    "category": "health",
    "imageUrl": "/src/assets/motivator-autophagy-clean-up.jpg"
  }
]',
updated_at = now()
WHERE setting_key = 'admin_goal_ideas';