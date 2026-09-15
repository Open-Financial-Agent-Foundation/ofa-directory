# Publish your catalog

Two ways in. Both end with your entries searchable by every agent connected to Open Financial Agent, and by any other ARD registry that crawls you.

## Option A: host `ai-catalog.json` on your domain

This is the ARD way, and the one that makes you discoverable everywhere, not only here.

1. Create `https://<your-domain>/.well-known/ai-catalog.json`. It must return `200`, `Content-Type: application/json`, no redirects, no auth.
2. Add a discovery hint: `<link rel="ai-catalog" href="/.well-known/ai-catalog.json">` in your HTML head, and `Agentmap: https://<your-domain>/.well-known/ai-catalog.json` in `robots.txt`.
3. Open a pull request adding your domain to `registry/sources.json`. The crawler fetches, validates, and writes the catalog under `registry/crawled/`.

Every entry's `identifier` must start with `urn:air:<your-domain>:`. The crawler rejects a catalog that claims another publisher (ARD §4.5.1).

## Option B: send the file as a pull request

Add `registry/publishers/<your-domain>.json` with the same content. A steward can do this for you while you set up the well-known path. Entries added this way carry `metadata.steward`.

## The file

```json
{
  "specVersion": "1.0",
  "@context": { "ofa": "https://openfinancialagent.org/ns#" },
  "host": {
    "displayName": "Acme Seguros",
    "identifier": "acme-seguros.es",
    "documentationUrl": "https://acme-seguros.es/agents"
  },
  "entries": [
    {
      "identifier": "urn:air:acme-seguros.es:agent:hogar",
      "displayName": "Acme seguro de hogar",
      "type": "application/mcp-server-card+json",
      "url": "https://agents.acme-seguros.es/mcp",
      "description": "Quotes home insurance in Spain and answers coverage questions from the general conditions.",
      "capabilities": ["quote_home", "search_conditions"],
      "representativeQueries": [
        "¿cuánto cuesta asegurar mi piso?",
        "home insurance quote in Spain",
        "does the policy cover water damage"
      ],
      "ofa:sector": ["insurance"],
      "ofa:lineOfBusiness": ["home"],
      "ofa:role": ["carrier"],
      "ofa:actions": ["quote", "faq"],
      "ofa:country": ["ES"],
      "ofa:languages": ["es", "en"],
      "ofa:status": "live"
    }
  ]
}
```

### Required on every entry (ARD §4.2)

| Term | Rule |
| --- | --- |
| `identifier` | `urn:air:<publisher-domain>:<namespace>:<name>` |
| `displayName` | Human-readable name |
| `type` | IANA media type: `application/mcp-server-card+json`, `application/a2a-agent-card+json`, `application/openapi+json`, `application/ai-skill+md`, `text/html` |
| `url` or `data` | Exactly one. `url` points at the resource (an MCP endpoint, an agent card, an OpenAPI document) |

### What makes it findable

`representativeQueries` is the ranking surface. Write two to five queries phrased as your customers ask, in the languages they use. An entry without them validates but ranks on its name and description alone; the validator warns.

`capabilities` should list the tool names your server exposes. Agents filter on them before connecting.

The `ofa:` terms drive the facets and every country or sector filter. See [the vocabulary](/docs/vocabulary).

## Validate locally

```bash
git clone https://github.com/Open-Financial-Agent-Foundation/ofa-directory
cd open-financial-agent && bun install
bun run validate
```

The validator checks the schema, identifier uniqueness and publisher binding, and warns on missing representative queries. CI runs the same command on every pull request.

## Trust

v0 records who submitted an entry (`metadata.steward`) and whether the endpoint answered MCP at the last check (`ofa:status`). Domain verification (DNS record or signed `trustManifest`) is the next milestone; until then a listing means "this exists and answers", not "Open Financial Agent vouches for it".
