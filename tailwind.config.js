/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          950: 'var(--color-space-950, #030712)',
          900: 'var(--color-space-900, #060d1f)',
          850: 'var(--color-space-850, #0a142e)',
          800: 'var(--color-space-800, #0f1d3d)',
          750: 'var(--color-space-750, #15264f)',
          700: 'var(--color-space-700, #1c3264)',
          600: 'var(--color-space-600, #264382)',
          border: 'var(--color-space-border, rgba(56, 189, 248, 0.16))',
          panel: 'var(--color-panel, rgba(10, 20, 46, 0.75))',
        },
        orbit: {
          cyan: 'rgb(var(--color-accent-rgb, 56 189 248) / <alpha-value>)',
          blue: 'rgb(var(--color-secondary-rgb, 59 130 246) / <alpha-value>)',
          indigo: '#6366f1',
          teal: '#14b8a6',
          amber: '#f59e0b',
          crimson: '#ef4444',
          emerald: '#10b981',
        },
        // Standalone aliases for shorthand use (text-crimson, bg-crimson)
        crimson: '#ef4444',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Menlo', 'Consolas', 'monospace'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(var(--color-accent-rgb, 56 189 248), 0.5)',
        'glow-blue': '0 0 20px -5px rgba(var(--color-secondary-rgb, 59 130 246), 0.5)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.4)',
        'glow-crimson': '0 0 20px -5px rgba(239, 68, 68, 0.4)',
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.4)',
        'hud-glow': '0 0 25px -4px rgba(var(--color-accent-rgb, 56 189 248), 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orbit-rotate': 'spin 30s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
