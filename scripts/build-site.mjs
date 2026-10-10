// Prepares the website in site/ for deploy: copies the published label files into site/v1
// and writes one page per label (site/1x1/index.html … site/3x3/index.html) from templates/label.html.
// Usage: npm run build:site

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");
const spec = JSON.parse(readFileSync(join(root, "spec.json"), "utf8"));

rmSync(join(site, spec.version), { recursive: true, force: true });
cpSync(join(root, "assets", spec.version), join(site, spec.version), { recursive: true });

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const template = readFileSync(join(root, "templates/label.html"), "utf8");

for (const entry of spec.codes) {
  const [ideas, words] = entry.code.split("x").map(Number);
  const fields = {
    code: entry.code,
    name: entry.name,
    summary: entry.summary,
    description: entry.description,
    ideas: spec.axes.ideas[ideas - 1],
    words: spec.axes.words[words - 1],
  };
  const page = template
    .replace(/<!-- Template for the label pages.*?-->\n/, "")
    .replace(/{{(\w+)}}/g, (_, key) => escape(fields[key]));
  const dir = join(site, entry.code);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), page);
}

console.log(`Copied ${spec.version} label files and wrote ${spec.codes.length} label pages to site/`);
