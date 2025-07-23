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
      {/* Ceramic Plate Base */}
      <div 
        className="relative w-80 h-80 rounded-full shadow-2xl"
        style={{
          background: `radial-gradient(circle at 30% 30%, 
            #f5f2ea, 
            #ebe6d7 60%, 
            #d4c5a8 100%)`,
          boxShadow: `
            inset 0 8px 16px rgba(0,0,0,0.1),
            inset 0 -8px 16px rgba(255,255,255,0.3),
            0 16px 32px rgba(0,0,0,0.15),
            0 0 0 3px #d4c5a8
          `,
          border: '2px solid #c4b59a'
        }}
      >
        {/* Inner Plate Depression */}
        <div 
          className="absolute inset-4 rounded-full relative overflow-hidden"
          style={{
            background: `radial-gradient(circle at 40% 40%, 
              #ebe6d7, 
              #f5f2ea 70%)`,
            boxShadow: `
              inset 0 4px 12px rgba(0,0,0,0.15),
              inset 0 -2px 8px rgba(255,255,255,0.2)
            `,
            zIndex: 2,
            border: '1px solid #e0dbc9'
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
              stroke="#d4c5a8"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx="50%"
              cy="50%"
              opacity={0.3}
            />
            
            {/* Progress Circle */}
            <circle
              stroke={isEatingWindow ? "#daa520" : "#22c55e"}
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
                  color: '#3e332a',
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
  );
};