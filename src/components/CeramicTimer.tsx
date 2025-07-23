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
      {/* Ceramic Plate Base - Outer Rim */}
      <div 
        className="relative w-80 h-80 rounded-full"
        style={{
          background: `
            radial-gradient(circle at 30% 30%, #ffffff, #f8f5ed 40%, #e8ddc7 70%, #d4c5a8 100%),
            linear-gradient(135deg, #f5f2ea 0%, #e8ddc7 50%, #d4c5a8 100%)
          `,
          boxShadow: `
            0 20px 40px rgba(0,0,0,0.15),
            0 8px 16px rgba(0,0,0,0.1),
            inset 0 2px 4px rgba(255,255,255,0.8),
            inset 0 -2px 8px rgba(0,0,0,0.1)
          `,
          border: '3px solid #c4b59a'
        }}
      >
        {/* Plate Rim - Raised Edge */}
        <div 
          className="absolute inset-2 rounded-full"
          style={{
            background: `
              linear-gradient(135deg, #f8f5ed 0%, #e8ddc7 50%, #ddd0b8 100%),
              radial-gradient(circle at 40% 40%, #ffffff, #f5f2ea 60%, #e8ddc7 100%)
            `,
            boxShadow: `
              inset 0 3px 6px rgba(255,255,255,0.9),
              inset 0 -3px 6px rgba(0,0,0,0.15),
              0 2px 4px rgba(0,0,0,0.1)
            `
          }}
        >
          {/* Inner Plate Depression - The actual eating surface */}
          <div 
            className="absolute inset-6 rounded-full relative overflow-hidden"
            style={{
              background: `
                radial-gradient(circle at 35% 35%, #ffffff, #f8f5ed 30%, #f0ead6 60%, #e8ddc7 100%),
                linear-gradient(145deg, #f5f2ea, #ebe6d7)
              `,
              boxShadow: `
                inset 0 8px 20px rgba(0,0,0,0.2),
                inset 0 4px 12px rgba(0,0,0,0.1),
                inset 0 -2px 8px rgba(255,255,255,0.4),
                0 1px 3px rgba(0,0,0,0.1)
              `,
              zIndex: 2
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
                stroke="#c4b59a"
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
    </div>
  );
};