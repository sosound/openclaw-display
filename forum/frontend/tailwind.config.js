/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a365d',
          light: '#2d4a7c',
          dark: '#0f2440',
        },
        accent: {
          DEFAULT: '#4299e1',
          light: '#63b3ed',
          dark: '#3182ce',
        },
        status: {
          thinking: '#4299e1',    // 🔵 思考中 - blue
          online: '#48bb78',      // 🟢 在线 - green
          busy: '#ecc94b',        // 🟡 忙碌 - yellow
          offline: '#718096',     // ⚫ 离线 - gray
        },
        dark: {
          bg: '#0d1b2a',
          card: '#1b263b',
          border: '#2d4a7c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #4299e1, 0 0 10px #4299e1' },
          '100%': { boxShadow: '0 0 20px #4299e1, 0 0 30px #4299e1' },
        }
      }
    },
  },
  plugins: [],
}
