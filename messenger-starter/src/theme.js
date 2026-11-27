import { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export const lightColors = {
  background: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F4F9',
  border: '#E9ECF3',
  header: '#252B48',
  headerSubtle: '#C4C9DC',
  primary: '#6558F5',
  primaryDisabled: '#B8B4E8',
  text: '#30364B',
  textStrong: '#252B48',
  textMuted: '#9299A6',
  onPrimary: '#FFFFFF',
  online: '#5CE0A0',
  danger: '#E5484D',
  highlight: '#FFE066',
  onHighlight: '#30364B',
  activeMatch: '#F5B700',
  warningBg: '#FFF4E5',
  warningBorder: '#FFE0B2',
  warningText: '#8A5300',
  warningDot: '#F59E0B',
  overlay: 'rgba(15, 18, 34, 0.45)',
};

export const darkColors = {
  background: '#11131C',
  surface: '#1C2030',
  surfaceMuted: '#242939',
  border: '#2E3447',
  header: '#181B2B',
  headerSubtle: '#9AA1B9',
  primary: '#7B70FF',
  primaryDisabled: '#4A4580',
  text: '#E3E6F0',
  textStrong: '#F4F5FA',
  textMuted: '#7D849A',
  onPrimary: '#FFFFFF',
  online: '#5CE0A0',
  danger: '#F2555A',
  highlight: '#F5C84C',
  onHighlight: '#1A1A1A',
  activeMatch: '#F5B700',
  warningBg: '#3A2C12',
  warningBorder: '#57421A',
  warningText: '#FFD58A',
  warningDot: '#F59E0B',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const radius = {
  bubble: 18,
  tail: 5,
  pill: 25,
};

// Soft background + strong foreground pairs used for user avatars.
const AVATAR_PALETTE_LIGHT = [
  { bg: '#DCD9FF', fg: '#554BC8' },
  { bg: '#FFE1D6', fg: '#C4532A' },
  { bg: '#D4F3E6', fg: '#1F8A5B' },
  { bg: '#FFF1C7', fg: '#A8780A' },
  { bg: '#D9ECFF', fg: '#2468B5' },
  { bg: '#FADBEA', fg: '#B23A78' },
  { bg: '#E3E7EE', fg: '#4A5568' },
];

// Same hues, deeper backgrounds and lighter text so they read on dark surfaces.
const AVATAR_PALETTE_DARK = [
  { bg: '#38336B', fg: '#B9B3FF' },
  { bg: '#5A3226', fg: '#FFB59A' },
  { bg: '#1F4A3A', fg: '#8FE3BE' },
  { bg: '#4D4016', fg: '#F7D774' },
  { bg: '#1E3A5C', fg: '#9CC8FF' },
  { bg: '#55253F', fg: '#F5A3CB' },
  { bg: '#363C4A', fg: '#C3CAD8' },
];

// Same name always maps to the same color.
export function colorForUser(name = '', isDark = false) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const palette = isDark ? AVATAR_PALETTE_DARK : AVATAR_PALETTE_LIGHT;
  return palette[Math.abs(hash) % palette.length];
}

// ---- Theme context ---------------------------------------------------------

export const THEME_MODES = ['system', 'light', 'dark'];

const ThemeContext = createContext({
  colors: lightColors,
  isDark: false,
  mode: 'system',
  setMode: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('system');
  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const value = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      mode,
      setMode,
    }),
    [isDark, mode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Builds a StyleSheet from the current colors, rebuilt only when the theme changes. */
export function useThemedStyles(makeStyles) {
  const theme = useTheme();
  const styles = useMemo(
    () => makeStyles(theme.colors),
    [makeStyles, theme.colors],
  );
  return { ...theme, styles };
}
