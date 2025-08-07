-- Fix admin goal ideas with proper Unsplash URLs instead of broken local paths
UPDATE shared_settings 
SET setting_value = '[
  {
    "id": "1",
    "title": "Mirror Wake-Up",
    "description": "Seeing myself in the mirror or security camera and hating it. A harsh moment of clarity — when your reflection becomes a trigger. This is often the first jolt that forces real change.",
    "category": "personal",
    "imageUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face"
  },
  {
    "id": "2", 
    "title": "Fit Into Old Clothes",
    "description": "Fitting into old clothes again. Nothing proves progress more than slipping into something that once felt impossible. A simple, physical milestone that means everything.",
    "category": "personal",
    "imageUrl": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop"
  },
  {
    "id": "3",
    "title": "Fit Into New Clothes", 
    "description": "Finally fitting into expensive new clothes I bought and never wore. This is the revenge arc — the clothes you once bought in hope, now finally fitting. Symbolic of reclaiming self-worth.",
    "category": "personal",
    "imageUrl": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop"
  },
  {
    "id": "4",
    "title": "Be Looked At",
    "description": "Wanting to be looked at again — to feel attractive and back on the market. After fading into the background, this goal is about becoming visible again — wanting to turn heads, feel attractive, reawaken desire.",
    "category": "personal",
    "imageUrl": "https://images.unsplash.com/photo-1494790108755-2616b332c42c?w=400&h=300&fit=crop&crop=face"
  },
  {
    "id": "5",
    "title": "Impress Them All", 
    "description": "Wanting to impress or surprise someone (romantic or not). This is about transformation being seen. To make someone''s jaw drop — not for revenge, but satisfaction.",
    "category": "personal",
    "imageUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face"
  },
  {
    "id": "6",
    "title": "Regain Self-Respect",
    "description": "Getting confidence back — regaining self-respect through visible change. When you start showing up for yourself, your posture changes. This is about restoring dignity through action and discipline.",
    "category": "personal", 
    "imageUrl": "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop"
  },
  {
    "id": "7",
    "title": "Fix Insulin Levels",
    "description": "Worrying about insulin levels or other early warning signs. A health scare — even minor — can flip the switch. This motivator is about prevention before crisis hits.",
    "category": "health",
    "imageUrl": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop"
  },
  {
    "id": "8", 
    "title": "Fix Unexplained Symptoms",
    "description": "Struggling with weird, unexplained physical symptoms — and hoping weight loss will fix them. Strange symptoms without answers — bloating, aches, fatigue. When nothing works, the hope is that lifestyle change might.",
    "category": "health",
    "imageUrl": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=300&fit=crop"
  },
  {
    "id": "9",
    "title": "Event Countdown", 
    "description": "Getting ready for an upcoming event (wedding, reunion, etc.). A set date creates urgency. You picture yourself walking in transformed — and that image fuels every choice.",
    "category": "goals",
    "imageUrl": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&h=300&fit=crop"
  },
  {
    "id": "10",
    "title": "Autophagy Clean-Up",
    "description": "Autophagy: triggering deep cellular cleanup through extended fasting. For those who fast, this motivator goes deeper — it''s about longevity, healing, and total reset from the inside out.",
    "category": "health", 
    "imageUrl": "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop"
  }
]'
WHERE setting_key = 'admin_goal_ideas';