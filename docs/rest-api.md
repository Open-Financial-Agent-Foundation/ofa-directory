# REST API

Base URL: `{{SITE_URL}}/api/v1`. The API follows the ARD registry interface (`spec/ard/ard.openapi.yaml` in the repository). All endpoints allow cross-origin requests and need no key.

## `POST /search`

Required by ARD. Ranks entries by relevance to `query.text`, then applies `query.filter`.

```bash
curl -X POST {{SITE_URL}}/api/v1/search \
  -H "content-type: application/json" \
  -d '{
    "query": {
      "text": "personal loan simulation",
      "filter": { "fc:country": ["ES"] }
    },
    "federation": "none",
    "pageSize": 5
  }'
```

| Field | Type | Notes |
| --- | --- | --- |
| `query.text` | string | Required. |
| `query.filter` | object | Optional. Term path to string or array. OR within a key, AND across keys. |
| `query.@context` | object | Optional. Prefix bindings for namespaced filter keys. `fc` is bound by default. |
| `federation` | string | `auto` (default), `referrals`, `none`. v0 holds no upstream registries, so the three behave alike. |
| `pageSize` | integer | 1–100, default 10. |
| `pageToken` | string | From the previous response. |

Response:

```json
{
  "results": [
    {
      "identifier": "urn:air:fintonic.com:agent:personal-loan",
      "displayName": "Fintonic personal loans",
      "type": "application/mcp-server-card+json",
      "url": "https://fintonic.vercel.app/mcp",
      "publisher": "fintonic.com",
      "score": 91,
      "source": "{{SITE_URL}}/api/v1"
    }
  ],
  "total": 1
}
```

`score` is semantic relevance from 0 to 100. It is not a trust, compliance or safety rating.

## `POST /explore`

Facet aggregation over the matched set. `query` is optional; without it the aggregation covers the whole index.

```bash
curl -X POST {{SITE_URL}}/api/v1/explore \
  -H "content-type: application/json" \
  -d '{ "resultType": { "facets": [ { "field": "fc:sector" }, { "field": "fc:country", "limit": 50 } ] } }'
```

```json
{
  "resultType": "facets",
  "matched": 15,
  "facets": {
    "fc:sector": { "buckets": [ { "value": "insurance", "count": 11 } ] }
  }
}
```

## `GET /agents`

Deterministic, cacheable listing. No relevance ranking.

```text
GET /api/v1/agents?filter=fc:country=FR;fc:actions=quote&orderBy=displayName&pageSize=20
```

| Parameter | Notes |
| --- | --- |
| `filter` | `key=v1,v2;key2=v3`. Commas OR, semicolons AND. |
| `orderBy` | `displayName` (default) or `updatedAt`, optionally followed by ` desc`. |
| `pageSize` | 1–100, default 20. |
| `pageToken` | From the previous response. |

## `GET /entries/{identifier}`

The complete entry for one identifier, URL-encoded. ARD leaves this operation out of scope; every client needs it, so FinCommons provides it.

```text
GET /api/v1/entries/urn%3Aair%3Atuio.com%3Aagent%3Ahome-insurance
```

## Errors

| Status | Code | Meaning |
| --- | --- | --- |
| `400` | `INVALID_ARGUMENT` | The body or a parameter is malformed. |
| `404` | `NOT_FOUND` | No entry with that identifier. |
| `429` | `RESOURCE_EXHAUSTED` | Rate limit reached. |
| `500` | `INTERNAL` | The registry could not complete the request. |

Errors use the ARD envelope: `{ "error": { "code": "...", "message": "..." } }`.
