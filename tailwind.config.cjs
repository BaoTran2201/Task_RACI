/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae6fd',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          500: '#6b7280',
          800: '#1f2937',
        },
        slate: {
          500: '#64748b',
          800: '#1e293b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        sidebar: '280px',
      },
      zIndex: {
        sidebar: '1000',
        overlay: '999',
      },
    },
  },
  plugins: [],
};
