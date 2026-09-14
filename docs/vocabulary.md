# The fc: vocabulary

ARD lets a registry add terms through JSON-LD namespaces. FinCommons defines one, `https://fincommons.org/ns#`, bound to the prefix `fc` in every catalog file and in every query by default. Any term below is a filter key and a facet.

| Term | Values | Meaning |
| --- | --- | --- |
| `fc:sector` | `insurance`, `banking`, `lending`, `payments`, `wealth`, `pensions`, `legal`, `public-finance` | The regulated activity the resource belongs to. |
| `fc:lineOfBusiness` | free text, lowercase, hyphenated | Product line: `home`, `auto`, `pet`, `travel`, `health`, `life`, `funeral`, `professional-liability`, `personal-loan`, `mortgage`, `business-financing`, `company-formation`… |
| `fc:role` | `carrier`, `broker`, `comparator`, `mga`, `bank`, `fintech`, `public-body`, `service-provider` | Who the publisher is in the value chain. |
| `fc:actions` | `quote`, `bind`, `compare`, `faq`, `claim`, `callback`, `simulate`, `apply`, `search` | What an agent can get done through the resource. |
| `fc:country` | ISO 3166-1 alpha-2, uppercase | Where the product is sold. Omit when the provider sells by residency across many countries. |
| `fc:languages` | BCP 47 (`fr`, `pt-BR`) | Languages the resource answers in. |
| `fc:regulator` | free text (`ACPR`, `DGSFP`, `FCA`) | Supervising authority, when the publisher states it. |
| `fc:hostedBy` | domain | The platform running the endpoint on the publisher's behalf, when it is not the publisher. |
| `fc:status` | `live`, `demo`, `listing` | `live`: endpoint answered MCP at the last check. `demo`: the publisher marks it a demonstration. `listing`: a directory page with no endpoint of its own. |

## Actions, defined

- **quote**: returns a price or an indicative price for a product from user inputs.
- **bind**: completes purchase of a policy or product. None of the v0 entries do this; binding happens on the provider's site.
- **compare**: returns offers from several carriers or products.
- **faq**: answers questions from the provider's knowledge base or documents. `context` calls these.
- **claim**: opens or tracks a claim.
- **callback**: records a request for a human to call back.
- **simulate**: projects a repayment, return or cost without a binding offer.
- **apply**: starts an application or a dossier (a loan, a company formation, a financing program).
- **search**: searches the provider's catalog or documents, without answering.

## Using a term in a query

Filter keys resolve to IRIs. All of these mean the same thing:

```json
{ "query": { "text": "…", "filter": { "fc:country": ["ES"] } } }
{ "query": { "text": "…", "filter": { "https://fincommons.org/ns#country": ["ES"] } } }
{ "query": { "@context": { "fin": "https://fincommons.org/ns#" }, "text": "…", "filter": { "fin:country": ["ES"] } } }
```

## Proposing a term

Open an issue titled `vocabulary: <term>` with the definition, the value set, and two entries that would use it. Adding an enum value is a non-normative change and merges by pull request; a new term waits for a second maintainer's review.
