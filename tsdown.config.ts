import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/index.ts",
  outDir: "./dist",
  dts: "index.d.ts",
  format: ["esm"],
  sourcemap: true,
  clean: true,
});
