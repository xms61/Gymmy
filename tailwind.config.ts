import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gym: {
          bg: '#090D16',
          card: '#111827',
          cardBorder: '#1F2937',
          cardHover: '#1A2234',
          accent: '#6366F1',
          accentHover: '#4F46E5',
          push: '#F97316',
          pushBg: 'rgba(249, 115, 22, 0.12)',
          pull: '#10B981',
          pullBg: 'rgba(16, 185, 129, 0.12)',
          legs: '#3B82F6',
          legsBg: 'rgba(59, 130, 246, 0.12)',
          gold: '#F59E0B'
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
