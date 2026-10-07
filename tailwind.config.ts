import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { bg: "#F2F4F3", ink: "#12201C", muted: "#5B6B66", accent: "#1F6F5C", warn: "#C2410C", line: "#D5DCD9" },
      fontFamily: { display: ["var(--font-display)"], body: ["var(--font-body)"] },
    },
  },
} satisfies Config;
