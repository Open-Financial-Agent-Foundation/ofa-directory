# FinCommons

FinCommons is an open registry of financial-services capabilities for AI agents: which insurer can quote home cover in Spain, which lender simulates a personal loan, which public bank explains its financing programs. Providers publish what their agents can do; agents ask one place, get ranked matches, and connect to the provider directly.

It conforms to [Agentic Resource Discovery](https://github.com/ards-project/ard-spec) (ARD v0.91), the open specification Google, Microsoft, GitHub and others published in June 2026. FinCommons adds a small vocabulary for finance (`fc:`) and a hosted index so nobody has to crawl the web themselves.

Use it through the public MCP server or the REST API. Neither needs an API key.

- MCP server: `{{SITE_URL}}/mcp` (Streamable HTTP, stateless)
- REST API: `{{SITE_URL}}/api/v1`
- Catalog: `{{SITE_URL}}/.well-known/ai-catalog.json`

## How discovery works

1. **Route the need.** An agent sends the user's need in plain words, optionally with filters (country, sector, action).
2. **Rank the entries.** The index scores every entry on its representative queries, name, capabilities, tags and description, then applies the filters. Scores are relevance, never trust.
3. **Return entries, not answers.** Each result is an ARD entry: an identifier, a type, and a `url` the agent connects to with the resource's native protocol (MCP, A2A, OpenAPI).

One operation goes further. `context` takes a factual question, asks the matching providers' own MCP servers through their knowledge tools, and returns their answers with the source. FinCommons never answers a product question itself.

## Choose an operation

| Operation | Use it when | Where |
| --- | --- | --- |
| `search` | You need providers ranked for a task | MCP tool, `POST /search` |
| `explore` | You want facet counts (what exists, where) | MCP tool, `POST /explore` |
| `get_entry` | You have an identifier and need the full record | MCP tool, `GET /entries/{id}` |
| `context` | The user asked a factual question a provider can answer | MCP tool only |
| `agents` | You want a deterministic, cacheable listing | `GET /agents` |

## What is indexed

Three origins, all plain JSON files in the [repository](https://github.com/fincommons/fincommons):

- **Publisher catalogs** (`registry/publishers/`): one `ai-catalog.json` per publisher domain, maintained by the publisher or a steward through pull requests.
- **Crawled catalogs** (`registry/crawled/`): fetched from `https://<domain>/.well-known/ai-catalog.json` for every domain in `registry/sources.json`.
- **Listings** (`registry/listings/`): directory pages (ChatGPT apps, Claude connectors) for providers that have an agent but no published catalog yet. Type `text/html`, status `listing`.

## Related pages

- [Connect an agent](/docs/connect)
- [MCP server reference](/docs/mcp)
- [REST API reference](/docs/rest-api)
- [Publish your catalog](/docs/publish)
- [The fc: vocabulary](/docs/vocabulary)
- [Governance](/docs/governance)
