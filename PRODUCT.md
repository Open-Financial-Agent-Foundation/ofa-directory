# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Builders of AI agents (personal agents such as Muse, Grok, Claude and ChatGPT connectors; coding agents; back-office automations) who need to find which financial-services provider can quote, compare, explain or apply for a user's need, and connect to it by machine.
- Product and distribution leads at insurers, banks, lenders and public financiers who want their agent findable by those agents and want to see how it is listed.
- Maintainers and contributors who add or correct entries through pull requests.

## Product Purpose

Open Financial Agent is an open registry of financial-services capabilities for AI agents. Providers describe what their agents can do in an `ai-catalog.json`; the registry validates, indexes and ranks those entries against a plain-language need; the asking agent connects to the provider's own endpoint. Success: an agent asked "insure my dog in Sweden" gets the right provider's MCP endpoint in one call, and a provider gets listed by opening one pull request.

## Positioning

The only registry scoped to financial services that conforms to Agentic Resource Discovery (ARD v0.91, Google, Microsoft, GitHub and others, Apache-2.0), adds a finance vocabulary (`ofa:` terms: sector, line of business, country, actions, role, status) and a `context` operation that relays a factual question to the matching providers' own MCP knowledge tools and returns cited answers. It never quotes, never binds, never holds customer data. Listing is free and never conditioned on a commercial relationship.

## Operating Context

- The registry is a folder of JSON files in a public GitHub repository (Open-Financial-Agent-Foundation/ofa-directory). Adding a provider is a pull request; CI validates schema, identifier uniqueness and publisher binding.
- Agents reach it through a stateless MCP server (`/mcp`, tools `search`, `explore`, `get_entry`, `context`) or REST (`/api/v1/search`, `/explore`, `/agents`, `/entries/{id}`). No API key.
- Providers can also host `/.well-known/ai-catalog.json` on their own domain and be crawled (`bun run crawl`).
- Evaluated by engineers reading docs and trying the MCP in Claude Code, Cursor or a ChatGPT connector, and by non-technical insurance people opening the site once to see whether their brand is there.

## Capabilities and Constraints

- Entries are ARD entries: `urn:air:<publisher-domain>:<namespace>:<name>`, IANA media type, `url` to the resource, representative queries, capabilities, plus `ofa:` terms.
- Ranking is lexical (weighted BM25-style over representative queries, name, capabilities, tags, description) with a relevance cutoff; scores are 0–100 relevance, never trust.
- Status vocabulary: `live` (endpoint answered MCP at last check), `demo` (publisher marks it a demonstration), `listing` (directory page, no endpoint).
- Undecided: domain (placeholder namespace `https://openfinancialagent.org/ns#`), domain verification method, scheduled crawl, embeddings ranking, federation to peer registries.
- Stack: Next.js 16 App Router, Bun, TypeScript strict, Tailwind 4, Biome. No database.

## Brand Commitments

- Name: Open Financial Agent (must contain "agent"; "OFA" as the short form in commands).
- Visual world, pinned by the founder on 2026-09-15: spare ("épuré"), OpenAI register, white only, no dark mode, fully monochrome (no colour, not even a status green), Inter for text and a monospace face for identifiers, commands and figures. The quality bar is openai.com and platform.openai.com.
- Voice: plain, declarative, no hype, no exclamation marks; French and Spanish content appears verbatim where providers speak those languages.

## Evidence on Hand

- 15 validated entries from 13 publishers, all WaniWani-hosted MCP servers that answered MCP on 2026-09-14 (Tuio ×2, Lassie, Simplis, CAP Insurance Group, Autocompara, Flitter, Fintonic, Bpifrance ×2, LegalPlace, Chubb, Europea Seguros, Mal Bazaar, Offre MRH Jeunes as demo). Real tool names in `capabilities`.
- A working `context` call: Tuio's FAQ answered a water-damage question through the registry in 2.3 s.
- Vendored ARD schemas and OpenAPI under `spec/ard/`.
- Absent, do not fabricate: customer logos with permission, testimonials, traffic numbers, external publishers hosting `ai-catalog.json`, a live domain.

## Product Principles

1. The index points, it never answers for a provider.
2. Relevance is not trust; say so wherever a score appears.
3. Publisher authority: an entry belongs to the domain in its URN.
4. Open standard first; where ARD is silent, document the choice and propose it upstream.
5. Neutral listing, free, first come first served.
