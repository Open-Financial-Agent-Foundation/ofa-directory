---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/hero-search.tsx","src/components/index-explorer.tsx","src/components/site-header.tsx"]
---

# Surface brief: home (src/app/page.tsx)

Scope: the home page of Open Financial Agent, plus the shared header, footer and status vocabulary it introduces. Mode: Persuade for the first viewport (a visitor decides this is real and worth connecting to), Operate below the fold (browse the index).
Audience: agent builders and insurers' product leads. Job: understand in seconds what the registry is, see it work on a real need, then connect or publish.
Proof: the index itself, queried live. Constraints: white, monochrome, Inter + mono, no dark mode, no invented claims, OpenAI-level finish.

## Direction contract

THESIS: The index answers before you ask it to. The first viewport is a real query already running against real providers, and the ranked answer is the hero. It refuses the hero-metric template (big number, small label, accent), the three feature cards, and the command-as-hero developer page.

OWN-WORLD: White ground. Ink #0D0D0D, secondary #6E6E80, a third grey #9A9AA6 for metadata. Hairlines #ECECF1, stronger #D9D9E3. No colour anywhere: status is a filled dot (live), a hollow ring (demo), or a word (listing). Inter 400/500/600, display at -0.025em, body 16/1.6. Mono (Geist Mono) only for identifiers, media types, commands, counts and scores, always tabular. One field with 12px radius and a single 1px border; type marks are outlined pills; nothing else is rounded past 8px. Elevation is a border or nothing, never both. Hover is a #F7F7F8 fill on rows. Text selection, caret and focus ring are ink.

STORY: A visitor reads one line, watches a need typed into the field and four providers ranked under it with publisher domains and scores, and understands: this is a registry agents query. Two exits: connect (one command) or publish (one pull request). Scrolling shows the whole index with facets, how it works in three plain steps, and how to connect.

FIRST VIEWPORT (1440×900): Header 64px, wordmark left in Inter 500, four text links right. From 128px below the header, the headline in Inter 600 at 56px/1.05, two lines, max 18ch, left-aligned in a 760px column. Sub-line 18px secondary, one sentence. At 340px: the search field, 720px wide, 56px tall, white with a 1px #D9D9E3 border, 12px radius, in demo mode typing a real need character by character. Under it, from ~420px, the top four ranked entries as hairline rows: name (Inter 500 16px), publisher domain (mono 12px grey), one-line description, score right-aligned in mono; the top row's score in ink, the others grey. Right of the field's bottom edge, one 13px link: "Connect your agent". No numbers, no stats block, no image.

FORM: The category standard played straight, at OpenAI's finish level (openai.com, platform.openai.com), user-pinned on 2026-09-15; no concept roll. Signature interaction: the demo types four real needs in turn and re-ranks the rows with a 40ms stagger, 4px rise, exponential ease-out; the visitor's first focus stops the demo and the field becomes live search against /api/v1/search. Reduced motion: the first need and its rows are shown at rest, no typing.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
