/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nexus-base': '#001f3f',
        'nexus-surface': '#0a192f',
        'nexus-accent': '#FF851B',
        'nexus-text': '#e5e7eb',
      },
    },
  },
  plugins: [],
}