import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface FloatingBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  onComplete?: () => void;
}

export const FloatingBubble = ({ content, role, onComplete }: FloatingBubbleProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-fade after showing for a while
    const fadeTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }, 4000 + content.length * 50); // Longer display for longer content

    return () => {
      clearTimeout(timer);
      clearTimeout(fadeTimer);
    };
  }, [content, onComplete]);

  const isUser = role === 'user';

  return (
    <div
      className={cn(
        "absolute transition-all duration-1000 ease-out",
        "max-w-xs p-3 rounded-2xl shadow-lg",
        "backdrop-blur-sm border",
        isUser ? 
          "bg-ai/20 border-ai/30 text-ai" :
          "bg-primary/10 border-primary/30 text-primary",
        isVisible && !isExiting ? "opacity-100 scale-100" : "opacity-0 scale-95",
        isUser ? "animate-float-up" : "animate-float-down"
      )}
      style={{
        left: `${Math.random() * 60 + 20}%`,
        animationDelay: `${Math.random() * 0.5}s`,
        animationDuration: `${3 + Math.random() * 2}s`
      }}
    >
      <p className="text-sm leading-relaxed">{content}</p>
      <div className={cn(
        "absolute w-2 h-2 rounded-full",
        isUser ? "bg-ai/40 -bottom-1 -right-1" : "bg-primary/40 -top-1 -left-1",
        "animate-pulse"
      )} />
    </div>
  );
};