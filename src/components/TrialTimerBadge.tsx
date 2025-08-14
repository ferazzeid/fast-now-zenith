interface TrialTimerBadgeProps {
  trialEndsAt: string;
  className?: string;
}

export const TrialTimerBadge = ({ trialEndsAt, className = "" }: TrialTimerBadgeProps) => {
  const getTrialInfo = () => {
    const now = new Date();
    const trialEnd = new Date(trialEndsAt);
    const timeDiff = trialEnd.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return { text: '0d', urgency: 'expired', expired: true };
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (days <= 1) urgency = 'critical';
    else if (days <= 3) urgency = 'high';
    else if (days <= 7) urgency = 'medium';
    
    const text = days > 0 ? `${days}d` : `${hours}h`;
    
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