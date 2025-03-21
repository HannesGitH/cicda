import { sveltekit } from "@sveltejs/kit/vite";
import { static_serve } from "./vite-plugins/static-serve";
import { defineConfig } from "vite";
import { servable_files_dir } from "./config";
export default defineConfig(({ command, mode }) => {
  return {
    plugins: [sveltekit(), static_serve()],
    server: {
      port: 3000,
      strictPort: true,
	  fs: {
		allow: [servable_files_dir]
	  }
    },
    preview: {
      port: 5173,
      strictPort: false,
    },
  };
});
