import { Config } from "tailwindcss";

export default {
    content: ["./src/**/*.{html,js,tsx,ts}"],
    mode: "jit",
    theme: {
        extend: {
            colors: {
                black: "#12130F",
                white: "#E7E2E2",
                blue: "#067BC2"
            }
        }
    },
    darkMode: ["class", '[data-mode="dark"]'],
    plugins: []
} satisfies Config;
