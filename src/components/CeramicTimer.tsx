interface CeramicTimerProps {
  progress: number;
  displayTime: string;
  isActive: boolean;
  isEatingWindow?: boolean;
  showSlideshow?: boolean;
}

import { MotivatorSlideshow } from './MotivatorSlideshow';

export const CeramicTimer = ({ 
  progress, 
  displayTime, 
  isActive, 
  isEatingWindow = false,
  showSlideshow = false
}: CeramicTimerProps) => {
  const radius = 120;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative">
      {/* Outer Ceramic Plate Base */}
      <div 
        className="relative w-80 h-80 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, 
            #ffffff, 
            #f8f8f8 40%, 
            #e8e8e8 70%, 
            #d5d5d5 100%)`,
          boxShadow: `
            0 20px 40px rgba(0,0,0,0.15),
            0 10px 20px rgba(0,0,0,0.1),
            inset 0 1px 0 rgba(255,255,255,0.8),
            inset 0 -1px 0 rgba(0,0,0,0.1)
          `
        }}
      >
        {/* Raised Rim */}
        <div 
          className="absolute inset-2 rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, 
              #ffffff, 
              #f5f5f5 50%, 
              #e0e0e0 100%)`,
            boxShadow: `
              inset 0 3px 6px rgba(255,255,255,0.9),
              inset 0 -3px 6px rgba(0,0,0,0.1),
              0 2px 4px rgba(0,0,0,0.1)
            `
          }}
        >
          {/* Deep Center Depression */}
          <div 
            className="absolute inset-6 rounded-full relative overflow-hidden"
            style={{
              background: `radial-gradient(circle at 35% 35%, 
                #f8f8f8, 
                #f0f0f0 40%, 
                #e8e8e8 70%, 
                #e0e0e0 100%)`,
              boxShadow: `
                inset 0 8px 16px rgba(0,0,0,0.15),
                inset 0 4px 8px rgba(0,0,0,0.1),
                inset 0 -2px 4px rgba(255,255,255,0.3)
              `
            }}
          >
          {/* Motivator Slideshow - Behind ceramic textures */}
          {showSlideshow && isActive && (
            <MotivatorSlideshow isActive={showSlideshow && isActive} />
          )}
          
          {/* Progress Ring */}
          <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))', zIndex: 5 }}
          >
            {/* Background Circle */}
            <circle
              stroke="hsl(var(--progress-bg))"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx="50%"
              cy="50%"
              opacity={0.3}
            />
            
            {/* Progress Circle */}
            <circle
              stroke={isEatingWindow ? "hsl(35 65% 55%)" : "hsl(var(--progress-active))"}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              r={normalizedRadius}
              cx="50%"
              cy="50%"
              className={`transition-all duration-1000 ease-out ${
                isActive ? 'animate-pulse' : ''
              }`}
              style={{
                filter: `drop-shadow(0 0 8px ${
                  isEatingWindow ? 'rgba(218, 165, 32, 0.5)' : 'rgba(34, 197, 94, 0.5)'
                })`
              }}
            />
          </svg>

          {/* Center Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 10 }}>
            <div className="text-center space-y-2">
              <div 
                className="text-4xl font-bold tracking-wider"
                style={{ 
                  color: 'hsl(var(--warm-text))',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {displayTime}
              </div>
              
              <div className="text-sm font-medium text-muted-foreground">
                {isEatingWindow ? '🍽️ Eating' : '✨ Fasting'}
              </div>
              
              {isActive && (
                <div className="w-2 h-2 bg-progress-active rounded-full animate-pulse mx-auto" />
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};