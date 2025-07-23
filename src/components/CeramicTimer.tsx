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
      {/* Ceramic Plate - Drop Shadow Base */}
      <div 
        className="relative w-80 h-80 rounded-full"
        style={{
          background: `linear-gradient(145deg, #d8cbb0 0%, #c7b399 100%)`,
          boxShadow: `
            0 25px 50px rgba(0,0,0,0.4),
            0 15px 30px rgba(0,0,0,0.2)
          `
        }}
      >
        {/* Thick Ceramic Rim - Takes up 1/3 of the plate */}
        <div 
          className="absolute inset-1 rounded-full"
          style={{
            background: `
              radial-gradient(ellipse at 35% 30%, 
                #faf8f5 0%, 
                #f4f1ec 25%, 
                #ede8de 50%, 
                #e6dfd1 75%, 
                #ddd6c5 100%
              )
            `,
            boxShadow: `
              0 12px 35px rgba(0,0,0,0.2),
              inset 0 8px 20px rgba(255,255,255,0.9),
              inset 0 -4px 12px rgba(0,0,0,0.1),
              inset 0 0 0 1px rgba(255,255,255,0.6)
            `
          }}
        >
          {/* Center Well - Much smaller, deeply recessed */}
          <div 
            className="absolute inset-16 rounded-full relative overflow-hidden"
            style={{
              background: `
                radial-gradient(ellipse at 40% 35%, 
                  #f6f3ee 0%, 
                  #f0ede6 30%, 
                  #e9e4db 60%, 
                  #e1dcd1 85%, 
                  #d9d3c6 100%
                )
              `,
              boxShadow: `
                inset 0 10px 25px rgba(0,0,0,0.25),
                inset 0 5px 15px rgba(0,0,0,0.15),
                inset 0 2px 8px rgba(0,0,0,0.1),
                inset 0 -2px 6px rgba(255,255,255,0.4)
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
  );
};