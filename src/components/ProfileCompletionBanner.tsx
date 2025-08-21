import { useState } from 'react';
import { ChevronDown, ChevronRight, User, Scale, Ruler, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';

export const ProfileCompletionBanner = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { profile, isProfileComplete } = useProfile();
  const navigate = useNavigate();

  // Don't show if profile is complete - use conditional rendering instead of early return
  if (isProfileComplete()) {
    return null;
  }

  const missingFields = [];
  if (!profile?.weight) missingFields.push({ icon: Scale, label: 'Weight', key: 'weight' });
  if (!profile?.height) missingFields.push({ icon: Ruler, label: 'Height', key: 'height' });
  if (!profile?.age) missingFields.push({ icon: Calendar, label: 'Age', key: 'age' });

  return (
    <Card className="mx-4 mb-4 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
      <div className="p-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-medium text-amber-800 dark:text-amber-200">
              Complete Your Profile
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-amber-600 dark:text-amber-400">
              {missingFields.length} missing
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4">
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
              Add your profile information for accurate calorie calculations and personalized recommendations.
            </p>
            
            <div className="space-y-2 mb-4">
              {missingFields.map(({ icon: Icon, label, key }) => (
                <div key={key} className="flex items-center space-x-2 text-sm text-amber-700 dark:text-amber-300">
                  <Icon className="h-4 w-4" />
                  <span>Missing: {label}</span>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-800/20"
                onClick={() => navigate('/settings')}
              >
                Go to Settings
              </Button>
              <Button 
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
                onClick={() => {
                  // Scroll to bottom to show input area
                  const messagesEnd = document.querySelector('[data-messages-end]');
                  messagesEnd?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Tell AI Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};