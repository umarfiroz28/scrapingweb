/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: "#0877ff",
        mint: "#18d98b",
        ink: "#102033",
        sun: "#ffe066",
      },
      boxShadow: {
        glow: "0 24px 80px rgba(8, 119, 255, 0.18)",
        mint: "0 18px 50px rgba(24, 217, 139, 0.25)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        rise: "rise .7s ease-out both",
      },
    },
  },
  plugins: [],
};
