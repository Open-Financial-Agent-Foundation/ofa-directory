---
name: Open Financial Agent
description: A public register of financial-services agents, read on white paper in ink and grey.
colors:
  paper: "#ffffff"
  ink: "#0d0d0d"
  ink-soft: "#2f2f36"
  muted: "#6e6e80"
  faint: "#71717f"
  rule: "#ececf1"
  rule-strong: "#d9d9e3"
  fill: "#f7f7f8"
  fill-hover: "#f2f2f4"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(40px, 3.6vw, 52px)"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.65
    letterSpacing: "-0.025em"
  lead:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  small:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "14.5px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
    fontFeature: "tabular-nums"
  mono-fine:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
    fontFeature: "tabular-nums"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
  section: "128px"
components:
  search-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    height: "56px"
    padding: "0 20px 0 48px"
  entry-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "16px 12px"
  entry-row-hover:
    backgroundColor: "{colors.fill-hover}"
  status-mark:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  status-mark-live:
    textColor: "{colors.ink}"
  type-mark:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted}"
    typography: "{typography.mono-fine}"
    rounded: "{rounded.full}"
    padding: "3px 8px"
  nav-link:
    textColor: "{colors.muted}"
    typography: "{typography.body}"
  nav-link-hover:
    textColor: "{colors.ink}"
  facet-button:
    textColor: "{colors.muted}"
    typography: "{typography.body}"
    padding: "5px 0"
  facet-button-active:
    textColor: "{colors.ink}"
  button-copy:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
  command-block:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.lg}"
    padding: "8px 8px 8px 20px"
    height: "56px"
  fill-panel:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  code-inline:
    backgroundColor: "{colors.fill}"
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.md}"
    padding: "0.15em 0.4em"
---

# Design System: Open Financial Agent

## Overview

**Creative North Star: "The Register"**

Open Financial Agent is a registry, not a marketplace, and it looks like one: a public register read on white paper. Every screen is ink on white with a small family of greys doing the secondary work. The register does not sell. It lists, it ranks, and it points to the provider. The visual system takes that stance literally: one field to ask, ruled rows to answer, and marks drawn in ink where another product would reach for colour.

The mood is spare, exact, quiet and trustworthy. Density comes from typography and hairlines rather than from boxes. A row is a row because a 1px rule sits under it. A panel is a panel because its ground is two shades off white. Type carries hierarchy on its own: Inter at three weights for reading, Geist Mono at small sizes for anything the machine owns (identifiers, media types, commands, counts and scores). The quality bar the founder pinned is openai.com and platform.openai.com, played straight with no concept roll.

Confirmed rejections: colour as decoration, cards for everything, gradients, illustration, and dark mode. The site ships one light theme only; `color-scheme: light` is set on the root and no dark palette exists.

**Key Characteristics:**
- One white ground, ink text, five greys. No hue anywhere, including status.
- Status is drawn: a filled dot means live, a ring means demo, a bare word means listing.
- Hairlines do the structural work; a surface is a 1px rule or a faint fill, never both, and never a shadow.
- Inter 400/500/600 for reading, Geist Mono with tabular figures for identifiers and numbers.
- One authored motion: rows rise 6px into place as a query resolves. Everything else is a 150ms colour change.

## Colors

The palette is one hue family of cool greys stepping from ink to paper, with white as the only surface.

### Primary
- **Ink** (`{colors.ink}`): the one and only accent. Headlines, row names, the lead score, the live status dot, the focus ring, the text caret, the selection background, and the wordmark square. When something must stand out, it becomes ink, never a colour.

### Neutral
- **Paper** (`{colors.paper}`): the ground of every page, the header, the search field and the copy button. Nothing sits on anything but paper or a fill tint.
- **Ink Soft** (`{colors.ink-soft}`): running text on entry pages and in rendered docs, where full ink would read too hard at paragraph length.
- **Muted** (`{colors.muted}`): the secondary voice. Sub-lines, descriptions, navigation at rest, labels, the type mark, the demo and listing status words, table headers.
- **Faint** (`{colors.faint}`): metadata and counts. Publisher domains, facet counts, breadcrumbs, the `15 entries` hint, non-lead scores, list markers, the demo ring's stroke. Three points lighter than Muted so that 12px mono still clears AA on white.
- **Rule** (`{colors.rule}`): the hairline. Header and footer borders, every row divider, definition-list rows, docs table rows.
- **Rule Strong** (`{colors.rule-strong}`): the stroke that must read as an edge on its own. The search field border, the type mark outline, the copy button border, link underlines at rest, blockquote bars.
- **Fill** (`{colors.fill}`): the resting tint for machine surfaces: command blocks, the "Connect directly" panel, raw JSON, inline code, capability chips.
- **Fill Hover** (`{colors.fill-hover}`): the only hover fill, applied to a whole ranked row.

### Named Rules
**The No Hue Rule.** Nothing on any surface carries chroma. Status, emphasis, links, focus and selection are all expressed in ink or grey. There is no status green, no link blue, no error red.

**The Drawn Status Rule.** Status is a 7px mark in ink, never a coloured chip: a filled dot (live, text in ink), a 1.5px ring in Faint (demo, text in Muted), or no mark at all (listing, the word alone).

**The One Ink Rule.** In a ranked list, only the lead row's score is ink; the rest are Faint. Emphasis is scarce so that it means something.

## Typography

**Display Font:** Inter (with system-ui, -apple-system, sans-serif)
**Body Font:** Inter (with system-ui, -apple-system, sans-serif)
**Label/Mono Font:** Geist Mono (with ui-monospace, SFMono-Regular, Menlo, monospace)

**Character:** Inter at 400, 500 and 600 only, with the `cv11` and `ss01` stylistic sets enabled so the single-storey a and open forms read as a register rather than a UI kit. Headings tighten to -0.025em and balance their wrap. Geist Mono never carries prose; it marks what belongs to the machine and always sets tabular figures so scores and counts align in a column.

### Hierarchy
- **Display** (600, 40px on phones and 52px from 640px, 1.06, -0.025em): the home headline, capped at 24ch. Entry titles use the same voice at 32px and 40px; docs titles at 34px.
- **Headline** (600, 22px, 1.1, -0.025em): section headings ("How it works", "Everything indexed") and docs h2.
- **Title** (600, 17px, 1.65): step titles in the ruled list and docs h3. Row names drop to 500 at 16px so the list reads as entries, not headings.
- **Lead** (400, 18px, 1.55, Muted): the one sentence under the home headline, and the first paragraph after a docs h1. Max 56ch.
- **Body** (400, 16px, 1.6): the base. Entry descriptions at 17px in Ink Soft, step bodies at 15.5px in Muted, definition values at 15px.
- **Small** (400, 14.5px, Muted): the one-line description inside a ranked row, truncated in the hero and clamped to two lines in the index. Max 64ch.
- **Label** (500, 13px, Muted): definition-list terms, facet group names, the "Documentation" rail title, "Connect directly", table headers. Never uppercase, never tracked.
- **Mono** (400, 12px to 13.5px, tabular): identifiers, publisher domains, media types, URNs, commands, counts, scores, the `/.well-known/ai-catalog.json` path. The type mark uses 11.5px.

### Named Rules
**The Machine Voice Rule.** Geist Mono is reserved for what a machine emitted or will consume: identifiers, media types, commands, counts and scores. A sentence never sets in mono, and a domain never sets in Inter.

**The Three Weights Rule.** Only 400, 500 and 600 are loaded. Emphasis moves one step, never two: a nav link at rest is 400 Muted, active is 500 Ink.

## Layout

One centred column of 1120px with a 24px gutter on both sides, on every page. Reading content narrows inside it: the home hero, search field and connect section sit in a 760px column; entry pages in 820px; rendered docs cap at 68ch. The header is 64px tall, sticky, and closes with a hairline. The footer opens with a hairline 128px below the last section.

Vertical rhythm is generous and uneven on purpose: the hero starts 64px below the header (80px from 640px), major sections sit 128px to 144px apart, and inside a section the heading is followed by 24px, then a ruled list. Ruled rows carry 14px of vertical padding in the hero's compact answer and 16px in the full index; definition rows carry 12px.

Two-column surfaces use a fixed rail and a fluid body. The index rail is 200px wide with a 48px gap from 1024px, sticky at 96px from the top; below that width it folds into a single `<details>` disclosure labelled "Filter" so the index stays one scroll away. The docs rail is 220px with a 56px gap from 768px. Definition lists and the three-step list use a 180px label column from 640px and stack on phones. The wordmark text hides below 420px, leaving the ink square.

Breakpoints in use: 420px (wordmark text), 640px (`sm`), 768px (`md`), 1024px (`lg`). Every grid collapses to one column below its breakpoint; nothing scrolls horizontally except a `pre` or a docs table inside its own `overflow-x: auto` wrapper.

## Elevation & Depth

There are no shadows in the build. Depth is conveyed by two devices only: a 1px hairline (Rule, or Rule Strong where the edge must hold alone) and a two-shade fill (Fill at rest, Fill Hover on a hovered row). The sticky header is separated from the page by a hairline, not a drop shadow. Command blocks, the "Connect directly" panel and raw JSON sit in Fill with no border. The search field and the copy button have a Rule Strong border and no fill.

### Named Rules
**The Hairline or Nothing Rule.** A surface gets a border or a fill, never both, and never a shadow. If a border and a fill both seem necessary, the surface is wrong.

**The Ink Focus Rule.** Focus is a 2px ink outline offset 3px with a 4px radius, on links, buttons, inputs and summaries alike. Selection inverts to ink on paper. The caret is ink.

## Shapes

Corners are quiet and scale with the object. The search field alone reaches 12px. Rows (on hover), command blocks, fill panels, the copy button and rendered `pre` blocks sit at 8px. Inline code and capability chips at 6px. The focus ring at 4px. The wordmark square at 5px holds a paper ring inside it. Two shapes are fully round: the type mark, an outlined pill in Rule Strong, and the 7px status dot.

Borders are always 1px (the status ring is 1.5px, the caret 1.5px wide). Dividers run full width of their column, and the hover fill on a row bleeds 12px past the text on each side (`-mx-3 px-3`) so the row lifts without the text shifting.

Links underline with a 1px stroke in Rule Strong, offset 3px, and the underline darkens to ink on hover over 150ms. Top navigation and footer links have no underline and move from Muted to Ink.

## Components

### Search Field
- **Character:** the one field. It asks, and the index answers under it.
- **Shape:** 56px tall, 12px radius, 1px Rule Strong border on paper, 48px left inset for a 16px stroked search glyph in Faint, 17px Inter text in ink.
- **Focus:** the border becomes ink over 150ms. No glow, no ring beyond the standard ink focus outline.
- **Hint:** a 12px mono count in Faint pinned to the right edge (`15 entries`, `ranking…`, `3 matches`), hidden on phones.
- **Demo mode:** the field is empty and a paper overlay types a real need with a blinking 1.5px ink caret (1s, `steps(1)`). The visitor's first focus or pointer-down switches it to live search and clears the overlay.

### Ranked Rows
- **Character:** ruled rows, the register's line item.
- **Shape:** full-width `li` closed with a Rule hairline; the inner link has an 8px radius and a Fill Hover background on hover, bleeding 12px past the text column.
- **Anatomy:** name (500, 16px, ink) then publisher domain (mono 12px, Faint) on one baseline; a Small description under it; on the right, a 13px tabular score 32px wide, ink for the lead row and Faint for the rest. The full index adds the status mark, the type mark and a Faint metadata line (sector, line of business, country in mono, actions in Muted).
- **Motion:** each row carries `.rise` with `--i` set to its index: opacity 0 and 6px down to rest, 560ms, `cubic-bezier(0.16, 1, 0.3, 1)`, staggered 45ms per row. The list re-keys when a query resolves so the rows rise again. Under `prefers-reduced-motion: reduce` the animation is removed and the demo loop never starts.

### Status Marks
- **Style:** inline, 13px, a 7px mark and a 7px gap before the word.
- **live:** filled ink dot, word in ink.
- **demo:** 1.5px Faint ring, word in Muted.
- **listing:** no mark, word in Muted.
- Unknown statuses fall back to the listing treatment.

### Type Marks
- **Style:** an outlined pill, 1px Rule Strong, fully round, 3px by 8px padding, 11.5px Geist Mono in Muted, `line-height: 1`. Shows the short form (`MCP`, `A2A`, `OpenAPI`, `Skill`, `Listing`) and carries the full media type in its `title`.

### Buttons
- **Copy:** the only button-shaped button. Paper ground, 1px Rule Strong border, 8px radius, 8px by 12px padding, 13px Inter 500 in ink. Hover moves the border to ink over 150ms. The label swaps to "Copied" for 1.6s with `aria-live="polite"`.
- **Facet toggles:** text buttons at 14px, full width, value left and mono count right, 5px vertical padding. Rest is Muted with Faint count; pressed (`aria-pressed`) is ink at 500 with an ink count.
- **Clear:** an inline text button at mono size, underlined in Rule Strong.

### Fill Panels
- **Command block:** Fill ground, 8px radius, 56px minimum height, 20px left inset, the command in 13.5px mono scrolling horizontally, the Copy button flush right with 8px inset.
- **Connect directly:** Fill ground, 8px radius, 24px padding, a Label above a 12.5px mono `pre`, a 13px Muted note under it.
- **Raw entry:** a `<details>` with a Label summary, opening to a 12px mono `pre` in Fill at 8px radius.
- **Inline code and capability chips:** Fill, 6px radius, mono.

### Definition List
- **Style:** rows of Label term (180px column from 640px) and 15px Ink Soft value, 12px vertical padding, closed with a Rule hairline. Values in the machine's voice (publisher, type, URL, tags) set in mono; external links underline in Rule Strong.

### Navigation
- **Header:** 64px, sticky, paper ground, hairline below. Wordmark is an 18px ink square (5px radius) with a paper ring inside, then "Open Financial Agent" in Inter 500 at 15px, -0.01em. Four text links at 14px in Muted, ink on hover, 28px apart (20px on phones).
- **Docs rail:** a Label "Documentation" in Faint, then 14px links stacked with 4px vertical padding; the current page is ink at 500 with `aria-current="page"`.
- **Footer:** hairline above, 48px vertical padding, 13.5px Muted; the wordmark line in ink at 500, machine paths in mono at 12.5px, right-aligned column from 640px.

### Rendered Docs (`.prose`)
- **Style:** 68ch, Ink Soft text, headings in ink at 34/22/17px with 3rem and 2rem top margins for h2 and h3; the paragraph after h1 becomes a Lead. Tables are hairline-ruled rows with Label headers and no vertical lines. Blockquotes carry a 1px Rule Strong left bar. `pre` sits in Fill at 8px radius, 13px.

## Do's and Don'ts

### Do:
- **Do** set every surface on Paper and every word in Ink or one of the five greys. When a thing needs emphasis, make it ink.
- **Do** draw status with the three ink marks (filled dot for live, Faint ring for demo, bare word for listing) at 7px with a 7px gap.
- **Do** separate content with a 1px Rule hairline and full-width ruled rows; reach for a Fill tint only when the content is a machine surface (a command, JSON, code).
- **Do** set identifiers, domains, media types, commands, counts and scores in Geist Mono with tabular figures, at 12px to 13.5px.
- **Do** keep radii at 8px or under, with 12px reserved for the search field and full-round for the type mark and status dot.
- **Do** animate list arrival with `.rise` (6px, 560ms, `cubic-bezier(0.16, 1, 0.3, 1)`, 45ms stagger) and every other state change as a 150ms colour transition.
- **Do** write "Relevance 0–100 is not a measure of trust" wherever a score is shown.
- **Do** honour `prefers-reduced-motion: reduce`: no rise, no caret, no demo typing, and rows shown at rest.

### Don't:
- **Don't** introduce colour anywhere, including status, links, focus, charts or error states. The world is monochrome by the founder's decision.
- **Don't** add a dark theme or a theme toggle. The single light theme is the system.
- **Don't** put content in cards. Rows with hairlines, or a Fill panel for machine output, are the only containers.
- **Don't** use shadows, gradients or illustration. Depth is a hairline or a tint.
- **Don't** give a surface both a border and a fill.
- **Don't** set prose in mono or a domain in Inter.
- **Don't** load Inter weights beyond 400, 500 and 600, or uppercase and track a label.
- **Don't** show a hero metric, a stats block or a feature-card triptych. The ranked answer is the hero.
