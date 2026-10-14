/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/context/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        gdg: {
          blue: "#4285F4",
          red: "#EA4335",
          yellow: "#FBBC05",
          green: "#34A853",
        },
        surface: {
          light: "#FFFFFF",
          lightAlt: "#F6F8FB",
          dark: "#14161A",
          darkAlt: "#1D2025",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        xl2: "1rem",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 18px rgba(251,188,5,0.35)" },
          "50%": { boxShadow: "0 0 34px rgba(251,188,5,0.7)" },
        },
      },
    },
  },
  plugins: [],
};
