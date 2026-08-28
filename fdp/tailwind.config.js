/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#06060c',
          card: 'rgba(15, 15, 28, 0.7)',
          cyan: '#00f2fe',
          purple: '#7f00ff',
          pink: '#ff007f',
          glow: '#00d2ff',
          accent: '#181824',
          text: '#e2e8f0',
        }
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #06060c 0%, #0e0e22 50%, #15092a 100%)',
        'neon-gradient': 'linear-gradient(90deg, #00f2fe 0%, #7f00ff 50%, #ff007f 100%)',
        'radial-glow': 'radial-gradient(circle at center, rgba(127, 0, 255, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 242, 254, 0.4)',
        'neon-purple': '0 0 15px rgba(127, 0, 255, 0.4)',
        'neon-pink': '0 0 15px rgba(255, 0, 127, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-cyan': 'glowCyan 2s ease-in-out infinite alternate',
        'glow-purple': 'glowPurple 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glowCyan: {
          '0%': { boxShadow: '0 0 5px rgba(0, 242, 254, 0.2), inset 0 0 2px rgba(0, 242, 254, 0.1)' },
          '100%': { boxShadow: '0 0 15px rgba(0, 242, 254, 0.6), inset 0 0 5px rgba(0, 242, 254, 0.3)' }
        },
        glowPurple: {
          '0%': { boxShadow: '0 0 5px rgba(127, 0, 255, 0.2), inset 0 0 2px rgba(127, 0, 255, 0.1)' },
          '100%': { boxShadow: '0 0 15px rgba(127, 0, 255, 0.6), inset 0 0 5px rgba(127, 0, 255, 0.3)' }
        }
      }
    },
  },
  plugins: [],
}
