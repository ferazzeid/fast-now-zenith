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
      {/* Simple Ceramic Plate - Clean White Design */}
      <div 
        className="relative w-80 h-80 rounded-full bg-white"
        style={{
          background: '#ffffff',
          boxShadow: `
            0 8px 32px rgba(0,0,0,0.12),
            0 2px 8px rgba(0,0,0,0.08),
            inset 0 1px 0 rgba(255,255,255,1),
            inset 0 0 0 1px rgba(0,0,0,0.03)
          `
        }}
      >
        {/* Subtle Rim Effect */}
        <div 
          className="absolute inset-4 rounded-full bg-white relative overflow-hidden"
          style={{
            background: '#ffffff',
            boxShadow: `
              inset 0 2px 8px rgba(0,0,0,0.06),
              inset 0 -1px 3px rgba(255,255,255,0.8)
            `
          }}
        >
          {/* Motivator Slideshow - Behind everything */}
          {showSlideshow && isActive && (
            <div className="absolute inset-0 rounded-full overflow-hidden" style={{ zIndex: 1 }}>
              <MotivatorSlideshow isActive={showSlideshow && isActive} />
            </div>
          )}
          
          {/* Progress Ring */}
          <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            style={{ zIndex: 5 }}
          >
            {/* Background Circle */}
            <circle
              stroke="rgba(0,0,0,0.1)"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx="50%"
              cy="50%"
              opacity={0.3}
            />
            
            {/* Progress Circle */}
            <circle
              stroke={isEatingWindow ? "#D4A855" : "#22C55E"}
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
                filter: `drop-shadow(0 0 6px ${
                  isEatingWindow ? 'rgba(212, 168, 85, 0.4)' : 'rgba(34, 197, 94, 0.4)'
                })`
              }}
            />
          </svg>

          {/* Center Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 10 }}>
            <div className="text-center space-y-2">
              <div 
                className="text-4xl font-bold tracking-wider text-gray-800"
                style={{ 
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {displayTime}
              </div>
              
              <div className="text-sm font-medium text-gray-600">
                {isEatingWindow ? '🍽️ Eating' : '✨ Fasting'}
              </div>
              
              {isActive && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mx-auto" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};