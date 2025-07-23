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
      {/* Ceramic Plate - Outer Rim */}
      <div 
        className="relative w-80 h-80 rounded-full"
        style={{
          background: `
            radial-gradient(ellipse at 30% 30%, #faf8f4 0%, #f4f1eb 25%, #ede8de 50%, #e6e0d2 75%, #ddd6c5 100%)
          `,
          boxShadow: `
            0 15px 45px rgba(0,0,0,0.25),
            0 5px 15px rgba(0,0,0,0.15),
            inset 0 4px 12px rgba(250,248,244,0.9),
            inset 0 -3px 8px rgba(0,0,0,0.15),
            inset 0 0 0 2px rgba(250,248,244,0.4)
          `
        }}
      >
        {/* Plate Rim - Raised Edge */}
        <div 
          className="absolute inset-3 rounded-full relative"
          style={{
            background: `
              radial-gradient(ellipse at 35% 25%, #f8f6f1 0%, #f2eee6 30%, #ebe6db 70%, #e3ddd0 100%)
            `,
            boxShadow: `
              0 3px 12px rgba(0,0,0,0.12),
              inset 0 3px 6px rgba(248,246,241,0.8),
              inset 0 -2px 4px rgba(0,0,0,0.1)
            `
          }}
        >
          {/* Center Depressed Area */}
          <div 
            className="absolute inset-6 rounded-full relative overflow-hidden"
            style={{
              background: `
                radial-gradient(ellipse at 40% 35%, #f6f4ef 0%, #f0ede6 30%, #e9e5dc 60%, #e2ddd2 100%)
              `,
              boxShadow: `
                inset 0 4px 15px rgba(0,0,0,0.12),
                inset 0 2px 6px rgba(0,0,0,0.08),
                inset 0 -1px 3px rgba(248,246,241,0.7)
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
    </div>
  );
};