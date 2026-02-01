import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  base: "/v2/",
  build: {
    outDir: "dist-v2",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        v2: resolve(__dirname, "v2.html"),
      },
    },
  },
});
