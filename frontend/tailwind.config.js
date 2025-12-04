/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-orange': {
          DEFAULT: '#e89d0b',
          50: '#fef7e6',
          100: '#fdecc2',
          200: '#fbd885',
          300: '#f9c448',
          400: '#f7b020',
          500: '#e89d0b',
          600: '#d18a06',
          700: '#a86a05',
          800: '#854f08',
          900: '#6d4009',
        },
      },
      boxShadow: {
        '3xl': '0 20px 60px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}


