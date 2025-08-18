import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    // 🔧 FORCE STABLE THEME: Never auto-switch to system
    const validTheme = (saved as Theme) || 'dark';
    return validTheme === 'system' ? 'dark' : validTheme;
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // 🔧 FORCE STABLE THEME - NO system monitoring whatsoever
    let finalTheme = theme;
    
    // Convert system to dark for stability
    if (theme === 'system') {
      finalTheme = 'dark';
      setTheme('dark');
      localStorage.setItem('theme', 'dark');
    }
    
    // Apply theme without any system monitoring
    setActualTheme(finalTheme as 'light' | 'dark');
    document.documentElement.classList.toggle('dark', finalTheme === 'dark');
  }, [theme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};