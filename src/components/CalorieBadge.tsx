interface CalorieBadgeProps {
  calories: number;
  className?: string;
}

export const CalorieBadge = ({ calories, className = "" }: CalorieBadgeProps) => {
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
        bg-accent
        ${className}
      `}
    >
      <span className="text-center">{calories}</span>
    </div>
  );
};