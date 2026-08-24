/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // ===== KAWAII PRIMARY COLORS =====
        kawaii: {
          // Pinks
          pink: '#FFB7C5',
          'pink-dark': '#FF9CB5',
          'pink-light': '#FFE4E8',
          'pink-bg': '#FFF5F9',
          
          // Lavenders
          lavender: '#D4A5FF',
          'lavender-dark': '#C99AFF',
          'lavender-light': '#F0E6FF',
          
          // Mints
          mint: '#B5EAD7',
          'mint-dark': '#A5DCC7',
          'mint-light': '#E8F5F0',
          
          // Blues
          blue: '#A8D8EA',
          'blue-dark': '#8CC8DD',
          'blue-light': '#E8F4FA',
          
          // Peaches
          peach: '#FFDAC1',
          'peach-dark': '#FFC8A2',
          'peach-light': '#FFF5ED',
          
          // Yellows
          yellow: '#FFF5BA',
          'yellow-dark': '#FFEAA7',
          'yellow-light': '#FFFDF0',
          
          // Secondary
          lilac: '#C9A9E6',
          powder: '#FFE4E1',
          seafoam: '#A8E6CF',
          butter: '#FFF5BA',
          mauve: '#E8D5E0',
          periwinkle: '#C5CAE9',
          
          // Accents
          gold: '#D4AF37',
          'rose-gold': '#E8B4B8',
          blush: '#F8C8D8',
          'lavender-gray': '#D5C6E0',
          'mint-gray': '#C8E6D9',
          
          // Backgrounds
          'bg-light': '#FFF9FB',
          'bg-dark': '#2D1B2E',
          'bg-card': '#FFF5F9',
        }
      },
      fontFamily: {
        cute: ['Nunito', 'Quicksand', 'sans-serif'],
        quicksand: ['Quicksand', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        'kawaii': '20px',
        'kawaii-sm': '12px',
        'kawaii-lg': '32px',
        'kawaii-xl': '40px',
      },
      boxShadow: {
        'kawaii': '0 8px 30px rgba(212, 175, 55, 0.15)',
        'kawaii-lg': '0 12px 50px rgba(212, 175, 55, 0.25)',
        'kawaii-pink': '0 8px 30px rgba(255, 183, 197, 0.25)',
        'kawaii-lavender': '0 8px 30px rgba(212, 165, 255, 0.25)',
        'kawaii-mint': '0 8px 30px rgba(181, 234, 215, 0.25)',
      },
      animation: {
        'kawaii-bounce': 'kawaiiBounce 0.8s ease',
        'kawaii-wiggle': 'kawaiiWiggle 0.5s ease',
        'kawaii-pop': 'kawaiiPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'kawaii-pulse': 'kawaiiPulse 2s ease-in-out infinite',
        'kawaii-float': 'kawaiiFloat 3s ease-in-out infinite',
        'sparkle-float': 'sparkleFloat 2s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease',
        'fade-in-down': 'fadeInDown 0.4s ease',
        'slide-in-left': 'slideInLeft 0.5s ease',
        'slide-in-right': 'slideInRight 0.5s ease',
      },
      keyframes: {
        kawaiiBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-10px)' },
          '50%': { transform: 'translateY(-4px)' },
          '70%': { transform: 'translateY(-8px)' },
          '90%': { transform: 'translateY(-2px)' },
        },
        kawaiiWiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        },
        kawaiiPop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        kawaiiPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        kawaiiFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        sparkleFloat: {
          '0%': { opacity: '0', transform: 'translateY(0) scale(0) rotate(0deg)' },
          '30%': { opacity: '1', transform: 'translateY(-20px) scale(1) rotate(20deg)' },
          '70%': { opacity: '1', transform: 'translateY(-60px) scale(1.2) rotate(-10deg)' },
          '100%': { opacity: '0', transform: 'translateY(-100px) scale(0.5) rotate(30deg)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      backgroundImage: {
        'kawaii-sunset': 'linear-gradient(135deg, #FFB7C5, #D4A5FF)',
        'kawaii-minty': 'linear-gradient(135deg, #B5EAD7, #A8D8EA)',
        'kawaii-peachy': 'linear-gradient(135deg, #FFDAC1, #FFB7C5)',
        'kawaii-rainbow': 'linear-gradient(135deg, #FFB7C5, #D4A5FF, #B5EAD7, #FFDAC1)',
        'kawaii-gold': 'linear-gradient(135deg, #D4AF37, #C49F2E)',
        'kawaii-lavender-glow': 'linear-gradient(135deg, #D4A5FF, #C9A9E6)',
        'kawaii-pink-glow': 'linear-gradient(135deg, #FFB7C5, #FF9CB5)',
      },
      borderWidth: {
        '3': '3px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
  plugins: [],
}