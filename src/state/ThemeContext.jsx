import React, { createContext, useContext, useState, useEffect } from 'react';
import { persistenceService } from '../services/persistenceService.js';
import { soundFx } from '../utils/soundEffects.js';

export const THEMES = [
  {
    id: 'cyber',
    name: 'Deep Space Cyan',
    label: 'Cyber Orbit',
    accentColor: '#38bdf8',
    secondaryColor: '#3b82f6',
    badge: 'NASA Default',
    description: 'Standard deep space telemetry with cyan & azure telemetry indicators.',
  },
  {
    id: 'mars',
    name: 'Mars Ares Crimson',
    label: 'Ares Red',
    accentColor: '#ef4444',
    secondaryColor: '#f59e0b',
    badge: 'Perseverance',
    description: 'Martian atmospheric exploration theme with crimson and amber sensors.',
  },
  {
    id: 'nebula',
    name: 'Cosmic Nebula Violet',
    label: 'Nebula Violet',
    accentColor: '#a855f7',
    secondaryColor: '#ec4899',
    badge: 'Deep Cosmos',
    description: 'Ultraviolet astrophysics theme inspired by James Webb deep field imagery.',
  },
  {
    id: 'emerald',
    name: 'Emerald Radar Matrix',
    label: 'Radar Green',
    accentColor: '#10b981',
    secondaryColor: '#14b8a6',
    badge: 'Flight Radar',
    description: 'Military orbital surveillance console with phosphor green tracking radar.',
  },
  {
    id: 'solar',
    name: 'Solar Artemis Gold',
    label: 'Solar Gold',
    accentColor: '#f59e0b',
    secondaryColor: '#fbbf24',
    badge: 'Artemis & Apollo',
    description: 'Solar corona observation mode with luminous gold & warm bronze telemetry.',
  },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('astraject_theme') || 'cyber';
    } catch {
      return 'cyber';
    }
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('astraject_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [soundEnabled, setSoundEnabledState] = useState(() => {
    try {
      const settings = persistenceService.getSettings();
      return !!settings.soundEnabled;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('astraject_theme', theme);
    } catch (e) {
      console.warn('Failed to persist theme:', e);
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('astraject_sidebar_collapsed', String(isSidebarCollapsed));
    } catch (e) {
      console.warn('Failed to persist sidebar state:', e);
    }
  }, [isSidebarCollapsed]);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    if (soundEnabled) {
      soundFx.playSwitch();
    }
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => !prev);
    if (soundEnabled) {
      soundFx.playClick();
    }
  };

  const setSoundEnabled = (enabled) => {
    setSoundEnabledState(enabled);
    const settings = persistenceService.getSettings();
    persistenceService.saveSettings({ ...settings, soundEnabled: enabled });
    if (enabled) {
      soundFx.playBeep();
    }
  };

  const playUiSound = (type = 'click') => {
    if (!soundEnabled) return;
    if (type === 'click') soundFx.playClick();
    else if (type === 'beep') soundFx.playBeep();
    else if (type === 'switch') soundFx.playSwitch();
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themes: THEMES,
        currentThemeMeta: THEMES.find(t => t.id === theme) || THEMES[0],
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebarCollapse,
        soundEnabled,
        setSoundEnabled,
        playUiSound,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
