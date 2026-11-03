import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // Cloudflare quick tunnels get a random *.trycloudflare.com host.
    allowedHosts: [".trycloudflare.com"],
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    allowedHosts: [".trycloudflare.com"],
  },
});
