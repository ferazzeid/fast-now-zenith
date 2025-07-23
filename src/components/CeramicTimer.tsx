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
      {/* DEBUG: Ceramic Plate - Outer Rim with OBVIOUS styling */}
      <div 
        className="relative w-80 h-80 rounded-full border-8 border-red-500"
        style={{
          background: `
            radial-gradient(circle, #ff0000 0%, #00ff00 50%, #0000ff 100%)
          `,
          boxShadow: `
            0 20px 60px rgba(255,0,0,0.8),
            0 10px 20px rgba(0,255,0,0.6),
            inset 0 10px 20px rgba(0,0,255,0.4)
          `
        }}
      >
        {/* Plate Rim - Raised Edge */}
        <div 
          className="absolute inset-3 rounded-full relative"
          style={{
            background: `
              radial-gradient(ellipse at 35% 25%, rgba(255,255,255,1) 0%, rgba(252,252,252,0.98) 30%, rgba(248,248,248,0.95) 70%, rgba(242,242,242,0.9) 100%)
            `,
            boxShadow: `
              0 2px 8px rgba(0,0,0,0.08),
              inset 0 2px 4px rgba(255,255,255,0.8),
              inset 0 -1px 3px rgba(0,0,0,0.06)
            `
          }}
        >
          {/* Center Depressed Area */}
          <div 
            className="absolute inset-6 rounded-full relative overflow-hidden"
            style={{
              background: `
                radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.98) 0%, rgba(250,250,250,0.95) 40%, rgba(245,245,245,0.92) 80%, rgba(240,240,240,0.88) 100%)
              `,
              boxShadow: `
                inset 0 3px 12px rgba(0,0,0,0.08),
                inset 0 1px 4px rgba(0,0,0,0.05),
                inset 0 -1px 2px rgba(255,255,255,0.7)
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