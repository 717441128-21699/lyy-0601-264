/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        midnight: {
          950: "#0a0614",
          900: "#0f0a1f",
          800: "#16102a",
          700: "#1f1738",
          600: "#2a1f4a",
        },
        neon: {
          cyan: "#00f0ff",
          purple: "#b026ff",
          pink: "#ff2e8a",
          gold: "#ffb347",
          red: "#ff2e63",
          green: "#39ff14",
        },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        body: ["'Noto Sans SC'", "sans-serif"],
      },
      boxShadow: {
        "neon-cyan": "0 0 5px #00f0ff, 0 0 20px rgba(0,240,255,0.3)",
        "neon-purple": "0 0 5px #b026ff, 0 0 20px rgba(176,38,255,0.3)",
        "neon-gold": "0 0 5px #ffb347, 0 0 20px rgba(255,179,71,0.3)",
        "neon-red": "0 0 5px #ff2e63, 0 0 20px rgba(255,46,99,0.3)",
        "neon-green": "0 0 5px #39ff14, 0 0 20px rgba(57,255,20,0.3)",
      },
      animation: {
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "spin-slow": "spin 8s linear infinite",
        "ripple": "ripple 0.8s ease-out forwards",
        "shake": "shake 0.4s ease-in-out",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glow: {
          "0%": { filter: "brightness(1)" },
          "100%": { filter: "brightness(1.3)" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "0.8" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-5px)" },
          "75%": { transform: "translateX(5px)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
