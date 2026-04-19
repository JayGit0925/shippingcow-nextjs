import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E40AF',
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        accent: {
          DEFAULT: '#F97316',
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          950: '#431407',
        },
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Black Han Sans', 'sans-serif'],
        pixel:   ['"Press Start 2P"', 'monospace'],
      },
      boxShadow: {
        pixel:    '4px 4px 0 #1A202C',
        'pixel-sm': '2px 2px 0 #1A202C',
        'pixel-lg': '6px 6px 0 #1A202C',
        'pixel-accent': '4px 4px 0 #F97316',
        'pixel-primary': '4px 4px 0 #1E40AF',
      },
      borderRadius: {
        pixel: '0',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  corePlugins: {
    // Disable Tailwind's CSS reset so it doesn't conflict with
    // the existing globals.css design system.
    preflight: false,
  },
  plugins: [],
};

export default config;
