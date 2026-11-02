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
  define: {
    "process.env.NODE_ENV": JSON.stringify(serve ? "development" : "production"),
    __PREVIEW__: JSON.stringify(process.argv.includes("--preview")),
  },
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

if (process.argv.includes("--preview")) {
  // Body-only page for hosted previews that supply their own document skeleton.
  const result = await esbuild.build(options);
  const js = result.outputFiles.find((f) => f.path.endsWith(".js")).text;
  const css = result.outputFiles.find((f) => f.path.endsWith(".css"))?.text ?? "";
  const page = `<title>Attesta Prototype</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap">
<style>${css}</style>
<div id="root"></div>
<script>${js.replace(/<\/script/g, "<\\/script")}</script>`;
  mkdirSync("dist", { recursive: true });
  writeFileSync("dist/preview.html", page);
  console.log(`dist/preview.html written (${(page.length / 1024).toFixed(0)} KB)`);
} else if (!serve) {
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
