/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Kanban column colors
    'bg-blue-500/10', 'bg-blue-500/20', 'border-blue-500/30', 'text-blue-400', 'bg-blue-500',
    'bg-yellow-500/10', 'bg-yellow-500/20', 'border-yellow-500/30', 'text-yellow-400', 'bg-yellow-500',
    'bg-purple-500/10', 'bg-purple-500/20', 'border-purple-500/30', 'text-purple-400', 'bg-purple-500',
    'bg-orange-500/10', 'bg-orange-500/20', 'border-orange-500/30', 'text-orange-400', 'bg-orange-500',
    'bg-green-500/10', 'bg-green-500/20', 'border-green-500/30', 'text-green-400', 'bg-green-500',
    'bg-red-500/10', 'bg-red-500/20', 'border-red-500/30', 'text-red-400', 'bg-red-500',
    'bg-gray-500/10', 'bg-gray-500/20', 'border-gray-500/30', 'text-gray-400', 'bg-gray-500',
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