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
      }, 500); // Fade out duration
      
    }, transitionTime * 1000);

    // Initial show
    setIsVisible(true);

    return () => clearInterval(interval);
  }, [isActive, motivatorsWithImages.length, transitionTime]);

  if (!isActive || motivatorsWithImages.length === 0) {
    return null;
  }

  const currentMotivator = motivatorsWithImages[currentIndex];

  return (
    <div className="absolute inset-4 rounded-full overflow-hidden pointer-events-none">
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ${
          isVisible ? 'opacity-20' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url(${currentMotivator?.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(1px) brightness(0.7)',
        }}
      />
      
      {/* Gradient overlay to ensure timer visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-ceramic-plate/20 via-transparent to-ceramic-plate/20" />
      
      {/* Motivator text overlay */}
      {isVisible && currentMotivator && (
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <p className="text-xs text-warm-text/80 font-medium bg-ceramic-plate/60 backdrop-blur-sm rounded-full px-3 py-1">
            {currentMotivator.title}
          </p>
        </div>
      )}
    </div>
  );
};