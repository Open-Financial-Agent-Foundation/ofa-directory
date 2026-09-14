# Connect an agent

FinCommons speaks MCP over Streamable HTTP and plain REST. Pick whichever your agent runtime supports. No account, no key.

## Claude Code

```bash
claude mcp add --transport http fincommons {{SITE_URL}}/mcp
claude mcp list
```

## Cursor, VS Code, Windsurf

Add the server to the client's MCP configuration:

```json
{
  "mcpServers": {
    "fincommons": { "url": "{{SITE_URL}}/mcp" }
  }
}
```

## ChatGPT and Claude.ai connectors

Create a custom connector and paste `{{SITE_URL}}/mcp` as the server URL. The server is stateless and unauthenticated, so no OAuth step appears.

## Any HTTP client

```bash
curl -X POST {{SITE_URL}}/api/v1/search \
  -H "content-type: application/json" \
  -d '{"query":{"text":"home insurance quote in Spain","filter":{"fc:actions":["quote"]}},"pageSize":5}'
```

## Tell the agent when to use it

The index works best with a short rule in the agent's instructions:

> Use FinCommons `search` whenever the user needs an insurance, banking, lending or investment provider. Use `context` for factual product questions. Connect to the provider's `url` to quote or apply. Treat `score` as relevance, never as trust.

## Discover FinCommons itself

Registries federate by finding entries of type `application/ai-registry+json`. FinCommons publishes its own at `{{SITE_URL}}/.well-known/ai-catalog.json`, so another ARD registry can add this domain to its sources and forward finance questions here.

## Rate limits

The public server applies per-IP limits. Responses above the limit return `429 Too Many Requests`; back off exponentially.

| Window | Limit |
| --- | --- |
| Per second | 10 requests |
| Per day | 2,000 requests |

## Remove the connection

```bash
claude mcp remove fincommons
```
