/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ll: {
          bg: "var(--ll-bg)",
          surface: "var(--ll-surface)",
          text: "var(--ll-text)",
          muted: "var(--ll-muted)",
          accent: "var(--ll-accent)",
          "accent-fg": "var(--ll-accent-fg)",
          border: "var(--ll-border)",
          header: "var(--ll-header)",
          nav: "var(--ll-nav)",
          danger: "var(--ll-danger)",
          warn: "var(--ll-warn)",
          success: "var(--ll-success)",
        },
      },
    },
  },
  plugins: [],
};
