import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface NavigationPreferences {
  fast: boolean;
  walk: boolean;
  food: boolean;
  goals: boolean;
}

const DEFAULT_PREFERENCES: NavigationPreferences = {
  fast: true,
  walk: true,
  food: true,
  goals: true,
};

interface NavigationPreferencesContextType {
  preferences: NavigationPreferences;
  loading: boolean;
  saving: boolean;
  updatePreferences: (newPreferences: NavigationPreferences) => Promise<boolean>;
  toggleNavigationItem: (key: keyof NavigationPreferences) => Promise<boolean>;
  validatePreferences: (newPrefs: NavigationPreferences) => boolean;
}

const NavigationPreferencesContext = createContext<NavigationPreferencesContextType | undefined>(undefined);

export const useNavigationPreferences = () => {
  const context = useContext(NavigationPreferencesContext);
  if (!context) {
    throw new Error('useNavigationPreferences must be used within a NavigationPreferencesProvider');
  }
  return context;
};

interface NavigationPreferencesProviderProps {
  children: ReactNode;
}

export const NavigationPreferencesProvider = ({ children }: NavigationPreferencesProviderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NavigationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load preferences from database
  useEffect(() => {
    async function loadPreferences() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('navigation_preferences')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        if (data?.navigation_preferences) {
          const prefs = data.navigation_preferences as Record<string, boolean>;
          setPreferences({
            fast: prefs.fast ?? true,
            walk: prefs.walk ?? true,
            food: prefs.food ?? true,
            goals: prefs.goals ?? true,
          });
        }
      } catch (error) {
        console.error('Error loading navigation preferences:', error);
        // Use defaults on error
        setPreferences(DEFAULT_PREFERENCES);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [user]);

  // Validate that at least one button is enabled
  const validatePreferences = (newPrefs: NavigationPreferences): boolean => {
    return Object.values(newPrefs).some(enabled => enabled);
  };

  // Update preferences in database
  const updatePreferences = async (newPreferences: NavigationPreferences): Promise<boolean> => {
    if (!user) return false;

    if (!validatePreferences(newPreferences)) {
      toast({
        title: "Invalid Selection",
        description: "At least one navigation button must remain active.",
        variant: "destructive",
      });
      return false;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ navigation_preferences: { ...newPreferences } })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state immediately for real-time UI updates
      setPreferences(newPreferences);
      
      toast({
        title: "Navigation Updated",
        description: "Your navigation preferences have been saved.",
      });

      return true;
    } catch (error) {
      console.error('Error updating navigation preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update navigation preferences. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Toggle a specific navigation item
  const toggleNavigationItem = async (key: keyof NavigationPreferences): Promise<boolean> => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };

    return await updatePreferences(newPreferences);
  };

  const value = {
    preferences,
    loading,
    saving,
    updatePreferences,
    toggleNavigationItem,
    validatePreferences,
  };

  return (
    <NavigationPreferencesContext.Provider value={value}>
      {children}
    </NavigationPreferencesContext.Provider>
  );
};