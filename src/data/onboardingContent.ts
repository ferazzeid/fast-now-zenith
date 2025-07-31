import { Clock, Footprints, Camera, Target } from 'lucide-react';

export interface OnboardingSection {
  icon: any;
  title: string;
  description: string;
}

export interface PageOnboardingContent {
  title: string;
  subtitle: string;
  sections: OnboardingSection[];
}

export const onboardingContent: Record<string, PageOnboardingContent> = {
  timer: {
    title: "Fasting Timer",
    subtitle: "Your personal intermittent fasting companion",
    sections: [
      {
        icon: Clock,
        title: "Two Fasting Modes",
        description: "Choose intermittent fasting (12-24 hours) for daily routines or long-term fasting (24+ hours) for deeper benefits like autophagy."
      },
      {
        icon: Target,
        title: "Ceramic Timer Design",
        description: "Our beautiful ceramic timer helps you stay mindful and motivated throughout your fasting journey with calming visuals."
      },
      {
        icon: Camera,
        title: "Smart Integration",
        description: "Your fasting data automatically syncs with your daily deficit calculations and motivational system."
      }
    ]
  },
  walking: {
    title: "Walking Tracker",
    subtitle: "Turn every step into calorie-burning progress",
    sections: [
      {
        icon: Footprints,
        title: "Personalized Calorie Burn",
        description: "Select your walking speed and we'll calculate exact calories burned based on your profile and session duration."
      },
      {
        icon: Target,
        title: "Deficit Integration",
        description: "Walking calories automatically add to your daily deficit, helping you reach your goals faster and more sustainably."
      },
      {
        icon: Clock,
        title: "Session Tracking",
        description: "Start, pause, and track walking sessions with detailed history to monitor your progress over time."
      }
    ]
  },
  food: {
    title: "Food Tracking",
    subtitle: "Smart nutrition logging made simple",
    sections: [
      {
        icon: Camera,
        title: "AI Food Analysis",
        description: "Take photos of your meals and our AI instantly analyzes calories, carbs, and nutritional content with impressive accuracy."
      },
      {
        icon: Footprints,
        title: "Walking Calculations",
        description: "See exactly how many minutes of walking you'd need to burn off any meal - making food choices more mindful."
      },
      {
        icon: Target,
        title: "Deficit Tracking",
        description: "Every meal automatically updates your daily calorie deficit, helping you stay on track with your goals."
      }
    ]
  },
  motivators: {
    title: "Goals & Motivators",
    subtitle: "Your personal motivation and goal-setting hub",
    sections: [
      {
        icon: Target,
        title: "AI-Powered Goals",
        description: "Use voice input to describe your goals and let AI create personalized, motivating content that resonates with you."
      },
      {
        icon: Camera,
        title: "Visual Motivation",
        description: "Add photos and create visual motivators that remind you why you're working toward your health goals."
      },
      {
        icon: Clock,
        title: "Slideshow Experience",
        description: "View your motivators in a beautiful slideshow format to boost motivation whenever you need it most."
      }
    ]
  }
};