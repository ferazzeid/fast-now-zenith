import { useState, useEffect } from 'react';
import { useMotivators } from '@/hooks/useMotivators';

interface MotivatorSlideshowProps {
  isActive: boolean;
  transitionTime?: number;
}

export const MotivatorSlideshow = ({ isActive, transitionTime = 15 }: MotivatorSlideshowProps) => {
  const { motivators } = useMotivators();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const motivatorsWithImages = motivators.filter(m => m.imageUrl);

  useEffect(() => {
    if (!isActive || motivatorsWithImages.length === 0) {
      setIsVisible(false);
      return;
    }

    const interval = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % motivatorsWithImages.length);
        setIsVisible(true);
      }, 1000); // Fade out duration
      
    }, transitionTime * 1000);

    // Initial show with delay to let plate render first
    setTimeout(() => setIsVisible(true), 500);

    return () => clearInterval(interval);
  }, [isActive, motivatorsWithImages.length, transitionTime]);

  if (!isActive || motivatorsWithImages.length === 0) {
    return null;
  }

  const currentMotivator = motivatorsWithImages[currentIndex];

  return (
    <>
      {/* Background Image Layer - Behind the ceramic plate textures */}
      <div 
        className={`absolute inset-0 rounded-full overflow-hidden transition-opacity duration-1000 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ zIndex: 1 }}
      >
        <div 
          className="absolute inset-0 animate-scale-in"
          style={{
            backgroundImage: `url(${currentMotivator?.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(2px) brightness(0.4) saturate(1.2)',
          }}
        />
        
        {/* Ceramic overlay to maintain plate texture over image */}
        <div 
          className="absolute inset-0 mix-blend-multiply"
          style={{
            background: `radial-gradient(circle at 40% 40%, 
              hsla(var(--ceramic-base), 0.8), 
              hsla(var(--ceramic-plate), 0.6) 70%,
              transparent 100%)`
          }}
        />
      </div>

      {/* Subtle motivator text hint at bottom of plate */}
      {isVisible && currentMotivator && (
        <div 
          className="absolute bottom-2 left-2 right-2 text-center transition-opacity duration-1000 animate-fade-in"
          style={{ zIndex: 10 }}
        >
          <p className="text-xs text-warm-text/60 font-medium bg-ceramic-plate/40 backdrop-blur-sm rounded-full px-2 py-1 border border-ceramic-rim/20">
            {currentMotivator.title}
          </p>
        </div>
      )}
    </>
  );
};