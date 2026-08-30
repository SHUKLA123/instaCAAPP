import React, {createContext, useContext, useMemo} from 'react';
import {useColorScheme} from 'react-native';
import {ColorTokens, dark, light} from './colors';
import {spacing, radius} from './spacing';
import {typography} from './typography';

export interface Theme {
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  isDark: boolean;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({children}: {children: React.ReactNode}): React.JSX.Element {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const theme = useMemo<Theme>(
    () => ({
      colors: isDark ? dark : light,
      spacing,
      radius,
      typography,
      isDark,
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
