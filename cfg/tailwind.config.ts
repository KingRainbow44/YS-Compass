import { Config } from "tailwindcss";

export default {
    content: ["./src/**/*.{html,js,tsx,ts}"],
    mode: "jit",
    theme: {
        extend: {
            colors: {
                black: {
                    100: "rgba(0, 0, 10, 0.4)",
                    200: "rgba(0, 0, 10, 0.6)",
                    900: "#000000"
                },
                white: {
                    0: "rgba(255, 255, 255, 0)",
                    7: "rgba(255, 255, 255, 0.07)",
                    100: "#ffffff"
                },
                aqua: "#4360A2",
                "light-blue": "rgba(100, 130, 255, 0.2)",
                "dark-blue": "#204e8a"
            }
        }
    },
    darkMode: ["class", '[data-mode="dark"]'],
    plugins: []
} satisfies Config;
