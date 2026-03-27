/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: { color: 'var(--bg-color)' },
        surface: {
          DEFAULT: 'var(--surface)',
          container: {
            low: 'var(--surface-container-low)',
            DEFAULT: 'var(--surface-container)',
            high: 'var(--surface-container-high)',
            highest: 'var(--surface-container-highest)',
          },
          variant: 'var(--surface-variant)',
          lowest: 'var(--surface-container-lowest)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          container: 'var(--primary-container)',
          fixed: 'var(--primary-fixed)',
        },
        'on-primary': {
          DEFAULT: 'var(--on-primary)',
          container: 'var(--on-primary-container)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          container: 'var(--secondary-container)',
        },
        'on-secondary': {
          DEFAULT: 'var(--on-secondary)',
        },
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          container: 'var(--tertiary-container)',
          fixed: 'var(--tertiary-fixed)',
        },
        error: {
          DEFAULT: 'var(--error)',
          container: 'var(--error-container)',
        },
        'on-error': {
          DEFAULT: 'var(--on-error)',
          container: 'var(--on-error-container)',
        },
        'on-surface': {
          DEFAULT: 'var(--on-surface)',
          variant: 'var(--on-surface-variant)',
        },
        outline: {
          DEFAULT: 'var(--outline)',
          variant: 'var(--outline-variant)',
        },
        glass: {
          border: 'var(--glass-border)',
        }
      },
      fontFamily: {
        display: ['var(--font-display)'],
        headline: ['var(--font-headline)'],
        body: ['var(--font-body)'],
        label: ['var(--font-label)'],
      },
      boxShadow: {
        'ambient': 'var(--shadow-ambient)',
        'elevated': 'var(--shadow-elevated)',
      }
    },
  },
  plugins: [],
}
