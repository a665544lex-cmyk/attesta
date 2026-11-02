// Builds the prototype into one self-contained file: dist/index.html.
// Usage:  node build.mjs          one-off production build
//         node build.mjs --serve  rebuild on change and serve on http://localhost:5173
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createServer } from "node:http";

const serve = process.argv.includes("--serve");
const nodePaths = (process.env.NODE_PATH || "").split(":").filter(Boolean);

const options = {
  entryPoints: ["src/main.tsx"],
  bundle: true,
  write: false,
  outdir: "dist",
  minify: !serve,
  sourcemap: false,
  jsx: "automatic",
  loader: { ".json": "json" },
  define: { "process.env.NODE_ENV": JSON.stringify(serve ? "development" : "production") },
  nodePaths,
  logLevel: "info",
};

function assemble(result) {
  const js = result.outputFiles.find((f) => f.path.endsWith(".js")).text;
  const css = result.outputFiles.find((f) => f.path.endsWith(".css"))?.text ?? "";
  const html = readFileSync("index.html", "utf8")
    .replace("<!--STYLES-->", () => `<style>${css}</style>`)
    .replace("<!--SCRIPT-->", () => `<script>${js.replace(/<\/script/g, "<\\/script")}</script>`);
  mkdirSync("dist", { recursive: true });
  writeFileSync("dist/index.html", html);
  return html;
}

if (!serve) {
  const result = await esbuild.build(options);
  const html = assemble(result);
  console.log(`dist/index.html written (${(html.length / 1024).toFixed(0)} KB)`);
} else {
  let html = "";
  const ctx = await esbuild.context({
    ...options,
    plugins: [{ name: "assemble", setup(b) { b.onEnd((r) => { if (!r.errors.length) html = assemble(r); }); } }],
  });
  await ctx.watch();
  createServer((_, res) => { res.writeHead(200, { "content-type": "text/html" }); res.end(html); }).listen(5173);
  console.log("Serving on http://localhost:5173");
}
