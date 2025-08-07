import { Clock, Footprints, Camera, Target, Zap, Coffee, Scale } from 'lucide-react';

export interface OnboardingSection {
  icon: any;
  title: string;
  description: string;
}

export interface PageOnboardingContent {
  title: string;
  subtitle: string;
  heroQuote: string;
  sections: OnboardingSection[];
  backgroundImage?: string;
}

export const onboardingContent: Record<string, PageOnboardingContent> = {
  profile: {
    title: "Complete Your Profile",
    subtitle: "Tell us about yourself to unlock personalized calorie calculations and recommendations.",
    heroQuote: "Your body is unique. Your plan should be too.",
    sections: [
      {
        icon: Target,
        title: "Personalized Calculations",
        description: "We'll calculate your exact daily calorie needs based on your weight, height, age, and sex using proven metabolic formulas."
      },
      {
        icon: Scale,
        title: "Accurate Tracking",
        description: "Get precise calorie burn estimates for walking and activities. Your profile enables smart deficit tracking."
      },
      {
        icon: Zap,
        title: "Smarter Recommendations",
        description: "Unlock personalized food suggestions, goal recommendations, and motivational content tailored to your journey."
      }
    ]
  },
  timer: {
    title: "Start With the Fast",
    subtitle: "60 hours of silence. No food. Just water. This is where change begins.",
    heroQuote: "Without this fast, I couldn't begin to lose weight. It trains your body and your mind.",
    sections: [
      {
        icon: Zap,
        title: "The Reset",
        description: "60-72 hours with just water and coffee shifts your body from burning sugar to burning fat. This breaks the addiction to carbs and emotional eating."
      },
      {
        icon: Coffee,
        title: "Embrace the Hunger",
        description: "Hunger becomes something you sit with — not something you fear. This is hard. That's the point. It's the reset your body needs."
      },
      {
        icon: Target,
        title: "Start Your Change",
        description: "Without this fast, you stay stuck. This is where real change begins — training both your body and your mind for what's ahead."
      }
    ]
  },
  walking: {
    title: "Walk. Don't Run.",
    subtitle: "Cardio you don't hate. A tool that actually works.",
    heroQuote: "This isn't about performance. It's about output. Walking lets you go far without quitting.",
    sections: [
      {
        icon: Footprints,
        title: "Underrated Fat Burner",
        description: "Walking is the most underrated fat-burning tool on Earth. You can walk for 10 minutes or 3 hours. No pressure, no burnout."
      },
      {
        icon: Clock,
        title: "All-Day Output",
        description: "Especially in a city or while traveling — walk all day, burn all day. This is how you build a calorie deficit without tracking every bite."
      },
      {
        icon: Target,
        title: "Sustainable Cardio",
        description: "It's not glamorous. It works. Most people hate running — it doesn't matter. Walking is cardio you can actually stick with."
      }
    ]
  },
  food: {
    title: "What You Eat, You Become",
    subtitle: "Calories go in. Fat stays in. Let's reverse that.",
    heroQuote: "I don't count obsessively. I just don't lie to myself. I know what I eat.",
    sections: [
      {
        icon: Scale,
        title: "Simple Math",
        description: "You burn calories all day, even doing nothing. Eat less than you burn — that's the only way fat disappears."
      },
      {
        icon: Target,
        title: "Make It a System",
        description: "Use the app to track. Keep it simple. Save 'safe foods' and log them fast. Hit your daily target without obsession."
      },
      {
        icon: Camera,
        title: "AI Estimation",
        description: "Estimate with AI tools when labels are missing. This is how you make food a system, not a struggle."
      }
    ]
  },
  motivators: {
    title: "What You Want Is Waiting",
    subtitle: "This isn't motivation. This is fuel.",
    heroQuote: "It's not about the weight. It's about getting back to the person you know is in there.",
    sections: [
      {
        icon: Target,
        title: "Real Motivators",
        description: "These aren't just goals — they're fuel. Clothes that don't fit. People you want to surprise. Moments you don't want to miss."
      },
      {
        icon: Camera,
        title: "Lock Them In",
        description: "Add your own photos, events, test results. I've included 10 real ones from my own journey to get you started."
      },
      {
        icon: Clock,
        title: "When You Need Them",
        description: "The app will show them to you when you need them most. These motivators remind you what matters when it gets hard."
      }
    ]
  }
};