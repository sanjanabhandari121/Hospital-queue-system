/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          light: '#f0f4f8',
          brand: '#1a56db',
          dark: '#1e293b',
          accent: '#0d9488'
        }
      }
    },
  },
  plugins: [],
}