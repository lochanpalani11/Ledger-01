import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // "./" makes the built assets use relative paths, which Capacitor's
  // WebView needs (it doesn't serve files from a real domain root).
  base: "./",
  server: {
    port: 5173,
  },
});
