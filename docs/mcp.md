# MCP server

Connect to `{{SITE_URL}}/mcp`. The server implements ARD §5.3.5 (protocol wrapper): the tools return the same entry model as the REST API.

## Protocol behavior

- Stateless Streamable HTTP. Send each JSON-RPC request as an HTTP `POST`.
- One request per HTTP call. Batching is not supported.
- No session id is issued or expected. `GET` and `DELETE` return `405`.
- Responses are plain JSON (`application/json`); clients that only accept `text/event-stream` still work.

## Tools

### `search`

Rank entries against a natural-language need.

| Input | Type | Notes |
| --- | --- | --- |
| `query` | string | Required. The user's need in their own words. |
| `filter` | object | Optional. Keys are term paths, values a string or array. AND across keys, OR within a key. |
| `pageSize` | integer | Optional, 1–50, default 10. |
| `pageToken` | string | Optional, from a previous page. |

Returns `results[]` (each an entry with `publisher`, `score` 0–100 and `source`), `total`, and `pageToken` when more pages exist. The text content is a compact list; `structuredContent` carries the full objects.

```json
{ "query": "insure my dog", "filter": { "ofa:country": ["SE", "ES"] }, "pageSize": 5 }
```

### `explore`

Facet counts over the matched set. Call with no arguments for the whole index.

| Input | Type | Notes |
| --- | --- | --- |
| `query` | string | Optional. Narrows the matched set by relevance. |
| `filter` | object | Optional. Same shape as `search`. |
| `facets` | string[] | Optional. Term paths; default `ofa:sector`, `ofa:lineOfBusiness`, `ofa:country`, `type`, `publisher`, `ofa:actions`, `ofa:status`. |

### `get_entry`

| Input | Type | Notes |
| --- | --- | --- |
| `identifier` | string | `urn:air:<publisher>:<namespace>:<name>` |

Returns the full entry plus its `host` block.

### `context`

Ask the providers that can answer. The index ranks entries of type `application/mcp-server-card+json` with a live `url`, connects to the top ones, calls a knowledge tool (`search`, `faq`, `ask_*`, `explain_*`, `*_info`) with the question, and returns each answer under a heading with its source. Providers that only expose quote flows report "no knowledge tool".

| Input | Type | Notes |
| --- | --- | --- |
| `query` | string | Required. A factual question. |
| `filter` | object | Optional. Narrow to a country or sector first; it saves calls. |
| `maxSources` | integer | Optional, 1–5, default 3. |

Output is Markdown, one section per provider:

```text
### Tuio home insurance
Source: https://tuio-mcp.vercel.app/mcp (tool: search_faq)
Entry: urn:air:tuio.com:agent:home-insurance

Relevant passages from the provider appear here.

--------------------------------
```

`context` never starts a quote or an application. For that, connect to the entry's `url`.

## Filter keys

Any term an entry carries is a filter key: core ARD terms (`type`, `tags`, `capabilities`, `version`), the derived `publisher`, literal paths into `metadata.*`, and the [ofa: vocabulary](/docs/vocabulary). Unknown keys match nothing rather than erroring.
