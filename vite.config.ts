import { sveltekit } from "@sveltejs/kit/vite";
import { static_serve } from "./vite-plugins/static-serve";
import { defineConfig } from "vite";
export default defineConfig(({ command, mode }) => {
  return {
    plugins: [sveltekit(), static_serve()],
    server: {
      port: 3000,
      strictPort: true,
    },
    preview: {
      port: 5173,
      strictPort: false,
    },
  };
});
