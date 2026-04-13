/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm coral primary — rich wedding palette
        'rose': {
          50: '#FFF5F3',
          100: '#FFE8E4',
          200: '#FFD0C9',
          300: '#FFAB9F',
          400: '#E8817A',
          500: '#D4736E',
          600: '#C0605B',
          700: '#A14D49',
          800: '#853D3A',
          900: '#6B302E',
          950: '#3D1A18',
        },
        // Sage green accent — for success/secondary
        'sage': {
          50: '#F4F7F4',
          100: '#E4EBE4',
          200: '#C8D6C8',
          300: '#9FB69F',
          400: '#7A9A7A',
          500: '#5C7C5C',
          600: '#4A6B4A',
          700: '#3D5A3D',
          800: '#324A32',
          900: '#283C28',
        },
        // Warm neutrals for a refined look
        'warm': {
          50: '#FAFAF8',
          100: '#F5F4F0',
          200: '#EBEAE4',
          300: '#DAD8CE',
          400: '#B8B5A8',
          500: '#96937E',
          600: '#7A7766',
          700: '#636050',
          800: '#4A4840',
          900: '#343230',
        },
      },
      fontFamily: {
        'display': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'body': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em', fontWeight: '600' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px -1px rgba(0,0,0,0.03)',
        'card': '0 2px 8px -2px rgba(0,0,0,0.06), 0 4px 16px -4px rgba(0,0,0,0.04)',
        'elevated': '0 4px 16px -4px rgba(0,0,0,0.08), 0 8px 32px -8px rgba(0,0,0,0.06)',
        'glow-rose': '0 0 20px -5px rgba(212,115,110,0.25)',
        'glow-sage': '0 0 20px -5px rgba(92,124,92,0.2)',
        'inner-soft': 'inset 0 1px 2px 0 rgba(0,0,0,0.04)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(110deg, transparent 33%, rgba(255,255,255,0.4) 50%, transparent 67%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { backgroundPosition: '-200% 0' },
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
    },
  },
  plugins: [],
}
