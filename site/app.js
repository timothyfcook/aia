// Runs the label maker, the label pages and the labels list from the published spec and sizes.
// Snippets point at aialabels.com, where the label files and label pages are published.

const SITE = "https://aialabels.com";
const pageCode = document.body.dataset.code; // set on label pages (/1x1 … /3x3)
const state = { ideas: 1, words: 1, size: "wide", mono: false, format: "svg", tab: "markdown" };

const SIZES = [["wide", "Full width"], ["medium", "Medium"], ["compact", "Compact"], ["text", "Text line"]];
const STYLES = [[false, "Color"], [true, "Mono"]];
const FORMATS = [["svg", "SVG"], ["png", "PNG"]];
const TABS = [["markdown", "Markdown"], ["html", "HTML"], ["plain", "Plain text"], ["head", "Page head"]];

const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const altText = (e) => `AIA ${e.code} · ${e.name}: ${e.summary[0].toLowerCase()}${e.summary.slice(1, -1)}`;
const tooltip = (e) => `AIA ${e.code} · ${e.name}: ${e.description}`;

// Every snippet uses absolute URLs, since they get pasted into other people's sites
function snippets(e, sizes) {
  const page = `${SITE}/${e.code}`;
  const suffix = state.mono ? "-mono" : "";
  const lead = `AIA ${e.code} · ${e.name}.`;
  const plain = `${lead} ${e.summary} (${page.replace("https://", "")})`;
  const head = `<meta name="ai-attribution" content="AIA ${e.code}">\n<link rel="ai-attribution" href="${page}">`;

  if (state.size === "text") {
    const icon = `${SITE}/v1/${e.code}/icon${suffix}.${state.format}`;
    return {
      html: `<p><a href="${page}" rel="ai-attribution" title="${tooltip(e)}"><img src="${icon}" width="16" height="16" alt="" style="vertical-align:-3px"> <strong>${lead}</strong></a> ${e.summary}</p>`,
      markdown: `**[${lead}](${page} "${tooltip(e)}")** ${e.summary}`,
      plain,
      head,
    };
  }

  const [w, h] = sizes[e.code][state.size];
  const svg = `${SITE}/v1/${e.code}/${state.size}${suffix}.svg`;
  // PNGs use the @2x file at a fixed width/height so they stay sharp on high-density screens
  const img = state.format === "png" ? `${SITE}/v1/${e.code}/${state.size}${suffix}@2x.png` : svg;
  const html = `<a href="${page}" rel="ai-attribution" title="${tooltip(e)}"><img src="${img}" width="${w}" height="${h}" alt="${altText(e)}"></a>`;
  return {
    html,
    // Markdown can't size images, so PNG labels use the HTML tag to stay sharp; SVGs size themselves
    markdown: state.format === "png" ? html : `[![${altText(e)}](${svg})](${page} "${tooltip(e)}")`,
    plain,
    head,
  };
}

// Small 3×3 grid with one row (ideas) or column (words) filled in its chart colors
function axisIcon(byCode, axis, level) {
  let cells = "";
  for (let r = 1; r <= 3; r++) {
    for (let c = 1; c <= 3; c++) {
      const inSlice = axis === "ideas" ? r === level : c === level;
      const fill = inSlice ? byCode[`${r}x${c}`].dark : "#E3E1D9";
      cells += `<rect x="${(c - 1) * 7.5}" y="${(r - 1) * 7.5}" width="6" height="6" rx="1.1" fill="${fill}"/>`;
    }
  }
  return `<svg width="21" height="21" viewBox="0 0 21 21" aria-hidden="true">${cells}</svg>`;
}

const choiceGroup = (label, key, choices) => `
  <div role="group" aria-label="${label}">
    <p class="question">${label}</p>
    <div class="choices">${choices.map(([value, text]) => `<button type="button" data-key="${key}" data-value="${value}">${text}</button>`).join("")}</div>
  </div>`;

function buildMaker() {
  document.getElementById("maker").innerHTML = `
    <div class="preview" id="preview"></div>
    <div class="tabs" role="tablist">${TABS.map(([key, text]) => `<button type="button" role="tab" data-tab="${key}">${text}</button>`).join("")}</div>
    <div class="snippet"><pre id="snippet"></pre><button type="button" id="copy">Copy</button></div>
    <div class="tweaks">
      ${choiceGroup("Label", "size", SIZES)}
      ${choiceGroup("Style", "mono", STYLES)}
      ${choiceGroup("Format", "format", FORMATS)}
    </div>`;
}

function render(sizes, byCode) {
  const entry = byCode[`${state.ideas}x${state.words}`];
  for (const group of document.querySelectorAll(".options")) {
    const selected = state[group.dataset.axis];
    group.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(i + 1 === selected)));
  }
  // All descriptions share one grid cell and only the chosen one is visible,
  // so the area is always as tall as the longest one and the preview below never moves
  document.querySelectorAll("#chosen > p").forEach((p) => p.classList.toggle("on", p.dataset.code === entry.code));

  document.querySelectorAll(".choices button").forEach((b) => {
    b.setAttribute("aria-pressed", String(String(state[b.dataset.key]) === b.dataset.value));
  });
  document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === state.tab)));

  const suffix = state.mono ? "-mono" : "";
  const preview = document.getElementById("preview");
  if (state.size === "text") {
    preview.innerHTML = `<p class="text-line"><img src="/v1/${entry.code}/icon${suffix}.svg" width="16" height="16" alt=""> <strong>AIA ${entry.code} · ${entry.name}.</strong> ${entry.summary}</p>`;
  } else {
    const [w, h] = sizes[entry.code][state.size];
    preview.innerHTML = `<img src="/v1/${entry.code}/${state.size}${suffix}.svg" width="${w}" height="${h}" alt="${escapeHtml(altText(entry))}">`;
  }
  document.getElementById("snippet").textContent = snippets(entry, sizes)[state.tab];
}

async function init() {
  const [spec, sizes] = await Promise.all(["/v1/spec.json", "/v1/sizes.json"].map((u) => fetch(u).then((r) => r.json())));
  const byCode = Object.fromEntries(spec.codes.map((e) => [e.code, e]));
  if (pageCode) [state.ideas, state.words] = pageCode.split("x").map(Number);
  const update = () => render(sizes, byCode);

  for (const group of document.querySelectorAll(".options")) {
    const axis = group.dataset.axis;
    spec.axes[axis].forEach((label, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `${axisIcon(byCode, axis, i + 1)}<span>${label}</span>`;
      button.addEventListener("click", () => { state[axis] = i + 1; update(); });
      group.append(button);
    });
  }

  // Motto band: each label's row from its grid (tints, with its own square solid), repeated across the page
  const mosaic = document.getElementById("mosaic");
  if (mosaic) {
    const cells = spec.codes.flatMap((e) => {
      const words = Number(e.code.split("x")[1]);
      return [1, 2, 3].map((c) => (c === words ? e.dark : e.tint));
    });
    mosaic.innerHTML = Array.from({ length: 160 }, (_, i) => `<i style="background:${cells[i % cells.length]}"></i>`).join("");
  }

  const chosen = document.getElementById("chosen");
  if (chosen) {
    chosen.innerHTML = spec.codes
      .map((e) => `<p data-code="${e.code}"><a href="/${e.code}"><strong>AIA ${e.code} · ${e.name}.</strong></a> ${e.description}</p>`)
      .join("");
  }

  buildMaker();
  document.querySelectorAll(".choices button").forEach((b) => b.addEventListener("click", () => {
    const { key, value } = b.dataset;
    state[key] = key === "mono" ? value === "true" : value;
    update();
  }));
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => { state.tab = b.dataset.tab; update(); }));

  document.getElementById("labels").innerHTML = spec.codes.map((e) => {
    const [w, h] = sizes[e.code].medium;
    const current = e.code === pageCode ? ' aria-current="page"' : "";
    return `<li${current}><a href="/${e.code}" title="${escapeHtml(tooltip(e))}"><img src="/v1/${e.code}/medium.svg" width="${w}" height="${h}" alt="AIA ${e.code} · ${e.name}"></a><p>${e.description}</p></li>`;
  }).join("");

  const copy = document.getElementById("copy");
  copy.addEventListener("click", async () => {
    const text = document.getElementById("snippet").textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = Object.assign(document.createElement("textarea"), { value: text });
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    copy.textContent = "Copied";
    setTimeout(() => { copy.textContent = "Copy"; }, 1600);
  });

  update();
}

init();
