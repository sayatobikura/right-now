/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: 'var(--surface-0)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        border: 'var(--border)',
      },
    },
  },
  plugins: [],
};
