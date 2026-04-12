/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Override rose with warm coral palette
        'rose': {
          50: '#FFF5F4',
          100: '#FFE8E5',
          200: '#FFD0CB',
          300: '#FFABA3',
          400: '#E07A7A',
          500: '#D4736E',
          600: '#C0605B',
          700: '#A14D49',
          800: '#853D3A',
          900: '#6B302E',
        },
        // Dark sage accent
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
      },
      fontFamily: {
        'display': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
} 