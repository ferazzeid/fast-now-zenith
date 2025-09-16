import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatBubbleProps {
  message: Message;
  isLast: boolean;
  onDismiss: () => void;
}

export const ChatBubble = ({ message, isLast, onDismiss }: ChatBubbleProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldDismiss, setShouldDismiss] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-dismiss older messages after 30 seconds, but keep the last message
    if (!isLast) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [isLast]);

  const handleDismiss = () => {
    setShouldDismiss(true);
    setTimeout(() => {
      onDismiss();
    }, 300); // Match animation duration
  };

  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        "transform",
        isVisible && !shouldDismiss 
          ? "animate-chat-bubble-in" 
          : "opacity-0",
        shouldDismiss && "animate-chat-bubble-out"
      )}
    >
      <div className={cn(
        "group relative max-w-xs rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm",
        "border border-border/50",
        isUser 
          ? "ml-auto bg-primary/90 border-primary/50 text-primary-foreground" 
          : "mr-auto bg-secondary/90 border-secondary/50 text-secondary-foreground"
      )}>
        {/* Dismiss Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className={cn(
            "absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "bg-background border border-border shadow-sm"
          )}
        >
          <X className="h-3 w-3" />
        </Button>

        {/* Message Content */}
        <div className="text-sm leading-relaxed break-words">
          {message.content}
        </div>

        {/* Timestamp */}
        <div className="text-xs mt-1 opacity-70 text-white/70">
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>

        {/* Bubble Tail */}
        <div className={cn(
          "absolute top-3 w-3 h-3 transform rotate-45",
          "border-l border-b",
          isUser 
            ? "right-[-6px] bg-primary border-primary/50" 
            : "left-[-6px] bg-secondary border-secondary/50"
        )} />
      </div>
    </div>
  );
};
