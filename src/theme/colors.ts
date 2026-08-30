export interface ColorTokens {
  bg: string;
  bgElevated: string;
  bgSubtle: string;
  card: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  textInverse: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  online: string;
  busy: string;
  offline: string;
  overlay: string;
  skeleton: string;
  skeletonHighlight: string;
}

// Deep navy/teal fintech palette — trustworthy, not astrology-purple.
export const light: ColorTokens = {
  bg: '#F5F7F9',
  bgElevated: '#FFFFFF',
  bgSubtle: '#EEF2F5',
  card: '#FFFFFF',
  border: '#E1E7EC',
  borderStrong: '#C7D1D9',
  text: '#0B1F2A',
  textMuted: '#5B6B76',
  textFaint: '#8C99A3',
  textInverse: '#FFFFFF',
  primary: '#0B3B4E',
  primaryDark: '#062733',
  primaryLight: '#155A73',
  onPrimary: '#FFFFFF',
  accent: '#0E8C7F',
  onAccent: '#FFFFFF',
  success: '#1B8A5A',
  successBg: '#E4F5EC',
  warning: '#B5730A',
  warningBg: '#FBF0DD',
  danger: '#C23B3B',
  dangerBg: '#FBEAEA',
  online: '#1FAE6B',
  busy: '#E0A61B',
  offline: '#98A3AC',
  overlay: 'rgba(6, 22, 30, 0.55)',
  skeleton: '#E4E9ED',
  skeletonHighlight: '#F1F4F6',
};

export const dark: ColorTokens = {
  bg: '#081820',
  bgElevated: '#0F2731',
  bgSubtle: '#122E39',
  card: '#0F2731',
  border: '#1E3C48',
  borderStrong: '#2B4D5A',
  text: '#EAF2F5',
  textMuted: '#9FB4BE',
  textFaint: '#71888F',
  textInverse: '#0B1F2A',
  primary: '#2FA4C4',
  primaryDark: '#1B7793',
  primaryLight: '#5FC2DE',
  onPrimary: '#04141A',
  accent: '#25C7B0',
  onAccent: '#04211D',
  success: '#3FCB8B',
  successBg: '#0F3327',
  warning: '#E4B34C',
  warningBg: '#3A2C0E',
  danger: '#E36969',
  dangerBg: '#3A1414',
  online: '#3FCB8B',
  busy: '#E4B34C',
  offline: '#5D707A',
  overlay: 'rgba(2, 10, 14, 0.65)',
  skeleton: '#173441',
  skeletonHighlight: '#1F4150',
};
