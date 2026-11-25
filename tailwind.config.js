/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#effcf9',
          100: '#c9f6ec',
          200: '#94ecd9',
          300: '#57dbc2',
          400: '#27c1a8',
          500: '#0ea58f',
          600: '#0a8576',
          700: '#0d6a5f',
          800: '#10554d',
          900: '#124741',
        },
        sun: {
          50: '#fff8eb',
          100: '#feeac7',
          300: '#fcc35b',
          400: '#fbab30',
          500: '#f58a0b',
          600: '#d96606',
        },
        rose: {
          400: '#f87171',
          500: '#ef4444',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,.04), 0 8px 24px -8px rgba(15,23,42,.12)',
        lift: '0 2px 4px rgba(15,23,42,.04), 0 24px 48px -16px rgba(15,23,42,.22)',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(.6)', opacity: '.9' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        aurora: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(8%,6%) scale(1.12)' },
          '66%': { transform: 'translate(-4%,10%) scale(.94)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 2.4s ease-out infinite',
        floaty: 'floaty 5s ease-in-out infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        aurora2: 'aurora 24s ease-in-out infinite reverse',
        aurora3: 'aurora 30s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
};
