import { createContext, useContext, useState, ReactNode } from 'react';

interface AnimationContextType {
  isAnimationsSuspended: boolean;
  suspendAnimations: () => void;
  resumeAnimations: () => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const useAnimationControl = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimationControl must be used within AnimationProvider');
  }
  return context;
};

interface AnimationProviderProps {
  children: ReactNode;
}

export const AnimationProvider = ({ children }: AnimationProviderProps) => {
  const [isAnimationsSuspended, setIsAnimationsSuspended] = useState(false);

  const suspendAnimations = () => {
    setIsAnimationsSuspended(true);
    // Add CSS to disable all animations
    const style = document.createElement('style');
    style.id = 'suspend-animations';
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        transition-delay: 0ms !important;
      }
    `;
    document.head.appendChild(style);
  };

  const resumeAnimations = () => {
    setIsAnimationsSuspended(false);
    // Remove the animation suspension CSS
    const suspendStyle = document.getElementById('suspend-animations');
    if (suspendStyle) {
      suspendStyle.remove();
    }
  };

  return (
    <AnimationContext.Provider value={{
      isAnimationsSuspended,
      suspendAnimations,
      resumeAnimations
    }}>
      {children}
    </AnimationContext.Provider>
  );
};