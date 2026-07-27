import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

/** @type {import("esbuild").BuildOptions} */
const options = {
  entryPoints: ["src/scheduler-plus-card.ts"],
  bundle: true,
  format: "esm",
  target: "es2022",
  outfile: "../custom_components/scheduler_plus/www/scheduler-plus-card.js",
  minify: !watch,
  sourcemap: watch,
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(options);
  console.log("Build complete: custom_components/scheduler_plus/www/scheduler-plus-card.js");
}
