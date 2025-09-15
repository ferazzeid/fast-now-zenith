// Static system motivators - bundled for instant access
// Last updated: 2025-09-15 from database extraction

export interface SystemMotivator {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  category: string | null;
  male_image_url: string | null;
  female_image_url: string | null;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  link_url?: string | null;
}

export const SYSTEM_MOTIVATORS: SystemMotivator[] = [
  {
    id: "7fa756a6-c0d4-4fe9-8cba-cabf026eb6db",
    title: "Autophagy Clean-Up",
    content: "Fasting can switch the body into \"recycling mode,\" breaking down old or damaged cells to make room for new ones. Scientists call this autophagy — and while the exact timelines are still debated, it's reasonably believed to ramp up when fasting goes beyond the usual gaps between meals. For me, the idea was simple: if my body has a built-in clean-up system, why not give it the chance to run? Even if you can't see it happening, the thought of deep cellular spring-cleaning can be a powerful reason to push through longer fasts.\n\nAt its core, autophagy is the body's way of reusing worn-out parts. When nutrients are scarce, cells start breaking down proteins and structures that aren't working well anymore, converting them into usable energy and building blocks. Think of it like dismantling an old shed to reuse the wood for a house repair — clearing out what's weak, keeping what's strong. Researchers believe this process may help with everything from reducing inflammation to slowing the buildup of damaged proteins that accumulate with age. It's not a magic cure, but it's a reminder that fasting isn't just about burning fat — it's also about giving your body the space to do some deep maintenance.",
    excerpt: "Unlock your body's natural cellular repair system. Experience the transformative power of autophagy as your cells clean house and regenerate for optimal health.",
    category: "health",
    male_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755349898632-admin-goal.jpg",
    female_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755338400484-admin-goal.jpg",
    slug: "autophagy-cleanup",
    meta_title: null,
    meta_description: null,
    is_active: true,
    display_order: 1,
    created_at: "2025-09-02T07:36:59.567183Z",
    updated_at: "2025-09-13T12:42:52.859705Z",
    link_url: "https://fastnow.app/motivators/autophagy-cleanup"
  },
  {
    id: "52db4797-56a7-4b0f-a02c-00c92a88b6fe",
    title: "Be Looked At",
    content: "Being overweight changes how others perceive you — and how you perceive yourself. A little extra weight might pass as harmless or even comfortable, but there's a threshold where you're no longer \"a person who enjoys food\" and become \"the fat person.\" That label is heavy, and it shapes how you're treated in ways that are often invisible until you experience the other side again.\n\nThe strange part is figuring out whether the difference is external or internal. Is the world actually reacting differently to you, or is your mind playing tricks now that you feel lighter and more confident? In truth, it's probably both. When you're very self-aware and you watch carefully, you notice small shifts: longer eye contact, warmer smiles, or simply the absence of that subtle dismissal that overweight people often learn to live with.",
    excerpt: "Transform how the world sees you and how you see yourself. Step into a body that commands respect and opens doors you didn't know were closed.",
    category: "personal",
    male_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755338159449-admin-goal.jpg",
    female_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755338150474-admin-goal.jpg",
    slug: "be-looked-at",
    meta_title: null,
    meta_description: null,
    is_active: true,
    display_order: 2,
    created_at: "2025-09-02T07:36:59.567183Z",
    updated_at: "2025-09-13T12:38:59.375775Z",
    link_url: "https://fastnow.app/motivators/be-looked-at"
  },
  {
    id: "0ac42f45-b2ab-4b50-8c1b-4090e4149eb3",
    title: "Event Countdown",
    content: "There's something uniquely motivating about a deadline. Maybe it's a wedding, a reunion, a vacation, or just a photo session that matters to you. The calendar becomes your ally, and every day of fasting feels like progress toward a specific moment when you want to feel your absolute best.\n\nThe beauty of event-driven motivation is that it's concrete and personal. You're not chasing some abstract ideal of health — you're working toward being the version of yourself you want to be on a day that matters. Whether it's fitting into a particular outfit, feeling confident in photos, or simply knowing you've put in the effort to show up as your best self, having a target date transforms fasting from a vague lifestyle change into a focused mission.",
    excerpt: "Turn your special event into the ultimate motivation. Count down to your moment and arrive as the best version of yourself.",
    category: "events",
    male_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755338195861-admin-goal.jpg",
    female_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755338184935-admin-goal.jpg",
    slug: "event-countdown",
    meta_title: null,
    meta_description: null,
    is_active: true,
    display_order: 3,
    created_at: "2025-09-02T07:36:59.567183Z",
    updated_at: "2025-09-13T12:39:15.737801Z",
    link_url: "https://fastnow.app/motivators/event-countdown"
  },
  {
    id: "9bbd7b38-02b4-48e4-87ea-1a8c7339f0db",
    title: "Fit New Clothes",
    content: "There's a special thrill in walking into a store and knowing you can pick clothes based on style rather than what's available in your size. When you're carrying extra weight, shopping becomes an exercise in compromise — you settle for what fits rather than what you actually like. But as you lose weight, that dynamic flips entirely.\n\nSuddenly, you're not hunting through racks hoping to find something that flatters a difficult body shape. You're choosing clothes because they reflect your personality, your mood, or simply because you think they look great. The confidence that comes from this shift is profound — it's not just about looking better, it's about the freedom to express yourself without the constant mental gymnastics of hiding what you don't like about your body.",
    excerpt: "Experience the joy of choosing clothes for style, not size. Open up a whole new wardrobe and express your true self with confidence.",
    category: "lifestyle",
    male_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755338235823-admin-goal.jpg",
    female_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755338226150-admin-goal.jpg",
    slug: "fit-new-clothes",
    meta_title: null,
    meta_description: null,
    is_active: true,
    display_order: 4,
    created_at: "2025-09-02T07:36:59.567183Z",
    updated_at: "2025-09-13T12:39:35.649812Z",
    link_url: "https://fastnow.app/motivators/fit-new-clothes"
  },
  {
    id: "d4dd7ad5-bbbb-4c70-9d31-831e0b4365c5",
    title: "Fit Old Clothes",
    content: "There's something deeply satisfying about sliding into clothes that haven't fit in months or years. Those jeans in the back of your closet, the dress you loved but haven't been able to wear, the shirt that used to be a favorite — they become like old friends waiting for your return.\n\nFitting back into old clothes isn't just about the physical accomplishment; it's about reclaiming a version of yourself that existed before. There's a kind of time travel in putting on something that reminds you of when you felt confident and comfortable in your body. It's proof that you can get back there, that the person who used to wear these clothes isn't gone — they've just been waiting underneath.",
    excerpt: "Rediscover forgotten favorites in your closet. Slide back into clothes that remind you of your confident, comfortable self.",
    category: "lifestyle",
    male_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755338272948-admin-goal.jpg",
    female_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755338264039-admin-goal.jpg",
    slug: "fit-old-clothes",
    meta_title: null,
    meta_description: null,
    is_active: true,
    display_order: 5,
    created_at: "2025-09-02T07:36:59.567183Z",
    updated_at: "2025-09-13T12:39:52.873235Z",
    link_url: "https://fastnow.app/motivators/fit-old-clothes"
  },
  {
    id: "83015bf1-e226-4ad0-bd52-af58a7b4303d",
    title: "Fix Insulin Levels",
    content: "Insulin is like the body's storage manager — it decides whether incoming energy gets used right away or tucked away for later. When you're constantly eating, especially foods that spike blood sugar, insulin stays elevated, essentially keeping your body in \"store energy\" mode. Fasting gives insulin a chance to drop, which can shift your metabolism toward \"use stored energy\" mode.\n\nFor people dealing with insulin resistance or pre-diabetes, this break can be particularly valuable. When insulin is constantly high, your cells can become less responsive to it, requiring even more insulin to do the same job. Extended periods without food let insulin levels fall and give your cells a chance to regain sensitivity. While fasting isn't a cure for metabolic issues, many people find that it helps them feel more in control of their blood sugar and energy levels.",
    excerpt: "Give your metabolism a reset. Take control of your insulin levels and unlock your body's natural fat-burning potential.",
    category: "health",
    male_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755338297417-admin-goal.jpg",
    female_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755338288268-admin-goal.jpg",
    slug: "fix-insulin-levels",
    meta_title: null,
    meta_description: null,
    is_active: true,
    display_order: 6,
    created_at: "2025-09-02T07:36:59.567183Z",
    updated_at: "2025-09-13T12:40:06.941578Z",
    link_url: "https://fastnow.app/motivators/fix-insulin-levels"
  },
  {
    id: "46cbf4de-611e-44da-9cf4-d54f29395e31",
    title: "Fix Unexplained Symptoms",
    content: "Sometimes your body has been trying to tell you something for years, and you've been too busy managing the noise to listen. Chronic fatigue, brain fog, digestive issues, joint pain — these vague but persistent symptoms that doctors struggle to pin down can sometimes improve dramatically with changes in how and when you eat.\n\nFasting gives your digestive system a break, potentially reducing inflammation and allowing your body to redirect energy toward healing and repair. Many people are surprised to discover that symptoms they'd accepted as \"just getting older\" or \"stress\" start to fade when they give their body extended periods without the work of digestion. It's not magic, but it can feel close when you suddenly have energy and clarity that you'd forgotten were possible.",
    excerpt: "Listen to your body's whispers before they become shouts. Address mysterious symptoms and rediscover vibrant health.",
    category: "health",
    male_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755338326398-admin-goal.jpg",
    female_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755338317362-admin-goal.jpg",
    slug: "fix-unexplained-symptoms",
    meta_title: null,
    meta_description: null,
    is_active: true,
    display_order: 7,
    created_at: "2025-09-02T07:36:59.567183Z",
    updated_at: "2025-09-13T12:40:26.202632Z",
    link_url: "https://fastnow.app/motivators/fix-unexplained-symptoms"
  },
  {
    id: "511c1235-18b8-4012-a0a4-f8b45c12f712",
    title: "Impress Them All",
    content: "Let's be honest: sometimes you want to show up and have people notice. Maybe it's an ex who thought you'd never get your act together, colleagues who've watched you struggle with weight, or family members who've made comments. There's nothing wrong with wanting to prove something — to them and to yourself.\n\nThe motivation of \"I'll show them\" can be incredibly powerful fuel for change. When you imagine walking into a room and seeing the surprise in people's eyes, feeling the shift in how they interact with you, it can push you through difficult moments when willpower alone isn't enough. Use that energy. Let their doubts become your determination.",
    excerpt: "Turn skepticism into fuel. Show everyone who doubted you exactly what you're capable of achieving.",
    category: "personal",
    male_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755338359558-admin-goal.jpg",
    female_image_url: "https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/motivator-images/84f952e6-690b-473f-b0cc-c579ac077b45/1755338351485-admin-goal.jpg",
    slug: "impress-them-all",
    meta_title: null,
    meta_description: null,
    is_active: true,
    display_order: 8,
    created_at: "2025-09-02T07:36:59.567183Z",
    updated_at: "2025-09-13T12:40:39.424429Z",
    link_url: "https://fastnow.app/motivators/impress-them-all"
  }
];

// Version timestamp for cache busting
export const SYSTEM_MOTIVATORS_VERSION = "2025-09-15T11:28:21.000Z";

// Helper functions for system motivators
export const getSystemMotivatorBySlug = (slug: string): SystemMotivator | undefined => {
  return SYSTEM_MOTIVATORS.find(m => m.slug === slug);
};

export const getSystemMotivatorsByCategory = (category: string): SystemMotivator[] => {
  return SYSTEM_MOTIVATORS.filter(m => m.category === category);
};

export const getActiveSystemMotivators = (): SystemMotivator[] => {
  return SYSTEM_MOTIVATORS.filter(m => m.is_active).sort((a, b) => a.display_order - b.display_order);
};