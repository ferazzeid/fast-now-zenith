import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'Auto' },
  ] as const;

  return (
    <div className="flex bg-muted rounded-lg p-1 gap-1">
      {themeOptions.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant={theme === value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTheme(value)}
          className={`
            flex-1 h-8 px-2 transition-all duration-200
            ${theme === value 
              ? 'bg-background shadow-sm text-foreground' 
              : 'hover:bg-muted-foreground/10 text-muted-foreground'
            }
          `}
        >
          <Icon className="w-3.5 h-3.5 mr-1.5" />
          <span className="text-xs font-medium">{label}</span>
        </Button>
      ))}
    </div>
  );
};