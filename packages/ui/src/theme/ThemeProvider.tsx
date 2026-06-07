import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { getTheme, type Theme, type ThemeName } from './tokens';

type ThemeContextValue = {
  theme: Theme;
  themeName: ThemeName;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  name,
  children,
}: {
  name: ThemeName;
  children: ReactNode;
}) {
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: getTheme(name),
      themeName: name,
    }),
    [name]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx.theme;
}

export function useThemeName(): ThemeName {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeName must be used within a ThemeProvider');
  }
  return ctx.themeName;
}
