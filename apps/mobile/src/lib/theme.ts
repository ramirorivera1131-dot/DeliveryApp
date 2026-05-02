import { useColorScheme } from 'react-native'

export const PRIMARY = '#f97316'
export const SUCCESS = '#22c55e'
export const ERROR   = '#ef4444'
export const WARNING = '#f59e0b'

const shared = {
  primary:        PRIMARY,
  primaryDark:    '#ea6008',
  primaryLight:   '#fff7ed',
  success:        SUCCESS,
  successLight:   '#f0fdf4',
  error:          ERROR,
  errorLight:     '#fef2f2',
  warning:        WARNING,
  warningLight:   '#fffbeb',
  info:           '#3b82f6',
  infoLight:      '#eff6ff',
}

const light = {
  ...shared,
  background:      '#f4f5f7',
  card:            '#ffffff',
  cardBorder:      '#f0f0f3',
  surface:         '#f9fafb',
  text:            '#111827',
  textSecondary:   '#6b7280',
  textTertiary:    '#9ca3af',
  border:          '#e5e7eb',
  divider:         '#f3f4f6',
  inputBg:         '#ffffff',
  inputBorder:     '#d1d5db',
  placeholder:     '#9ca3af',
  headerBg:        '#ffffff',
  tabBg:           '#ffffff',
  tabActive:       PRIMARY,
  tabInactive:     '#9ca3af',
  skeleton:        '#e5e7eb',
  skeletonShimmer: '#f5f5f5',
  shadow:          '#000000',
  overlay:         'rgba(0,0,0,0.5)',
  mapFallback:     '#e5e7eb',
}

const dark = {
  ...shared,
  background:      '#0f172a',
  card:            '#1e293b',
  cardBorder:      '#334155',
  surface:         '#1e293b',
  text:            '#f1f5f9',
  textSecondary:   '#94a3b8',
  textTertiary:    '#64748b',
  border:          '#334155',
  divider:         '#1e293b',
  inputBg:         '#1e293b',
  inputBorder:     '#475569',
  placeholder:     '#64748b',
  headerBg:        '#0f172a',
  tabBg:           '#0f172a',
  tabActive:       PRIMARY,
  tabInactive:     '#64748b',
  skeleton:        '#1e293b',
  skeletonShimmer: '#334155',
  shadow:          '#000000',
  overlay:         'rgba(0,0,0,0.7)',
  mapFallback:     '#334155',
}

export type Theme = typeof light

export function useTheme(): Theme {
  const scheme = useColorScheme()
  return scheme === 'dark' ? dark : light
}

export const themes = { light, dark }
