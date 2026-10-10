---
name: aia-labels
description: >
  AI Attribution (AIA) labels. Use whenever a document, page, post, email, or
  HTML export needs an AIA label, or when choosing, checking, or updating one.
  Covers the nine codes, how to assess the code honestly (there is no default),
  the output format for each destination (Markdown badge, plain text, HTML,
  page head, Confluence storage format), and placement.
---

<!-- {{generated}} -->

# AIA labels

AI Attribution (AIA) is a two-axis attribution scheme for writing: ideas × words,
each scored 1 to 3. The code is `<ideas>x<words>`. Every labeled document starts
with one.

Source of truth: https://aialabels.com/v1/spec.json (CC BY 4.0). Website and label
maker: https://aialabels.com. Essay: https://timothyfcook.com/writing/2026/is-this-worth-my-attention

- Ideas: 1 = original ideas, 2 = some AI ideas, 3 = mostly AI ideas
- Words: 1 = original writing, 2 = some AI writing, 3 = mostly AI writing

---

## The nine codes

{{codes}}

---

## Assessing the code

**There is no default.** Score each document on what actually happened.

| Ideas axis | Score |
| --- | --- |
| Thesis, framing, and key points came from the author's notes, docs, or head | 1 |
| Thesis is the author's; some supporting ideas, structure, or research came from AI | 2 |
| AI proposed the thesis or most of the argument | 3 |

| Words axis | Score |
| --- | --- |
| The author wrote the sentences; AI fixed typos or spelling at most | 1 |
| The author wrote a real draft; AI rewrote or added parts | 2 |
| AI wrote most of the sentences that remain in the final text | 3 |

- **Involvement is not authorship.** Authors usually do more of the thinking and
  writing than a session transcript suggests, so do not assume x3 because AI
  was involved. A brainstorm the author rejected does not raise the ideas score,
  and a draft they rewrote line by line drops the words score to 2.
- **Research counts only if it changed the argument.** AI research and synthesis
  of other people's documents raises the ideas score only when it shaped the
  thesis.
- **State the code and a one-line reason before drafting.** Re-assess at the end;
  if the author rewrote most of it, or the mix changed during editing, update the
  label.
- **Re-assess before publishing.** Before the document is finally published or
  shared, re-assess both axes, especially if the author edited it after it was
  labeled, and update the label if the mix changed. Their own rewrites usually
  lower the words score (a draft they rewrote line by line is a 2, not a 3), and
  ideas they added or cut can move the ideas score either way.
- **3x3 is legitimate** for machine-facing or throwaway text. If a 3x3 document is
  headed to other people, say so plainly and suggest a human pass before
  publishing.

---

## Output formats

Replace `CODE`, `NAME`, `SUMMARY`, `DESCRIPTION` from the table above. The alt
text uses the summary in lowercase after the colon, without the final period.

**Markdown badge** (Markdown files, GitHub, Confluence pages created from
Markdown, anywhere images render):

```
[![AIA CODE · NAME: summary-lowercase](https://aialabels.com/v1/CODE/wide.svg)](https://aialabels.com/CODE "AIA CODE · NAME: DESCRIPTION")
```

Example:

```
[![AIA 2x3 · Directed: some AI ideas, mostly AI writing](https://aialabels.com/v1/2x3/wide.svg)](https://aialabels.com/2x3 "AIA 2x3 · Directed: Ideas shaped together, with AI writing most text under direction.")
```

Sizes: `wide.svg` (code, name and summary), `medium.svg` (code and name) and
`compact.svg` (code and name, smaller). Append `-mono` before the extension for
the one-color style (`wide-mono.svg`). PNG versions exist at the same paths, plus
`@2x.png` for high-density screens. Widths depend on the label:

{{sizes}}

**Plain text line** (email, Slack, plain text):

```
AIA CODE · NAME. SUMMARY (aialabels.com/CODE)
```

Example: `AIA 2x3 · Directed. Some AI ideas, mostly AI writing. (aialabels.com/2x3)`

**HTML** (web pages, HTML exports). Use the label's width from the sizes table:

```
<a href="https://aialabels.com/CODE" rel="ai-attribution" title="AIA CODE · NAME: DESCRIPTION"><img src="https://aialabels.com/v1/CODE/wide.svg" width="WIDTH" height="31" alt="AIA CODE · NAME: summary-lowercase"></a>
```

**Page head** (sites and HTML documents, in addition to the visible label):

```
<meta name="ai-attribution" content="AIA CODE">
<link rel="ai-attribution" href="https://aialabels.com/CODE">
```

**Confluence storage format** (adding the badge to an existing page). Insert
one element at the top of the page body:

```xml
<p><a href="https://aialabels.com/CODE" title="AIA CODE · NAME: DESCRIPTION"><ac:image ac:alt="AIA CODE · NAME: summary-lowercase" ac:width="WIDTH"><ri:url ri:value="https://aialabels.com/v1/CODE/wide.svg" /></ac:image></a></p>
```

---

## Placement

- The label goes below the title and above any summary or tl;dr. It is the first
  thing in the body.
- Never bury it in a footer.
- If a document is revised later and the mix changes, update the label.

## Checklist

1. Label is the first line of the body.
2. Code reflects what actually happened, with a one-line reason stated.
3. Format matches the destination (badge, text line, HTML, or storage format).
4. Name, summary, and description match the table exactly for that code.
5. Before publishing, the label was re-assessed and still matches.
