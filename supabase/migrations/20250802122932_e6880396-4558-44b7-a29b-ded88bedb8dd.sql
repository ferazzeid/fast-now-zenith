-- Migrate predefined motivators to database
INSERT INTO public.shared_settings (setting_key, setting_value) VALUES (
  'predefined_motivators',
  '[
    {
      "title": "Autophagy & Clean Up",
      "content": "Your body is literally cleaning house! During fasting, autophagy kicks in - your cells start recycling damaged parts and clearing out cellular junk. You''re not just losing weight, you''re upgrading your biology at the cellular level.",
      "category": "health",
      "imageUrl": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop"
    },
    {
      "title": "Mirror Wake-Up Call",
      "content": "That moment when you catch yourself in the mirror and think ''Who is this person?'' Time to reclaim the confident, energetic you that''s been hiding under layers of excuses and extra weight.",
      "category": "personal",
      "imageUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop"
    },
    {
      "title": "Be Looked At (Not Through)",
      "content": "Remember when people used to notice you? When you commanded attention just by walking into a room? That magnetic presence is still inside you, waiting to shine again.",
      "category": "confidence",
      "imageUrl": "https://images.unsplash.com/photo-1494790108755-2616b612b13c?w=400&h=300&fit=crop"
    },
    {
      "title": "Regain Self-Respect",
      "content": "Every time you look in the mirror, you''re reminded of promises you broke to yourself. It''s time to rebuild that relationship with the most important person in your life - YOU.",
      "category": "personal",
      "imageUrl": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=300&fit=crop"
    },
    {
      "title": "Fit Into New Clothes",
      "content": "Shopping for clothes should be exciting, not a nightmare of trying to find something that ''hides'' your body. Imagine walking into any store and knowing everything will look amazing on you.",
      "category": "lifestyle",
      "imageUrl": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop"
    },
    {
      "title": "Fit Into Old Clothes",
      "content": "That closet full of clothes with tags still on them? Those jeans you swore you''d fit into again? They''re not just clothes - they''re symbols of the person you''re becoming again.",
      "category": "achievement",
      "imageUrl": "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=300&fit=crop"
    },
    {
      "title": "Fix Insulin Levels",
      "content": "Your body''s been on a sugar rollercoaster for too long. Time to get off the ride and give your insulin sensitivity a chance to reset. Your future self will thank you for preventing diabetes.",
      "category": "health",
      "imageUrl": "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop"
    },
    {
      "title": "Fix Unexplained Symptoms",
      "content": "The brain fog, joint pain, low energy, mood swings - they''re not just ''getting older.'' Many of these symptoms are your body crying out for metabolic healing.",
      "category": "health",
      "imageUrl": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop"
    },
    {
      "title": "Impress Them All",
      "content": "Show everyone who doubted you, who gave up on you, who said you''d never change. The best revenge is becoming the person they said you couldn''t be.",
      "category": "achievement",
      "imageUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop"
    },
    {
      "title": "Event Countdown",
      "content": "The wedding, reunion, beach vacation, or special date is coming. This isn''t about crash dieting - it''s about showing up as the best version of yourself.",
      "category": "deadline",
      "imageUrl": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop"
    }
  ]'
);