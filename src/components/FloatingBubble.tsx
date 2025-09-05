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
        "w-full mb-6 transition-all duration-500 ease-out px-4",
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
            "bg-chat-user/90 border-chat-user/50 text-white rounded-tr-sm" :
            "bg-chat-ai/90 border-chat-ai/50 text-white rounded-tl-sm"
        )}
      >
        <p className="text-sm leading-relaxed font-medium">{content}</p>
      </div>
    </div>
  );
};