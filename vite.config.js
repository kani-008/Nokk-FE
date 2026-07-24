import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: [
        "defaults",
        "not IE 11",
        "Chrome >= 64",
        "Firefox >= 67",
        "Safari >= 12",
        "Edge >= 79",
        "iOS >= 12",
        "Android >= 7"
      ]
    }),
  ],

  build: {
    target: "es2015",
    cssTarget: "chrome61",
    cssCodeSplit: false,
  },

  server: {
    host: true,
  },
});