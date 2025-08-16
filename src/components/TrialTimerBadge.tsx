interface TrialTimerBadgeProps {
  daysRemaining: number | null;
  className?: string;
}

export const TrialTimerBadge = ({ daysRemaining, className = "" }: TrialTimerBadgeProps) => {
  const getTrialInfo = () => {
    if (!daysRemaining || daysRemaining <= 0) {
      return { text: '0d', urgency: 'expired', expired: true };
    }
    
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (daysRemaining <= 1) urgency = 'critical';
    else if (daysRemaining <= 3) urgency = 'high';
    else if (daysRemaining <= 7) urgency = 'medium';
    
    const text = `${daysRemaining}d`;
    
    return { text, urgency, expired: false };
  };

  const trialInfo = getTrialInfo();
  
  const getUrgencyStyles = (urgency: string, expired: boolean) => {
    if (expired) return 'bg-red-600 animate-pulse';
    
    switch (urgency) {
      case 'critical': return 'bg-red-500 animate-pulse';
      case 'high': return 'bg-red-400';
      case 'medium': return 'bg-orange-400';
      case 'low': 
      default: return 'bg-green-500';
    }
  };
  
  return (
    <div 
      className={`
        absolute -top-1 right-0
        text-white text-xs 
        px-1.5 py-0.5 
        rounded-full 
        font-mono font-semibold
        flex items-center justify-center
        w-[28px] h-4
        whitespace-nowrap
        ${getUrgencyStyles(trialInfo.urgency, trialInfo.expired)}
        ${className}
      `}
      title={trialInfo.expired ? 'Trial expired' : `Trial expires in ${trialInfo.text}`}
    >
      <span className="text-center text-[10px]">{trialInfo.text}</span>
    </div>
  );
};