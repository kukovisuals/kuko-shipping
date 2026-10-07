// One color source (architecture rule 7). CSS reads these as variables
// (see tokensCss, injected by app/page.tsx); 3D materials import `tokens` directly.
// Light and dark only recolour the one design: layout and fonts never change.

export type Theme = 'light' | 'dark'

export const tokens: Record<Theme, Record<string, string>> = {
  light: {
    bg: '#f6f5f2',
    surface: '#ffffff',
    ink: '#1a1a1a',
    muted: '#6b6a66',
    line: '#dcdad4',
    onTime: '#1a1a1a',
    late: '#c8401f',
    land: '#e6e4de',
  },
  dark: {
    bg: '#121212',
    surface: '#1c1c1c',
    ink: '#f0eeea',
    muted: '#9a9893',
    line: '#2e2e2c',
    onTime: '#f0eeea',
    late: '#f0704f',
    land: '#222222',
  },
}

const toVars = (theme: Theme) =>
  Object.entries(tokens[theme])
    .map(([name, value]) => `--${name}:${value};`)
    .join('')

// No saved choice: follow the OS. A saved choice sets data-theme on <html>.
export function tokensCss(): string {
  return [
    `:root{${toVars('light')}}`,
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${toVars('dark')}}}`,
    `:root[data-theme="dark"]{${toVars('dark')}}`,
  ].join('\n')
}
