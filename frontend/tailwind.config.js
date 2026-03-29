/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          primary: '#121212',
          secondary: '#1E1E1E',
        },
        primary: '#A7F3D0', // Your "Success" Green
        danger: '#FECACA',  // Your "Expense" Red
      }
    },
  },
  plugins: [],
}