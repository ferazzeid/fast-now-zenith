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
      {/* Ceramic Plate Base - Outer Shadow */}
      <div 
        className="relative w-80 h-80 rounded-full"
        style={{
          background: `linear-gradient(135deg, #e8dcc6 0%, #d4c4a8 50%, #c7b299 100%)`,
          boxShadow: `
            0 20px 60px rgba(0,0,0,0.3),
            0 10px 30px rgba(0,0,0,0.2)
          `
        }}
      >
        {/* Plate Surface - Raised from base */}
        <div 
          className="absolute inset-2 rounded-full"
          style={{
            background: `radial-gradient(ellipse at 30% 30%, #f5f0e8 0%, #ede3d6 40%, #e2d5c4 100%)`,
            boxShadow: `
              0 8px 25px rgba(0,0,0,0.15),
              inset 0 5px 15px rgba(255,255,255,0.6),
              inset 0 -2px 8px rgba(0,0,0,0.1)
            `
          }}
        >
          {/* Plate Rim - Inner raised edge */}
          <div 
            className="absolute inset-4 rounded-full"
            style={{
              background: `radial-gradient(ellipse at 35% 25%, #f8f4ec 0%, #f0e8db 50%, #e6d9c8 100%)`,
              boxShadow: `
                inset 0 3px 10px rgba(255,255,255,0.7),
                inset 0 -1px 5px rgba(0,0,0,0.08)
              `
            }}
          >
            {/* Center Well - Depressed area */}
            <div 
              className="absolute inset-6 rounded-full relative overflow-hidden"
              style={{
                background: `radial-gradient(ellipse at 45% 40%, #f2ebe0 0%, #e8ddd0 60%, #ddd0bf 100%)`,
                boxShadow: `
                  inset 0 6px 20px rgba(0,0,0,0.15),
                  inset 0 3px 10px rgba(0,0,0,0.1),
                  inset 0 -1px 4px rgba(255,255,255,0.5)
                `,
                zIndex: 1
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
      </div>
    </div>
  );
};