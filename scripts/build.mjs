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
const styles = {
  mono: { tint: "#D9D7CF", solid: INK },
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

const icon = (entry, mono) => svg(21, 21, grid(entry, mono, 0, 0, 6, 1.5), entry);

// ─── Badges ───────────────────────────────────────────────────────────────────
// A dark tab with "AIA" and a white grid, then the label's color with the code and name
// (and, on the full-width badge, the summary). Text colors are picked to pass WCAG AA (4.5:1).
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255]
    .map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
};
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const AA = 4.5;
// Body text aims higher than AA, since mid-tone colors at AA still read as muddy
const BODY_CONTRAST = 5.5;
const WHITE = "#FFFFFF";
const BODY_DARK = "#1F1E1D";

// Darken a color until white text on it reaches the target contrast
function darkenFor(hex, target) {
  let n = parseInt(hex.slice(1), 16), [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255];
  const toHex = () => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  while (contrast(toHex(), WHITE) < target) [r, g, b] = [r * 0.97, g * 0.97, b * 0.97];
  return toHex();
}

function badgeColors(entry, mono) {
  let body = mono ? "#E7E5DF" : entry.color;
  let ink = contrast(body, BODY_DARK) >= contrast(body, WHITE) ? BODY_DARK : WHITE;
  // Neither dark nor white reads well on mid-tone colors: deepen the color and use white
  if (contrast(body, ink) < BODY_CONTRAST) { body = darkenFor(body, BODY_CONTRAST); ink = WHITE; }
  // The tab stays clearly darker than the body, and white "AIA" on it passes AA
  const tab = mono ? "#3D3D3A" : darkenFor(entry.dark, Math.max(AA, contrast(body, WHITE) * 1.6));
  return { body, tab, ink };
}

// White grid on the dark tab: the label's own square solid, the others faint
function tabGrid(entry, x, y, cell, gap) {
  const [ideas, words] = entry.code.split("x").map(Number);
  let out = "";
  for (let r = 1; r <= 3; r++) {
    for (let c = 1; c <= 3; c++) {
      const own = r === ideas && c === words;
      out += `<rect x="${+(x + (c - 1) * (cell + gap)).toFixed(2)}" y="${+(y + (r - 1) * (cell + gap)).toFixed(2)}" width="${cell}" height="${cell}" rx="${+(cell * 0.2).toFixed(2)}" fill="${WHITE}"${own ? "" : ' fill-opacity="0.2"'}/>`;
    }
  }
  return out;
}

const SIZES = {
  compact: { h: 19, r: 3, fs: 10, cell: 4, gap: 1, pad: 6 },
  medium: { h: 31, r: 4, fs: 13, cell: 6, gap: 1.5, pad: 8 },
};

// Lays out tab + body; the dot between parts sits the same distance from both neighbors
function splitBadge(entry, mono, size, withSummary) {
  const { h, r, fs, cell, gap, pad } = SIZES[size];
  const { body, tab, ink } = badgeColors(entry, mono);
  const base = +(h / 2 + fs * 0.364).toFixed(2);
  const gridW = cell * 3 + gap * 2;
  const aiaW = layout(fonts[600], "AIA", fs).width;
  const gridX = pad + aiaW + pad * 0.7;
  const tabW = Math.ceil(gridX + gridW + pad * 0.8);
  const dotGap = fs * 0.35, dot = fs * 0.16;

  let x = tabW + pad + 1, parts = "";
  const bold = (str) => { parts += text(str, { x, y: base, size: fs, weight: 700, fill: ink }); x += layout(fonts[700], str, fs).width; };
  const regular = (str) => { parts += text(str, { x, y: base, size: fs, weight: 400, fill: ink }); x += layout(fonts[400], str, fs).width; };
  const sep = () => { parts += `<circle cx="${+(x + dotGap + dot / 2).toFixed(2)}" cy="${h / 2}" r="${+(dot / 2).toFixed(2)}" fill="${ink}"/>`; x += dotGap * 2 + dot; };

  bold(entry.code); sep(); bold(entry.name);
  if (withSummary) { sep(); regular(entry.summary); }
  const w = Math.ceil(x + pad + 1);

  const out = svg(w, h,
    `<rect width="${w}" height="${h}" rx="${r}" fill="${body}"/>` +
    `<path d="M${r} 0H${tabW}V${h}H${r}A${r} ${r} 0 0 1 0 ${h - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z" fill="${tab}"/>` +
    text("AIA", { x: pad, y: base, size: fs, weight: 600, fill: WHITE }) +
    tabGrid(entry, gridX, (h - gridW) / 2, cell, gap) +
    parts,
    entry);
  return { svg: out, w, h };
}

// ─── Charts ───────────────────────────────────────────────────────────────────
// The ideas × words chart, in two styles on the cream background of the project's icons:
// "grid" (nine tinted squares with names, used in the essay) and "icons" (each label's icon and name).
const CHART = { w: 1600, h: 1110, bg: "#F6F4EE", ink: "#1F1E1D", muted: "#6B6A65" };

function chartFrame() {
  return `<rect width="${CHART.w}" height="${CHART.h}" fill="${CHART.bg}"/>` +
    text(spec.name, { x: 90, y: 125, size: 56, weight: 700, fill: CHART.ink });
}

const chartSvg = (body, style) => {
  const title = `${spec.name} chart (${style}): ideas × words`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CHART.w}" height="${CHART.h}" viewBox="0 0 ${CHART.w} ${CHART.h}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;
};
const axisLabel = (str, x, y, anchor) => text(str, { x, y, size: 24, weight: 600, fill: CHART.muted, anchor });

function gridChart() {
  const left = 440, top = 240, cell = 244, gap = 22;
  let body = chartFrame();
  spec.axes.words.forEach((w, i) => { body += axisLabel(`${i + 1} · ${w}`, left + i * (cell + gap) + cell / 2, top - 30, "middle"); });
  spec.axes.ideas.forEach((idea, i) => { body += axisLabel(`${i + 1} · ${idea}`, left - 30, top + i * (cell + gap) + cell / 2 + 8, "end"); });
  for (const entry of spec.codes) {
    const [r, c] = entry.code.split("x").map(Number);
    const x = left + (c - 1) * (cell + gap), y = top + (r - 1) * (cell + gap);
    body += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="30" fill="${entry.tint}"/>`;
    body += text(entry.name, { x: x + 28, y: y + cell - 34, size: 38, weight: 700, fill: CHART.ink, maxWidth: cell - 56 });
  }
  return chartSvg(body, "grid");
}

function iconsChart() {
  const left = 470, top = 250, colW = 360, rowH = 270;
  let body = chartFrame();
  spec.axes.words.forEach((w, i) => { body += axisLabel(`${i + 1} · ${w}`, left + i * colW + 40, top - 30, "start"); });
  spec.axes.ideas.forEach((idea, i) => { body += axisLabel(`${i + 1} · ${idea}`, left - 40, top + i * rowH + 80, "end"); });
  for (const entry of spec.codes) {
    const [r, c] = entry.code.split("x").map(Number);
    const x = left + (c - 1) * colW + 40, y = top + (r - 1) * rowH;
    body += grid(entry, false, x, y, 40, 9);
    body += text(entry.name, { x: x + 162, y: y + 82, size: 38, weight: 700, fill: CHART.ink });
  }
  return chartSvg(body, "icons");
}

// ─── Link preview images ──────────────────────────────────────────────────────
// 1200×630 cards shown when a page is shared on X, Slack, LinkedIn, iMessage, etc.
// Not part of the zip; they're for the website's pages, not for labeling writing.
const SHARE = { w: 1200, h: 630, pad: 80 };

// Breaks text into lines that fit maxWidth at the given size
function wrap(str, weight, size, maxWidth) {
  const lines = [];
  let line = "";
  for (const word of str.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && layout(fonts[weight], next, size).width > maxWidth) { lines.push(line); line = word; } else line = next;
  }
  return line ? [...lines, line] : lines;
}

const shareSvg = (body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SHARE.w}" height="${SHARE.h}" viewBox="0 0 ${SHARE.w} ${SHARE.h}" role="img" aria-label="${title}"><title>${title}</title><rect width="${SHARE.w}" height="${SHARE.h}" fill="${CHART.bg}"/>${body}</svg>\n`;

const footer = (str = `${spec.name} · aialabels.com`) =>
  text(str, { x: SHARE.pad, y: SHARE.h - 64, size: 26, weight: 500, fill: CHART.muted });

// One label: its icon large, code and name, then the description
function labelShare(entry) {
  const { pad } = SHARE;
  let body = grid(entry, false, pad, 120, 56, 9);
  body += text(`AIA ${entry.code}`, { x: 330, y: 172, size: 36, weight: 500, fill: CHART.muted });
  body += text(entry.name, { x: 328, y: 250, size: 76, weight: 700, fill: CHART.ink });
  wrap(entry.description, 400, 36, SHARE.w - pad * 2).slice(0, 3).forEach((line, i) => {
    body += text(line, { x: pad, y: 380 + i * 50, size: 36, weight: 400, fill: CHART.ink });
  });
  return shareSvg(body + footer(), `AIA ${entry.code} · ${entry.name}`);
}

// The site: title and one-line description beside all nine icons, as in the project thumbnail
function siteShare() {
  const { pad } = SHARE;
  let body = text(spec.name, { x: pad, y: 190, size: 60, weight: 700, fill: CHART.ink });
  const blurb = "An attribution system for writing that indicates the level of AI vs. human contribution.";
  wrap(blurb, 400, 32, 560).forEach((line, i) => {
    body += text(line, { x: pad, y: 262 + i * 46, size: 32, weight: 400, fill: CHART.muted });
  });
  for (const entry of spec.codes) {
    const [r, c] = entry.code.split("x").map(Number);
    body += grid(entry, false, 760 + (c - 1) * 116, 120 + (r - 1) * 116, 30, 5);
  }
  return shareSvg(body + footer("aialabels.com"), spec.name);
}

const png = (svgStr, width) => new Resvg(svgStr, { fitTo: { mode: "width", value: width } }).render().asPng();

// ─── Build ────────────────────────────────────────────────────────────────────
rmSync(outDir, { recursive: true, force: true });
const zipFiles = {};
const write = (rel, data) => {
  const file = join(outDir, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, data);
  zipFiles[`aia-labels-${spec.version}/${rel}`] = typeof data === "string" ? new TextEncoder().encode(data) : data;
};

const sizes = {};
for (const entry of spec.codes) {
  for (const mono of [false, true]) {
    const suffix = mono ? "-mono" : "";
    const ic = icon(entry, mono);
    write(`${entry.code}/icon${suffix}.svg`, ic);
    write(`${entry.code}/icon${suffix}.png`, png(ic, 64));
    const badges = [
      ["wide", splitBadge(entry, mono, "medium", true)],
      ["medium", splitBadge(entry, mono, "medium", false)],
      ["compact", splitBadge(entry, mono, "compact", false)],
    ];
    if (!mono) sizes[entry.code] = Object.fromEntries(badges.map(([name, b]) => [name, [b.w, b.h]]));
    for (const [name, b] of badges) {
      write(`${entry.code}/${name}${suffix}.svg`, b.svg);
      write(`${entry.code}/${name}${suffix}.png`, png(b.svg, b.w));
      write(`${entry.code}/${name}${suffix}@2x.png`, png(b.svg, b.w * 2));
    }
  }
}
write("spec.json", JSON.stringify(spec, null, 2) + "\n");
for (const [name, chartFn] of [["chart", gridChart], ["chart-icons", iconsChart]]) {
  const svgStr = chartFn();
  write(`${name}.svg`, svgStr);
  write(`${name}.png`, png(svgStr, CHART.w));
}
// Fixed timestamp so the zip only changes when its contents do
// Link preview images (written outside write() so they stay out of the zip)
writeFileSync(join(outDir, "share.png"), png(siteShare(), SHARE.w));
for (const entry of spec.codes) writeFileSync(join(outDir, entry.code, "share.png"), png(labelShare(entry), SHARE.w));

writeFileSync(join(outDir, `aia-labels-${spec.version}.zip`), zipSync(zipFiles, { mtime: "2026-10-04T00:00:00Z" }));

// Every badge size, so sites can give snippets an exact width/height
writeFileSync(join(outDir, "sizes.json"), JSON.stringify(sizes, null, 2) + "\n");

console.log(`Wrote ${Object.keys(zipFiles).length} files and a zip to ${outDir}`);
