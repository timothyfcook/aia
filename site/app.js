// Fills in the label maker and the labels list from the published spec and sizes.
// Snippets point at timothyfcook.com, where the label files and label pages are published.

const SITE = "https://timothyfcook.com";
const state = { ideas: 1, words: 1 };

const altText = (e) => `AIA ${e.code} · ${e.name}: ${e.summary[0].toLowerCase()}${e.summary.slice(1, -1)}`;
const tooltip = (e) => `AIA ${e.code} · ${e.name}: ${e.description}`;
const markdown = (e) =>
  `[![${altText(e)}](${SITE}/aia/v1/${e.code}/wide.svg)](${SITE}/aia/${e.code} "${tooltip(e)}")`;

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

function render(spec, sizes, byCode) {
  const entry = byCode[`${state.ideas}x${state.words}`];
  for (const group of document.querySelectorAll(".options")) {
    const selected = state[group.dataset.axis];
    group.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(i + 1 === selected)));
  }
  document.getElementById("chosen").innerHTML =
    `<strong>AIA ${entry.code} · ${entry.name}.</strong> ${entry.description}`;
  const preview = document.getElementById("preview");
  const [w, h] = sizes[entry.code].wide;
  Object.assign(preview, { src: `v1/${entry.code}/wide.svg`, width: w, height: h, alt: altText(entry) });
  document.getElementById("snippet").textContent = markdown(entry);
}

async function init() {
  const [spec, sizes] = await Promise.all(["v1/spec.json", "v1/sizes.json"].map((u) => fetch(u).then((r) => r.json())));
  const byCode = Object.fromEntries(spec.codes.map((e) => [e.code, e]));

  for (const group of document.querySelectorAll(".options")) {
    const axis = group.dataset.axis;
    spec.axes[axis].forEach((label, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `${axisIcon(byCode, axis, i + 1)}<span>${label}</span>`;
      button.addEventListener("click", () => { state[axis] = i + 1; render(spec, sizes, byCode); });
      group.append(button);
    });
  }

  document.getElementById("labels").innerHTML = spec.codes.map((e) => {
    const [w, h] = sizes[e.code].medium;
    return `<li><a href="${SITE}/aia/${e.code}" title="${tooltip(e)}"><img src="v1/${e.code}/medium.svg" width="${w}" height="${h}" alt="AIA ${e.code} · ${e.name}"></a><p>${e.description}</p></li>`;
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

  render(spec, sizes, byCode);
}

init();
