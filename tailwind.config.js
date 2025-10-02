/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./*.{html,js,jsx}", "./src/**/*.{js,jsx}"],
  safelist: [
    'dark:bg-gray-800',
    'dark:bg-gray-700', 
    'dark:bg-gray-900',
    'dark:text-white',
    'dark:text-gray-300',
    'dark:text-orange-400',
    'dark:border-gray-600',
    'dark:border-orange-400',
    'dark:border-orange-600',
    'dark:hover:bg-gray-600',
    'dark:hover:bg-gray-700'
  ],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px',  // 2K
        '4xl': '2560px',  // 4K
        '5xl': '3440px',  // Ultrawide
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        yufin: ['Cherry Bomb One', 'cursive'],
      },
      colors: {
        primary: '#EE9116',
        'primary-dark': '#CC7A00',
        secondary: '#FFB300',
        interface: '#FFD49E',
        teal: '#4FD1C5',
        'teal-dark': '#3DA095',
        blue: '#63B3ED',
        lavender: '#B794F4',
      },
      maxWidth: {
        '7xl': '80rem',   // 1280px
        '8xl': '88rem',   // 1408px
        '9xl': '96rem',   // 1536px
      },
    },
  },
  plugins: [],
};