// Generates the AIA icons, badges, chart and zip from spec.json.
// Output goes to assets/<version>/ and is committed. Published files are served from
// https://timothyfcook.com/aia/<version>/, so a released version's files must never change.
// Usage: npm run build

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import { Resvg } from "@resvg/resvg-js";
import { zipSync } from "fflate";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const spec = JSON.parse(readFileSync(join(root, "spec.json"), "utf8"));
const outDir = join(root, "assets", spec.version);

const loadFont = (weight) => {
  const buf = readFileSync(join(root, `node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const fonts = { 400: loadFont(400), 500: loadFont(500), 600: loadFont(600), 700: loadFont(700) };

// ─── Palette ──────────────────────────────────────────────────────────────────
const INK = "#2C2C2A";
const INK_MUTED = "#5F5E5A";
const styles = {
  color: { bg: "#F6F4EE", border: "#D3D1C7" },
  mono: { bg: "#FFFFFF", border: "#888780", tint: "#D9D7CF", solid: INK },
};

// ─── Drawing ──────────────────────────────────────────────────────────────────
// 3×3 grid: row = ideas, column = words, 1x1 at top-left. Every cell is tinted; the code's own cell is solid.
// Tints are solid colors from the spec (not translucent), so badges look the same on any page background.
function grid(entry, mono, x, y, cell, gap) {
  const [ideas, words] = entry.code.split("x").map(Number);
  const radius = +(cell * 0.18).toFixed(2);
  let out = "";
  for (let r = 1; r <= 3; r++) {
    for (let c = 1; c <= 3; c++) {
      const own = r === ideas && c === words;
      const fill = mono ? (own ? styles.mono.solid : styles.mono.tint) : own ? entry.dark : entry.tint;
      out += `<rect x="${x + (c - 1) * (cell + gap)}" y="${y + (r - 1) * (cell + gap)}" width="${cell}" height="${cell}" rx="${radius}" fill="${fill}"/>`;
    }
  }
  return out;
}

// Text drawn as outlines, so badges render identically without the font installed.
// Glyphs are laid out by hand: opentype.js can't apply some of Inter's substitution lookups, and badge text needs none of them.
// `tracking` is extra letter spacing in ems.
function layout(font, str, size, tracking = 0) {
  const scale = size / font.unitsPerEm;
  const glyphs = [...str].map((ch) => font.charToGlyph(ch));
  let width = 0;
  const placed = glyphs.map((g, i) => {
    const at = width;
    width += g.advanceWidth * scale;
    if (glyphs[i + 1]) width += font.getKerningValue(g, glyphs[i + 1]) * scale + tracking * size;
    return { g, at };
  });
  return { placed, width };
}

function text(str, { x, y, size, weight, fill, maxWidth, anchor = "start", tracking = 0 }) {
  const font = fonts[weight];
  let s = size;
  while (maxWidth && layout(font, str, s, tracking).width > maxWidth && s > 6) s -= 0.25;
  const { placed, width } = layout(font, str, s, tracking);
  const left = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  const d = placed.map(({ g, at }) => g.getPath(left + at, y, s).toPathData(2)).join("");
  return `<path fill="${fill}" d="${d}"/>`;
}

// "Original ideas, some AI writing." → "original ideas, some AI writing"
const label = (entry) => `AIA ${entry.code} · ${entry.name}: ${entry.summary[0].toLowerCase()}${entry.summary.slice(1, -1)}`;

function svg(w, h, body, entry) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label(entry)}"><title>${label(entry)}</title>${body}</svg>\n`;
}

function frame(w, h, rx, mono) {
  const s = mono ? styles.mono : styles.color;
  return `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${rx}" fill="${s.bg}" stroke="${s.border}"/>`;
}

const icon = (entry, mono) => svg(21, 21, grid(entry, mono, 0, 0, 6, 1.5), entry);

function badge88(entry, mono) {
  return svg(88, 31,
    frame(88, 31, 3, mono) +
    grid(entry, mono, 5, 5, 6, 1.5) +
    text(`AIA ${entry.code}`, { x: 31, y: 13, size: 7.5, weight: 500, fill: INK_MUTED }) +
    text(entry.name, { x: 31, y: 24, size: 10, weight: 600, fill: INK, maxWidth: 53 }),
    entry);
}

// Too small for the name to be legible, so the compact badge shows the code only
function badge80(entry, mono) {
  return svg(80, 15,
    frame(80, 15, 2, mono) +
    grid(entry, mono, 3, 2, 3, 1) +
    text("AIA", { x: 45, y: 10.5, size: 8, weight: 500, fill: INK_MUTED, anchor: "end" }) +
    text(entry.code, { x: 48, y: 10.5, size: 8, weight: 600, fill: INK }),
    entry);
}

// Full-width badge: the text line ("AIA 1x2 · Polished. Original ideas, some AI writing.") inside a badge.
// Width depends on the label's text, so it's returned alongside the SVG.
function badgeWide(entry, mono) {
  const lead = `AIA ${entry.code} · ${entry.name}.`;
  const size = 10, x = 31, gap = 4, padRight = 9;
  const leadW = layout(fonts[600], lead, size).width;
  const summaryW = layout(fonts[400], entry.summary, size).width;
  const w = Math.ceil(x + leadW + gap + summaryW + padRight);
  const out = svg(w, 31,
    frame(w, 31, 3, mono) +
    grid(entry, mono, 5, 5, 6, 1.5) +
    text(lead, { x, y: 19.5, size, weight: 600, fill: INK }) +
    text(entry.summary, { x: x + leadW + gap, y: 19.5, size, weight: 400, fill: INK_MUTED }),
    entry);
  return { svg: out, w };
}

// ─── Chart ────────────────────────────────────────────────────────────────────
// The full ideas × words chart used in the essay, with each label's name in its chart color
const isDark = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 140;
};

// The latin font subset has ↓ but not →, so a right arrow is the ↓ glyph turned
function arrowRight(x, y, size, fill) {
  const g = fonts[700].charToGlyph("↓");
  const w = (g.advanceWidth * size) / fonts[700].unitsPerEm;
  const cx = x + w / 2, cy = y - size * 0.36;
  return `<path fill="${fill}" transform="rotate(-90 ${cx} ${cy})" d="${g.getPath(x, y, size).toPathData(2)}"/>`;
}

function chart() {
  const W = 1600, H = 976;
  const tileW = 338, tileH = 192, gap = 16, left = 472, top = 296;
  const colX = (c) => left + (c - 1) * (tileW + gap);
  const rowY = (r) => top + (r - 1) * (tileH + gap);
  const AXIS = "#6B6A65", LABEL = "#3D3D3A";

  let body = `<rect width="${W}" height="${H}" fill="#FAF9F5"/>`;
  body += text(spec.name, { x: 80, y: 118, size: 52, weight: 700, fill: "#1F1E1D", tracking: -0.01 });

  // Words axis, across the top
  const gridMid = left + (3 * tileW + 2 * gap) / 2;
  body += text("WORDS", { x: gridMid - 14, y: 198, size: 22, weight: 700, fill: AXIS, anchor: "middle", tracking: 0.18 });
  body += arrowRight(gridMid + 44, 198, 22, AXIS);
  spec.axes.words.forEach((w, i) => {
    body += text(`${i + 1} · ${w}`, { x: colX(i + 1) + tileW / 2, y: 272, size: 26, weight: 500, fill: LABEL, anchor: "middle" });
  });

  // Ideas axis, down the left side, reading top to bottom
  const gridMidY = top + (3 * tileH + 2 * gap) / 2;
  body += `<g transform="rotate(90 110 ${gridMidY})">` +
    text("IDEAS", { x: 96, y: gridMidY + 8, size: 22, weight: 700, fill: AXIS, anchor: "middle", tracking: 0.18 }) +
    arrowRight(148, gridMidY + 8, 22, AXIS) + `</g>`;
  spec.axes.ideas.forEach((idea, i) => {
    body += text(`${i + 1} · ${idea}`, { x: 440, y: rowY(i + 1) + tileH / 2 + 9, size: 26, weight: 500, fill: LABEL, anchor: "end" });
  });

  for (const entry of spec.codes) {
    const [r, c] = entry.code.split("x").map(Number);
    const x = colX(c), y = rowY(r), dark = isDark(entry.color);
    body += `<rect x="${x}" y="${y}" width="${tileW}" height="${tileH}" rx="16" fill="${entry.color}"/>`;
    body += text(`AIA ${entry.code}`, { x: x + 32, y: y + 74, size: 22, weight: 500, fill: dark ? "#FFFFFFBF" : "#2C2C2A99", tracking: 0.06 });
    body += text(entry.name, { x: x + 32, y: y + 128, size: 40, weight: 700, fill: dark ? "#FFFFFF" : "#1F1E1D", maxWidth: tileW - 64 });
  }

  const title = `${spec.name} chart: ideas × words`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;
}

const png = (svgStr, width) => new Resvg(svgStr, { fitTo: { mode: "width", value: width } }).render().asPng();

// ─── Build ────────────────────────────────────────────────────────────────────
rmSync(outDir, { recursive: true, force: true });
const zipFiles = {};
const write = (rel, data) => {
  const file = join(outDir, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
  zipFiles[`aia-badges-${spec.version}/${rel}`] = typeof data === "string" ? new TextEncoder().encode(data) : data;
};

const sizes = {};
for (const entry of spec.codes) {
  for (const mono of [false, true]) {
    const suffix = mono ? "-mono" : "";
    const ic = icon(entry, mono);
    write(`${entry.code}/icon${suffix}.svg`, ic);
    write(`${entry.code}/icon${suffix}.png`, png(ic, 64));
    const wide = badgeWide(entry, mono);
    sizes[entry.code] = { wide: [wide.w, 31] };
    const badges = [["88x31", badge88(entry, mono), 88], ["80x15", badge80(entry, mono), 80], ["wide", wide.svg, wide.w]];
    for (const [name, s, w] of badges) {
      write(`${entry.code}/${name}${suffix}.svg`, s);
      write(`${entry.code}/${name}${suffix}.png`, png(s, w));
      write(`${entry.code}/${name}${suffix}@2x.png`, png(s, w * 2));
    }
  }
}
write("spec.json", JSON.stringify(spec, null, 2) + "\n");
const chartSvg = chart();
write("chart.svg", chartSvg);
write("chart.png", png(chartSvg, 1600));
// Fixed timestamp so the zip only changes when its contents do
writeFileSync(join(outDir, `aia-badges-${spec.version}.zip`), zipSync(zipFiles, { mtime: "2026-10-04T00:00:00Z" }));

// Badge sizes that depend on text (full-width badges), so sites can give snippets an exact width/height
writeFileSync(join(outDir, "sizes.json"), JSON.stringify(sizes, null, 2) + "\n");

console.log(`Wrote ${Object.keys(zipFiles).length} files and a zip to ${outDir}`);
