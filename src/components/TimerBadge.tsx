interface TimerBadgeProps {
  time: string;
  isEating?: boolean;
  className?: string;
}

export const TimerBadge = ({ time, isEating = false, className = "" }: TimerBadgeProps) => {
  return (
    <div 
      className={`
        absolute -top-1 -right-1 
        text-white text-xs 
        px-1.5 py-0.5 
        rounded-full 
        font-mono
        flex items-center justify-center
        w-[72px] h-6
        whitespace-nowrap
        ${isEating ? 'bg-amber-500' : 'bg-green-500'}
        ${className}
      `}
    >
      <span className="text-center">{time}</span>
    </div>
  );
};