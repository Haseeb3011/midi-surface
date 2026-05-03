import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:           'rgb(var(--bg) / <alpha-value>)',
        surface:      'rgb(var(--surface) / <alpha-value>)',
        surfaceHi:    'rgb(var(--surface-hi) / <alpha-value>)',
        surfaceLow:   'rgb(var(--surface-low) / <alpha-value>)',
        border:       'rgb(var(--border) / <alpha-value>)',
        borderSoft:   'rgb(var(--border-soft) / <alpha-value>)',
        borderStrong: 'rgb(var(--border-strong) / <alpha-value>)',
        muted:        'rgb(var(--muted) / <alpha-value>)',
        text:         'rgb(var(--text) / <alpha-value>)',
        textSoft:     'rgb(var(--text-soft) / <alpha-value>)',
        accent:       'rgb(var(--accent) / <alpha-value>)',
        accent2:      'rgb(var(--accent-2) / <alpha-value>)',
        warn:         'rgb(var(--warn) / <alpha-value>)',
        ok:           'rgb(var(--ok) / <alpha-value>)',
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        elev1: 'inset 0 1px 0 rgb(255 255 255 / 0.03), 0 1px 2px rgb(0 0 0 / 0.25)',
        elev2: '0 4px 16px rgb(0 0 0 / 0.35)',
        elevGlow: '0 0 20px rgb(var(--accent) / 0.35)',
        glow: '0 0 24px rgb(var(--accent) / 0.55), 0 0 64px rgb(var(--accent-2) / 0.25)',
        glowSoft: '0 0 12px rgb(var(--accent) / 0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'hue-shift': 'hue-shift 18s linear infinite',
      },
      keyframes: {
        'hue-shift': {
          '0%': { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
