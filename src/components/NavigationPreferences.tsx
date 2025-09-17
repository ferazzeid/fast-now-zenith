import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigationPreferences } from "@/hooks/useNavigationPreferences";
import { Clock, Footprints, Utensils, Brain } from "lucide-react";

export function NavigationPreferences() {
  const { preferences, loading, saving, toggleNavigationItem, validatePreferences } = useNavigationPreferences();

  const navigationItems = [
    {
      key: 'fast' as const,
      label: 'Fast',
      description: 'Timer and fasting sessions',
      icon: Clock,
    },
    {
      key: 'walk' as const,
      label: 'Walk',
      description: 'Walking sessions and calorie burn',
      icon: Footprints,
    },
    {
      key: 'food' as const,
      label: 'Food',
      description: 'Food tracking and meal logging',
      icon: Utensils,
    },
    {
      key: 'goals' as const,
      label: 'Goals',
      description: 'Motivational content and goals',
      icon: Brain,
    },
  ];

  const handleToggle = async (key: keyof typeof preferences) => {
    // Check if this would disable the last active button
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    if (!validatePreferences(newPrefs)) {
      return; // Don't toggle if it would violate the minimum requirement
    }
    
    await toggleNavigationItem(key);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {navigationItems.map(({ key, label, description, icon: Icon }) => {
        const isEnabled = preferences[key];
        const activeCount = Object.values(preferences).filter(Boolean).length;
        const canDisable = activeCount > 1 || !isEnabled;

        return (
          <div key={key} className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center space-x-3">
              <Icon className="w-5 h-5 text-muted-foreground" />
              <div className="flex flex-col">
                <Label htmlFor={`nav-${key}`} className="font-medium text-sm">
                  {label}
                </Label>
                <span className="text-xs text-muted-foreground">{description}</span>
              </div>
            </div>
            <Switch
              id={`nav-${key}`}
              checked={isEnabled}
              onCheckedChange={() => handleToggle(key)}
              disabled={saving || !canDisable}
            />
          </div>
        );
      })}
      
      {saving && (
        <div className="text-xs text-muted-foreground text-center">
          Saving preferences...
        </div>
      )}
    </div>
  );
}