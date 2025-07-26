import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Settings } from 'lucide-react';

const Motivators = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-ceramic-base safe-top safe-bottom">
      <div className="px-4 pt-8 pb-24">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <Heart className="w-12 h-12 text-primary mx-auto" />
            <h1 className="text-3xl font-bold text-warm-text">Motivators</h1>
            <p className="text-muted-foreground">
              Motivators are now available in Settings for better organization
            </p>
          </div>

          {/* Redirect Button */}
          <Button 
            onClick={() => navigate('/settings')}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Settings className="w-4 h-4 mr-2" />
            Go to Settings to Manage Motivators
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Motivators;