# FinCommons

The open index of financial services for AI agents.

Insurers, banks, lenders and public financiers publish what their agents can do. Personal agents (Muse, Grok, Claude, ChatGPT, anything that speaks MCP or HTTP) ask one place who can quote, compare, explain or apply, then connect to the provider directly.

FinCommons is a registry conforming to [Agentic Resource Discovery](https://github.com/ards-project/ard-spec) (ARD v0.91), with a finance vocabulary (`fc:`), a public MCP server, a REST API, and a website. The registry itself is a folder of JSON files in this repository: adding a provider is a pull request.

- Website and index: https://fincommons.org
- MCP: `https://fincommons.org/mcp`
- REST: `https://fincommons.org/api/v1`
- Catalog: `https://fincommons.org/.well-known/ai-catalog.json`

## Connect an agent

```bash
claude mcp add --transport http fincommons https://fincommons.org/mcp
```

Tools: `search`, `explore`, `get_entry`, `context`. See [docs/mcp.md](docs/mcp.md).

## Publish a provider

Host `/.well-known/ai-catalog.json` on your domain and add the domain to `registry/sources.json`, or send the file as `registry/publishers/<domain>.json`. See [docs/publish.md](docs/publish.md).

## Run it

```bash
bun install
bun run dev          # http://localhost:3000
bun run validate     # schema, identifier uniqueness, publisher binding
bun run typecheck
bun run crawl        # fetch every domain in registry/sources.json
bun run import:directories <export.json>   # ChatGPT apps / Claude connectors listings
```

## Layout

```
registry/publishers/   one ai-catalog.json per publisher domain (PRs)
registry/crawled/      catalogs fetched from publishers' well-known paths
registry/listings/     directory pages for providers without a catalog yet
registry/sources.json  domains the crawler visits
spec/ard/              vendored ARD schemas and OpenAPI (Apache-2.0)
docs/                  the documentation, rendered at /docs
scripts/               validate, crawl, import, spec-sync
src/lib/registry/      loader, ranking, facets, term resolution, context federation
src/app/api/v1/        POST /search, POST /explore, GET /agents, GET /entries/{id}
src/app/mcp/           the MCP server
src/app/.well-known/   FinCommons' own catalog
```

## Governance

Apache-2.0. Publisher authority over entries, stewards for hosted agents, maintainers from more than one organisation before v1. See [docs/governance.md](docs/governance.md) and [CONTRIBUTING.md](CONTRIBUTING.md).
