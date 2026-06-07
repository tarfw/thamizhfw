/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    '../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        journalism: {
          bg: '#0A0E17',
          bgElevated: '#111827',
          bgHover: '#1F2937',
          border: '#1F2937',
          borderBright: '#374151',
          fg: '#E5E7EB',
          fgMuted: '#9CA3AF',
          fgDim: '#6B7280',
          accent: '#00D4AA',
          accentDim: 'rgba(0, 212, 170, 0.12)',
        },
      },
    },
  },
  plugins: [],
};