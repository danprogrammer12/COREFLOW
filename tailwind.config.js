// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        core: {
          navy: '#171936',
          'navy-deep': '#101228',
          'navy-light': '#22254A',
          violet: '#6545E8',
          'violet-hover': '#5435D4',
          'violet-soft': '#EFEBFD',
          blue: '#3568E8',
          'blue-hover': '#2656D1',
          'blue-soft': '#E6F0FF',
          cyan: '#08C9E8',
          'cyan-soft': '#E5F9FC',
          lime: '#A6E91C',
          'lime-dark': '#6B9B08',
          'lime-soft': '#F3FCE2',
          cloud: '#F4F5FA',
          border: '#E2E6F2',
          muted: '#64748B',
          body: '#566275',
          'lime-ink': '#5A8700',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        'card-lg': '16px',
      },
      boxShadow: {
        card: '0 2px 10px -2px rgba(23, 25, 54, 0.05), 0 0 0 1px rgba(226, 230, 242, 0.8)',
        'card-hover': '0 10px 24px -6px rgba(23, 25, 54, 0.09), 0 0 0 1px rgba(101, 69, 232, 0.25)',
        float: '0 16px 36px -8px rgba(23, 25, 54, 0.16)',
      }
    },
  },
  plugins: [],
}
