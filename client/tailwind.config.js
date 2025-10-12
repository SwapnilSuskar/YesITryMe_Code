/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF4E00',
          secondary: '#E64500',
          neutral: '#FFFFFF',
          black: '#000000',
        },
      },
      fontFamily: {
        'canva': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
 