import React from 'react';
import { cn } from '@/lib/utils';

interface MilestoneMotivatorCardProps {
  hours: number;
  type: 'hourly' | 'completion';
  className?: string;
  isActive?: boolean;
}

export const MilestoneMotivatorCard: React.FC<MilestoneMotivatorCardProps> = ({
  hours,
  type,
  className = "",
  isActive = true
}) => {
  const getMilestoneContent = () => {
    if (type === 'completion') {
      return {
        title: 'GOAL ACHIEVED!',
        subtitle: `${hours}-Hour Fast Complete`,
        body: 'You\'ve successfully completed your fasting goal. This achievement demonstrates incredible discipline and dedication to your health journey.',
        benefits: ['Cellular autophagy activated', 'Metabolic flexibility enhanced', 'Mental clarity achieved'],
        gradient: 'from-amber-500/90 to-yellow-600/90',
        icon: '👑'
      };
    }

    // Hourly milestones
    if (hours >= 24) {
      return {
        title: 'LEGENDARY STATUS',
        subtitle: `${hours} Hours & Counting`,
        body: 'You\'ve entered legendary fasting territory. Your body is now in full fat-burning mode with maximum autophagy benefits.',
        benefits: ['Peak autophagy active', 'Growth hormone elevated', 'Insulin sensitivity optimized'],
        gradient: 'from-purple-600/90 to-pink-600/90',
        icon: '🏆'
      };
    } else if (hours >= 16) {
      return {
        title: 'AUTOPHAGY ZONE',
        subtitle: `${hours} Hours of Excellence`,
        body: 'Your cells are now in full cleanup mode. Autophagy is working to remove damaged proteins and optimize cellular function.',
        benefits: ['Cellular cleanup active', 'Fat burning optimized', 'Mental focus enhanced'],
        gradient: 'from-blue-600/90 to-purple-600/90',
        icon: '🔥'
      };
    } else if (hours >= 12) {
      return {
        title: 'KETOSIS ACHIEVED',
        subtitle: `${hours} Hours Strong`,
        body: 'You\'ve successfully transitioned into ketosis. Your body is now efficiently burning fat for fuel.',
        benefits: ['Ketone production active', 'Steady energy levels', 'Appetite control improved'],
        gradient: 'from-emerald-500/90 to-teal-600/90',
        icon: '⚡'
      };
    } else if (hours >= 6) {
      return {
        title: 'FAT BURNING MODE',
        subtitle: `${hours} Hours In`,
        body: 'Your glycogen stores are depleting and your body is beginning to shift toward fat metabolism.',
        benefits: ['Glycogen depletion', 'Fat oxidation starting', 'Metabolic switch beginning'],
        gradient: 'from-orange-500/90 to-red-500/90',
        icon: '🎯'
      };
    } else {
      return {
        title: 'BUILDING MOMENTUM',
        subtitle: `${hours} Hour${hours === 1 ? '' : 's'} Complete`,
        body: 'Great start! Your digestive system is resting and your body is beginning the transition to fasting metabolism.',
        benefits: ['Digestive rest active', 'Insulin levels dropping', 'Focus improving'],
        gradient: 'from-green-500/90 to-emerald-500/90',
        icon: '🌱'
      };
    }
  };

  const content = getMilestoneContent();

  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center p-6 transition-all duration-500",
      className
    )}>
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br backdrop-blur-sm",
        content.gradient
      )} />
      
      {/* Border effects for special milestones */}
      {hours >= 12 && (
        <>
          <div className="absolute inset-2 border-2 border-white/30 rounded-lg animate-pulse" />
          {hours >= 24 && (
            <div className="absolute inset-4 border border-white/20 rounded-lg animate-pulse" 
                 style={{ animationDelay: '0.5s' }} />
          )}
        </>
      )}

      {/* Content container */}
      <div className="relative z-10 text-center text-white max-w-sm">
        {/* Icon */}
        <div className="text-5xl mb-4 animate-bounce">
          {content.icon}
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-black tracking-wider mb-2 drop-shadow-lg">
          {content.title}
        </h2>
        
        {/* Subtitle */}
        <h3 className="text-lg font-bold mb-4 text-white/90 drop-shadow-lg">
          {content.subtitle}
        </h3>
        
        {/* Body text */}
        <p className="text-sm leading-relaxed mb-4 text-white/80 drop-shadow-lg">
          {content.body}
        </p>
        
        {/* Benefits list */}
        <div className="space-y-1">
          {content.benefits.map((benefit, index) => (
            <div 
              key={index}
              className="text-xs bg-white/10 rounded-full px-3 py-1 backdrop-blur-sm border border-white/20"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              ✨ {benefit}
            </div>
          ))}
        </div>
        
        {/* Hours badge */}
        <div className="mt-4 inline-block bg-white/20 rounded-full px-4 py-2 backdrop-blur-sm border border-white/30">
          <span className="font-bold text-sm">{hours}h</span>
        </div>
      </div>
    </div>
  );
};