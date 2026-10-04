# AI Attribution (AIA)

AIA is an attribution system for writing that helps readers understand a writer's intent. It works on two axes, ideas and words, to show how much of a piece came from AI and how much from a person. The goal is to give us all an honest framework for how much attention our writing deserves.

**Get a label for your writing:** [timothyfcook.com/aia](https://timothyfcook.com/aia)

**Read the reasoning:** [AI Attribution (AIA): Labels for AI Writing](https://timothyfcook.com/writing/2026/is-this-worth-my-attention)

![AI Attribution (AIA) chart: ideas × words](assets/v1/chart.png)

## How it works

Each label has two scores from 1 to 3, ideas first and words second. On both scales, 1 is original, 2 is some AI, and 3 is mostly AI.

| Badge | Meaning |
|:---|:---|
| <img src="assets/v1/1x1/medium.svg" width="97" height="31" alt="AIA 1x1 · No AI"> | A person's own ideas and writing. Spellcheck is allowed. |
| <img src="assets/v1/1x2/medium.svg" width="97" height="31" alt="AIA 1x2 · Polished"> | The ideas and the draft were human, but AI did copyedits and redrafting. |
| <img src="assets/v1/1x3/medium.svg" width="97" height="31" alt="AIA 1x3 · Proxied"> | The argument, prompts, and outline are human, but most of the writing is done by AI. |
| <img src="assets/v1/2x1/medium.svg" width="97" height="31" alt="AIA 2x1 · Informed"> | The thinking was developed with AI through research, brainstorming or debate, but a person wrote every word. |
| <img src="assets/v1/2x2/medium.svg" width="97" height="31" alt="AIA 2x2 · Paired"> | A person collaborated with AI on both the ideas and writing. |
| <img src="assets/v1/2x3/medium.svg" width="97" height="31" alt="AIA 2x3 · Directed"> | The ideas were shaped together and AI wrote the text, with a person steering and editing. |
| <img src="assets/v1/3x1/medium.svg" width="97" height="31" alt="AIA 3x1 · Borrowed"> | The ideas largely came from AI, and a person wrote them up in their own words. |
| <img src="assets/v1/3x2/medium.svg" width="97" height="31" alt="AIA 3x2 · Curated"> | AI came up with the ideas and first draft. A person cut and reworked it. |
| <img src="assets/v1/3x3/medium.svg" width="97" height="31" alt="AIA 3x3 · Slop"> | Vibe writing. A person provided a minimal prompt and the AI did the rest. |

The full definitions live in [`spec.json`](spec.json), which is the source of truth for everything in this repo.

## Badges

Each label comes as a full-width badge, a medium badge, a compact badge and an icon, in color and one color.

**Full width**<br>
<img src="assets/v1/1x2/wide.svg" width="415" height="31" alt="AIA 1x2 · Polished: original ideas, some AI writing">

**Medium (97×31)**<br>
<img src="assets/v1/1x2/medium.svg" width="97" height="31" alt="AIA 1x2 · Polished: original ideas, some AI writing">

**Compact (100×19)**<br>
<img src="assets/v1/1x2/compact.svg" width="100" height="19" alt="AIA 1x2 · Polished: original ideas, some AI writing">

The easiest way to add one is the chooser at [timothyfcook.com/aia](https://timothyfcook.com/aia), which gives you copy-paste Markdown, HTML and plain text. For example, in Markdown:

```markdown
[![AIA 1x2 · Polished: original ideas, some AI writing](https://timothyfcook.com/aia/v1/1x2/wide.svg)](https://timothyfcook.com/aia/1x2)
```

Files are served from `https://timothyfcook.com/aia/v1/<code>/<file>`:

| File | What it is |
|---|---|
| `wide.svg`, `wide.png`, `wide@2x.png` | Full-width badge: icon, code, name and summary (31px tall, width fits the text) |
| `medium.svg`, `medium.png`, `medium@2x.png` | Medium badge: icon, code and name (97×31) |
| `compact.svg`, `compact.png`, `compact@2x.png` | Compact badge: icon and code (100×19) |
| `icon.svg`, `icon.png` | 3×3 grid icon |

Add `-mono` before the extension for the one-color version (e.g. `medium-mono.svg`). Exact sizes for every badge are in [`sizes.json`](assets/v1/sizes.json). Everything is also in [`aia-badges-v1.zip`](assets/v1/aia-badges-v1.zip).

## Versioning

Published files never change. Pages around the web link to `https://timothyfcook.com/aia/v1/...`, so editing a v1 file would silently change every page that uses it. Changes to names, definitions or the design go into a new version (`v2`) with its own folder and URLs.

## Contributing

Suggestions, critiques and fixes are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md), or [open an issue](https://github.com/timothyfcook/aia/issues/new/choose).

## License

- The AIA spec, badges, icons and chart are licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) ([full text](LICENSE-CC-BY-4.0.txt)). A badge linked to its label page counts as credit.
- The generator code in `scripts/` is licensed under the [MIT License](LICENSE).
