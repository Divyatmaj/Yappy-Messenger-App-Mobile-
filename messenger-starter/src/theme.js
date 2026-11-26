export const colors = {
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
};

export const radius = {
  bubble: 18,
  tail: 5,
  pill: 25,
};

// Soft background + strong foreground pairs used for user avatars.
const AVATAR_PALETTE = [
  { bg: '#DCD9FF', fg: '#554BC8' },
  { bg: '#FFE1D6', fg: '#C4532A' },
  { bg: '#D4F3E6', fg: '#1F8A5B' },
  { bg: '#FFF1C7', fg: '#A8780A' },
  { bg: '#D9ECFF', fg: '#2468B5' },
  { bg: '#FADBEA', fg: '#B23A78' },
  { bg: '#E3E7EE', fg: '#4A5568' },
];

// Same name always maps to the same color.
export function colorForUser(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
