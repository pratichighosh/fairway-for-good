/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#050908',
        forest: '#0a1410',
        surface: '#0f1e17',
        card: '#132218',
        gold: { DEFAULT: '#c9a84c', light: '#e8c96a', dark: '#9b7c30' },
        emerald: { brand: '#2d7a4f', light: '#3da066', glow: '#4ade80' },
        cream: '#f0ede8',
        muted: '#7a9088',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
