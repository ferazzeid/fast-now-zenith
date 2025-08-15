import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface FloatingBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  index: number;
}

export const FloatingBubble = ({ content, role, index }: FloatingBubbleProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in with delay based on index
    const timer = setTimeout(() => setIsVisible(true), index * 200);
    return () => clearTimeout(timer);
  }, [index]);

  const isUser = role === 'user';

  return (
    <div
      className={cn(
        "w-full mb-4 transition-all duration-500 ease-out",
        "flex",
        isUser ? "justify-end" : "justify-start",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] p-3 rounded-2xl shadow-lg",
          "backdrop-blur-sm border",
          isUser ? 
            "bg-ai/20 border-ai/30 text-ai rounded-tr-sm" :
            "bg-primary/10 border-primary/30 text-primary rounded-tl-sm"
        )}
      >
        <p className="text-sm leading-relaxed">{content}</p>
        <div className={cn(
          "absolute w-2 h-2 rounded-full",
          isUser ? "bg-ai/40 -bottom-1 -right-1" : "bg-primary/40 -bottom-1 -left-1",
          "animate-pulse"
        )} />
      </div>
    </div>
  );
};