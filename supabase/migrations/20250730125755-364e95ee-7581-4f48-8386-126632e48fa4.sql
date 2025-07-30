-- Insert default admin goal ideas into shared_settings
INSERT INTO shared_settings (setting_key, setting_value) 
VALUES ('admin_goal_ideas', '[
  {
    "id": "1",
    "title": "Weight Loss",
    "description": "Achieve sustainable weight loss through mindful eating and consistent fasting routines",
    "category": "health",
    "imageUrl": null
  },
  {
    "id": "2", 
    "title": "Energy Boost",
    "description": "Increase daily energy levels and mental clarity through optimized nutrition timing",
    "category": "health",
    "imageUrl": null
  },
  {
    "id": "3",
    "title": "Confidence Building", 
    "description": "Build self-confidence and feel amazing in your own skin through healthy habits",
    "category": "personal",
    "imageUrl": null
  },
  {
    "id": "4",
    "title": "Athletic Performance",
    "description": "Enhance athletic performance and recovery through strategic eating windows", 
    "category": "fitness",
    "imageUrl": null
  },
  {
    "id": "5",
    "title": "Better Sleep",
    "description": "Improve sleep quality and establish better circadian rhythms through meal timing",
    "category": "health",
    "imageUrl": null
  },
  {
    "id": "6",
    "title": "Mental Clarity",
    "description": "Achieve sharper focus and mental performance through metabolic optimization",
    "category": "mindset", 
    "imageUrl": null
  },
  {
    "id": "7",
    "title": "Social Confidence",
    "description": "Feel more confident in social situations and around people you want to impress",
    "category": "personal",
    "imageUrl": null
  },
  {
    "id": "8", 
    "title": "Discipline Training",
    "description": "Build mental discipline and willpower that extends beyond just eating habits",
    "category": "mindset",
    "imageUrl": null
  },
  {
    "id": "9",
    "title": "Health Reset", 
    "description": "Reset your relationship with food and establish healthier long-term habits",
    "category": "health",
    "imageUrl": null
  },
  {
    "id": "10",
    "title": "Special Event",
    "description": "Look and feel your best for an upcoming special event or milestone",
    "category": "personal", 
    "imageUrl": null
  }
]'::text);