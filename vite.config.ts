import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";

export default defineConfig(({ command, mode }) => {
  // VITE_* değişkenlerini hem istemci hem SSR tarafında sabitle.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

  return {
    define: envDefine,
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    server: { port: 8080 },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
        // Sunucu girişi src/server.ts (SSR hata sarmalayıcısı).
        server: { entry: "server" },
      }),
      // Üretim derlemesinde Cloudflare Workers hedefi; başka bir hosta geçerken
      // preset'i (örn. "node-server") burada değiştirin.
      ...(command === "build" ? [nitro({ preset: "cloudflare-module" })] : []),
      viteReact(),
    ],
  };
});
