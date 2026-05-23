import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // TanStack Start ka server entry point (SSR wrapper) 
  tanstackStart: {
    server: { entry: "server" },
  },

  // ⬇️ Ye naya portion add karo
  vite: {
    server: {
      port: 3000,        // Har baar port 3000 use karega
      strictPort: true,  // (Optional) Agar 3000 busy hai to automatically next port nahi lega, balki error dega
    },
  },
});