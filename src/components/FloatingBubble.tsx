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
        "w-full mb-4 transition-all duration-500 ease-out px-4",
        "flex",
        isUser ? "justify-end" : "justify-start",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] p-4 rounded-2xl shadow-lg relative",
          "border",
          isUser ? 
            "bg-ai/90 border-ai/50 text-white rounded-tr-sm" :
            "bg-primary/90 border-primary/50 text-white rounded-tl-sm"
        )}
      >
        <p className="text-sm leading-relaxed font-medium">{content}</p>
        <div className={cn(
          "absolute w-2 h-2 rounded-full",
          isUser ? "bg-ai -bottom-1 -right-1" : "bg-primary -bottom-1 -left-1",
          "animate-pulse"
        )} />
      </div>
    </div>
  );
};