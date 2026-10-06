import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Node by default; component tests opt in with `// @vitest-environment jsdom` at the top.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
