import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react/") || id.includes("react-dom")) return "react-core";
          if (id.includes("react-router") || id.includes("@tanstack/react-query")) return "app-vendor";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("date-fns")) return "date-utils";
          if (id.includes("clsx") || id.includes("class-variance-authority") || id.includes("tailwind-merge")) return "style-utils";
          if (id.includes("recharts")) return "charts";
          if (id.includes("@supabase/supabase-js")) return "supabase";
          if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("vaul")) return "ui-vendor";
          return "vendor";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
