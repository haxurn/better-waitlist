import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/waitlist/index.ts",
  outDir: "./dist",
  dts: true,
  format: ["esm"],
  sourcemap: true,
  clean: true,
});
