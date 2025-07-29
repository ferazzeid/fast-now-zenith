import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CrisisChatModal } from '@/components/CrisisChatModal';
import { useCrisisConversation } from '@/hooks/useCrisisConversation';

export const SOSSupport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  
  // Get crisis context from navigation state
  const crisisData = location.state as {
    context?: string;
    systemPrompt?: string;
    proactiveMessage?: string;
    quickReplies?: string[];
  } | null;

  const {
    generateCrisisContext,
    generateSystemPrompt,
    generateProactiveMessage,
    generateQuickReplies
  } = useCrisisConversation();

  // Default crisis context if none provided
  const [crisisContext] = useState(() => 
    crisisData?.context || generateCrisisContext({
      fastType: 'intermittent',
      timeElapsed: 0,
      goalDuration: 16,
      progress: 0,
      isInEatingWindow: false
    })
  );
  
  const [crisisSystemPrompt] = useState(() => 
    crisisData?.systemPrompt || generateSystemPrompt()
  );
  
  const [crisisProactiveMessage] = useState(() => 
    crisisData?.proactiveMessage || generateProactiveMessage()
  );
  
  const [crisisQuickReplies] = useState(() => 
    crisisData?.quickReplies || generateQuickReplies()
  );

  // Auto-open the crisis modal when page loads
  useEffect(() => {
    setShowCrisisModal(true);
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleModalClose = () => {
    setShowCrisisModal(false);
    // Give a moment for modal to close, then navigate back
    setTimeout(() => navigate(-1), 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">Crisis Support</h1>
          <div /> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🆘</span>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-red-600">
              Crisis Support Available
            </h2>
            <p className="text-muted-foreground">
              You've been fasting for an extended period. Our AI crisis support is here to help you make safe decisions about your health and wellbeing.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-red-800 mb-2">Emergency Resources</h3>
            <div className="space-y-2 text-sm text-red-700">
              <p>• If you're experiencing a medical emergency, call emergency services immediately</p>
              <p>• For eating disorder support: National Eating Disorders Association (NEDA) 1-800-931-2237</p>
              <p>• Crisis Text Line: Text HOME to 741741</p>
            </div>
          </div>
        </div>

        {/* Crisis Chat Modal */}
        <CrisisChatModal 
          isOpen={showCrisisModal} 
          onClose={handleModalClose}
          context={crisisContext}
          systemPrompt={crisisSystemPrompt}
          proactiveMessage={crisisProactiveMessage}
          quickReplies={crisisQuickReplies}
        />
      </div>
    </div>
  );
};