import { useState, useEffect } from 'react';
import { useMotivators } from '@/hooks/useMotivators';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';

interface MotivatorRotationSystemProps {
  isActive: boolean;
  transitionTime?: number;
  onModeChange?: (mode: 'timer-focused' | 'motivator-focused') => void;
  className?: string;
}

type DisplayMode = 'timer-focused' | 'motivator-focused';
type MotivatorType = 'image' | 'text';

interface MotivatorItem {
  type: MotivatorType;
  data: any;
}

export const MotivatorRotationSystem = ({ 
  isActive, 
  transitionTime = 12, 
  onModeChange,
  className = ""
}: MotivatorRotationSystemProps) => {
  const { motivators } = useMotivators();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('timer-focused');
  const [celebrationAnimation, setCelebrationAnimation] = useState<'ring-pulse' | 'particle-burst' | 'fireworks' | null>(null);

  // Combine all motivators (images first, then text) into one array
  const allMotivators: MotivatorItem[] = [
    ...motivators.filter(m => m.imageUrl).map(m => ({ type: 'image' as MotivatorType, data: m })),
    ...motivators.filter(m => !m.imageUrl && m.title).map(m => ({ type: 'text' as MotivatorType, data: m }))
  ];

  // Dynamic text sizing based on length
  const getTextSize = (text: string) => {
    if (text.length <= 15) return 'text-3xl';
    if (text.length <= 25) return 'text-2xl';
    if (text.length <= 40) return 'text-xl';
    return 'text-lg';
  };

  useEffect(() => {
    if (!isActive || allMotivators.length === 0) {
      setDisplayMode('timer-focused');
      onModeChange?.('timer-focused');
      return;
    }

    const runCycle = () => {
      // Timer phase (4 seconds)
      setDisplayMode('timer-focused');
      onModeChange?.('timer-focused');
      setCelebrationAnimation(null);

      setTimeout(() => {
        // Motivator phase (5 seconds)
        setDisplayMode('motivator-focused');
        onModeChange?.('motivator-focused');

        // Set celebration animation based on motivator type
        const currentMotivator = allMotivators[currentIndex];
        if (currentMotivator.type === 'image') {
          setCelebrationAnimation(Math.random() > 0.5 ? 'particle-burst' : 'fireworks');
        } else {
          setCelebrationAnimation('ring-pulse');
        }

        // Switch back to timer and advance index
        setTimeout(() => {
          setDisplayMode('timer-focused');
          onModeChange?.('timer-focused');
          setCelebrationAnimation(null);
          
          setTimeout(() => {
            setCurrentIndex(prev => (prev + 1) % allMotivators.length);
          }, 1000);
        }, 5000);
      }, 4000);
    };

    // Start immediately
    runCycle();

    // Set up interval for continuous cycling
    const interval = setInterval(runCycle, transitionTime * 1000);

    return () => clearInterval(interval);
  }, [isActive, allMotivators.length, currentIndex, transitionTime, onModeChange]);

  if (!isActive || allMotivators.length === 0) {
    return null;
  }

  const currentMotivator = allMotivators[currentIndex];

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Image Motivators */}
      {displayMode === 'motivator-focused' && currentMotivator.type === 'image' && (
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <MotivatorImageWithFallback
            src={currentMotivator.data.imageUrl}
            alt={currentMotivator.data.title || 'Motivator image'}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: 'brightness(0.8) saturate(1.2) contrast(1.1)'
            }}
          />
          
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Celebration animation overlay */}
          {celebrationAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {celebrationAnimation === 'particle-burst' && (
                <div className="relative">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-3 h-3 bg-accent rounded-full animate-ping"
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        transform: `rotate(${i * 45}deg) translateY(-40px)`,
                        transformOrigin: 'center',
                      }}
                    />
                  ))}
                </div>
              )}
              
              {celebrationAnimation === 'fireworks' && (
                <div className="relative">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-8 bg-gradient-to-t from-primary to-accent rounded-full animate-pulse"
                      style={{
                        animationDelay: `${i * 0.05}s`,
                        transform: `rotate(${i * 30}deg) translateY(-50px)`,
                        transformOrigin: 'bottom',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Motivator text overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white font-bold text-center px-6 py-4">
              <div 
                className={`${getTextSize(currentMotivator.data.title)} leading-tight`}
                style={{
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                  animation: 'fadeIn 0.5s ease-out'
                }}
              >
                {currentMotivator.data.title.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Text Motivators */}
      {displayMode === 'motivator-focused' && currentMotivator.type === 'text' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className={`relative ${celebrationAnimation === 'ring-pulse' ? 'animate-pulse' : ''}`}
            style={{
              animation: 'fadeIn 0.5s ease-out'
            }}
          >
            {/* Ring pulse effect */}
            {celebrationAnimation === 'ring-pulse' && (
              <div 
                className="absolute inset-0 border-4 border-primary rounded-full animate-pulse"
                style={{
                  width: '120%',
                  height: '120%',
                  left: '-10%',
                  top: '-10%',
                  boxShadow: '0 0 20px hsl(var(--primary) / 0.5)'
                }}
              />
            )}
            
            {/* Text content */}
            <div 
              className={`
                ${getTextSize(currentMotivator.data.title)} 
                font-bold text-center text-primary px-6 py-4 rounded-lg
                bg-background/90 backdrop-blur-sm border border-primary/20
              `}
              style={{
                textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {currentMotivator.data.title.toUpperCase()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};