/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        surfaceHighlight: 'var(--color-surface-highlight)',
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
        textMain: 'var(--color-text-main)',
        textMuted: 'var(--color-text-muted)',
        border: 'var(--color-border)',
        success: 'var(--color-status-up)',
        error: 'var(--color-status-down)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        terminal: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
        display: ['Outfit', 'SF Pro Display', 'sans-serif'],
      },
      boxShadow: {
        'apple': '0 8px 32px -8px rgba(0, 0, 0, 0.08), 0 0 1px rgba(0,0,0,0.05)',
        'apple-hover': '0 24px 48px -12px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0,0,0,0.05)',
        'glass': 'inset 0 0 0 1px rgba(255, 255, 255, 0.4)',
      },
      animation: {
        marquee: 'marquee 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  plugins: [],
}
