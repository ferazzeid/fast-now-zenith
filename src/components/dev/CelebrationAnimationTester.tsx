import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AnimationType = 'ring-pulse' | 'particle-burst' | 'color-wave' | 'fireworks';

interface CelebrationPreviewProps {
  type: AnimationType;
  isPlaying: boolean;
  onAnimationEnd: () => void;
}

const CelebrationPreview = ({ type, isPlaying, onAnimationEnd }: CelebrationPreviewProps) => {
  const baseClasses = "relative w-32 h-32 rounded-full border-4 border-ceramic-rim bg-ceramic-base transition-all duration-300";
  
  const getAnimationClasses = () => {
    if (!isPlaying) return baseClasses;
    
    switch (type) {
      case 'ring-pulse':
        return `${baseClasses} animate-pulse border-primary shadow-lg shadow-primary/50`;
      case 'particle-burst':
        return `${baseClasses} animate-bounce border-accent shadow-xl shadow-accent/60`;
      case 'color-wave':
        return `${baseClasses} border-gradient-primary shadow-2xl shadow-primary/70`;
      case 'fireworks':
        return `${baseClasses} animate-spin border-secondary shadow-2xl shadow-secondary/80`;
      default:
        return baseClasses;
    }
  };

  const getParticleEffect = () => {
    if (!isPlaying || type !== 'particle-burst') return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-accent rounded-full animate-ping"
            style={{
              top: '50%',
              left: '50%',
              animationDelay: `${i * 0.1}s`,
              transform: `rotate(${i * 45}deg) translateY(-20px)`,
            }}
          />
        ))}
      </div>
    );
  };

  const getFireworksEffect = () => {
    if (!isPlaying || type !== 'fireworks') return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-4 bg-gradient-to-t from-primary to-accent rounded-full animate-pulse"
            style={{
              top: '50%',
              left: '50%',
              animationDelay: `${i * 0.05}s`,
              transform: `rotate(${i * 30}deg) translateY(-25px)`,
              transformOrigin: 'bottom',
            }}
          />
        ))}
      </div>
    );
  };

  const getColorWaveEffect = () => {
    if (!isPlaying || type !== 'color-wave') return null;
    
    return (
      <div className="absolute inset-2 rounded-full bg-gradient-to-r from-primary via-accent to-secondary animate-spin" 
           style={{ animationDuration: '2s' }} />
    );
  };

  const getCenterContent = () => {
    const centerClasses = "absolute inset-4 rounded-full bg-ceramic-base border-2 border-ceramic-rim flex items-center justify-center text-xs font-bold";
    
    if (!isPlaying) {
      return <div className={centerClasses}>100%</div>;
    }

    switch (type) {
      case 'ring-pulse':
        return <div className={`${centerClasses} text-primary animate-pulse`}>GOAL!</div>;
      case 'particle-burst':
        return <div className={`${centerClasses} text-accent animate-bounce`}>🎯</div>;
      case 'color-wave':
        return <div className={`${centerClasses} text-secondary animate-pulse`}>✨</div>;
      case 'fireworks':
        return <div className={`${centerClasses} text-primary animate-spin`}>🎆</div>;
      default:
        return <div className={centerClasses}>100%</div>;
    }
  };

  // Auto-end animation after duration
  if (isPlaying) {
    const duration = type === 'fireworks' ? 3000 : type === 'particle-burst' ? 2500 : 2000;
    setTimeout(onAnimationEnd, duration);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={getAnimationClasses()}>
        {getColorWaveEffect()}
        {getParticleEffect()}
        {getFireworksEffect()}
        {getCenterContent()}
      </div>
    </div>
  );
};

export const CelebrationAnimationTester = () => {
  const [activeAnimation, setActiveAnimation] = useState<AnimationType | null>(null);

  const animations = [
    {
      type: 'ring-pulse' as AnimationType,
      name: 'Ring Pulse',
      description: 'Primary ring expands with color flash',
      duration: '2s'
    },
    {
      type: 'particle-burst' as AnimationType,
      name: 'Particle Burst',
      description: 'Sparkles emanate from center',
      duration: '2.5s'
    },
    {
      type: 'color-wave' as AnimationType,
      name: 'Color Wave',
      description: 'Rainbow wave through progress ring',
      duration: '2s'
    },
    {
      type: 'fireworks' as AnimationType,
      name: 'Fireworks',
      description: 'Multiple burst effects around ring',
      duration: '3s'
    }
  ];

  const handlePlayAnimation = (type: AnimationType) => {
    setActiveAnimation(type);
  };

  const handleAnimationEnd = () => {
    setActiveAnimation(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Celebration Animation Previews</CardTitle>
        <p className="text-sm text-muted-foreground">
          Test different celebration animations for when fasting goals are reached
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {animations.map((animation) => (
            <div key={animation.type} className="flex flex-col items-center space-y-3">
              <CelebrationPreview
                type={animation.type}
                isPlaying={activeAnimation === animation.type}
                onAnimationEnd={handleAnimationEnd}
              />
              
              <div className="text-center space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">{animation.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {animation.duration}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground max-w-32">
                  {animation.description}
                </p>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePlayAnimation(animation.type)}
                  disabled={activeAnimation === animation.type}
                  className="w-full"
                >
                  {activeAnimation === animation.type ? 'Playing...' : 'Preview'}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> These animations will be randomly rotated every hour during fasting sessions. 
            Each animation triggers when progress reaches 100% to celebrate goal completion.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};