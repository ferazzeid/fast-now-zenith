import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface FloatingBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  index: number;
  isSuccess?: boolean;
}

export const FloatingBubble = ({ content, role, index, isSuccess }: FloatingBubbleProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in with delay based on index
    const timer = setTimeout(() => setIsVisible(true), index * 200);
    return () => clearTimeout(timer);
  }, [index]);

  const isUser = role === 'user';
  
  // Detect success messages
  const isSuccessMessage = isSuccess || (
    !isUser && (
      content.toLowerCase().includes('added') ||
      content.toLowerCase().includes('foods added successfully') ||
      content.toLowerCase().includes('successfully added') ||
      content.toLowerCase().includes('processed your request')
    )
  );

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
            "bg-primary/90 border-primary/50 text-primary-foreground rounded-tr-sm" :
            "bg-secondary/90 border-secondary/50 text-secondary-foreground rounded-tl-sm"
        )}
      >
        <div className="flex items-start gap-2">
          {isSuccessMessage && (
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm leading-relaxed font-medium">{content}</p>
        </div>
      </div>
    </div>
  );
};