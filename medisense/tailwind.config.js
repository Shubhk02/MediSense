/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f5f0ff',
          100: '#ede0ff',
          200: '#d2bbff',
          300: '#b08ffc',
          400: '#9061f9',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0764',
        },
        accent: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea6c05',
        },
        surface: {
          DEFAULT: '#f8f9fc',
          low:     '#f2f3f6',
          card:    '#ffffff',
          high:    '#e7e8eb',
        },
      },
      boxShadow: {
        'card':  '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-md': '0 4px 16px -2px rgba(0,0,0,0.08), 0 2px 6px -2px rgba(0,0,0,0.05)',
        'card-hover': '0 8px 24px -4px rgba(124,58,237,0.12), 0 4px 8px -2px rgba(0,0,0,0.06)',
        'primary': '0 4px 14px 0 rgba(124,58,237,0.35)',
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.25rem',
      },
    },
  },
  plugins: [],
}

