import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const docsDir = join(root, "docs");

const filesToCopy = [
  "index.html",
  "style.css",
  "tasks.json",
  "api.js",
  "auth.js",
  "analysis-guards.js",
  "analysis-redraw.js",
  "chat-context.js",
  "chat-dom.js",
  "chat-lifecycle.js",
  "diagnostics.js",
  "error-profile.js",
  "explainer-mode.js",
  "figure-redraw.js",
  "figure-source.js",
  "forecast.js",
  "logger.js",
  "operatoren.js",
  "pdf-figure.js",
  "plot.js",
  "quick-actions.js",
  "repetition.js",
  "simulation.js",
  "solution-guards.js",
  "solution-style.js",
  "solution-validator.js",
  "storage.js",
  "stochastik-guards.js",
  "study-plan.js",
  "tasks-normalize.js",
  "tool-mode.js",
  "ui-helpers.js",
  "vector-guards.js",
  "vector-redraw.js",
  "martha-4.0-user-manual-hu.html",
];

mkdirSync(docsDir, { recursive: true });

for (const relativePath of filesToCopy) {
  const source = join(root, relativePath);
  if (!existsSync(source)) continue;
  cpSync(source, join(docsDir, relativePath), { force: true });
}

const pdfSource = join(root, "pdfs");
if (existsSync(pdfSource)) {
  cpSync(pdfSource, join(docsDir, "pdfs"), { recursive: true, force: true });
}

console.log(`Synced Martha runtime into ${docsDir}`);
