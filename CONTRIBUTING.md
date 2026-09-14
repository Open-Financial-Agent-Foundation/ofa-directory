# Contributing

## Add or change a provider

1. Fork, then add `registry/publishers/<your-domain>.json`, or add your domain to `registry/sources.json` if you host `/.well-known/ai-catalog.json`.
2. Run `bun install && bun run validate`. Fix every error; read every warning.
3. Open a pull request. Say who you are in relation to the domain (owner, steward, contributor) in the description.

Entries must carry identifiers under your own domain (`urn:air:<your-domain>:...`). Entries for a domain you do not own need `metadata.steward` set to your domain and are marked as such on the site.

## Change the code

- Bun only. TypeScript strict, no `as` casts, Biome for lint and format (`bun run lint`).
- Keep the registry readable by humans: two-space JSON, one publisher per file, sorted entries.
- Keep to the ARD spec. When the spec is silent, document the choice in `docs/` and open an issue upstream.
- Comments explain a decision; they never describe what changed over time.

## Vocabulary

Values (a new `ofa:lineOfBusiness`) merge by pull request. Terms (a new `ofa:*` key) start with an issue titled `vocabulary: <term>`.

## Conduct

Be direct and kind. Disagreements are about entries and code, never people. Maintainers may close discussions that stop being about the project.
