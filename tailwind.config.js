// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'pink-brand': '#E91E8C',
        'pink-bg':    '#FFF0F5',
        'pink-border':'#E8D0DC',
        'pink-divider':'#F0D8E4',
        'red-soft':   '#E57373',
      },
    },
  },
  plugins: [],
};
