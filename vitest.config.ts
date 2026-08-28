import { defaultExclude, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["**.bench.*", "**.test-d.*", "**.test.*"],
      include: ["apps/*/src/**", "packages/*/src/**"],
    },
    exclude: [...defaultExclude, "**/.claude/**"],
    globals: true,
    include: ["**/*.test.ts"],
    passWithNoTests: true,
  },
});
