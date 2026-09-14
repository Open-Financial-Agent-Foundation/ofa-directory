# Governance

FinCommons is an open project. The registry data, the vocabulary and the code are Apache-2.0 and live in one repository. Anyone can read, fork, run their own copy, or propose a change.

## Principles

- **The index points, it does not answer.** Every result is an entry that leads to a provider's own endpoint. Product answers come from providers.
- **Relevance is not trust.** Scores rank fit to a query. Trust comes from domain ownership and, later, verified manifests.
- **Publisher authority.** An entry belongs to the domain in its URN. Only that domain, or a steward on record, can change it.
- **Open standard first.** FinCommons follows ARD as published. Where ARD is silent (fetching one entry, finance terms), FinCommons documents its choice and proposes it upstream.
- **Neutral listing.** Listing is free, first come first served, and never conditioned on a commercial relationship with a maintainer.

## Roles

| Role | Who | Can |
| --- | --- | --- |
| Publisher | The domain owner | Add, change, remove its own entries |
| Steward | A maintainer or a platform hosting agents for publishers | Submit entries on a publisher's behalf, marked `metadata.steward` |
| Maintainer | Named in `MAINTAINERS.md` | Merge pull requests, run the crawler, cut releases |

WaniWani bootstrapped the project and stewards the first entries. The intent is a maintainer group with at least three organisations before v1.

## Changes

- **Registry data**: pull request, one maintainer review, CI green (`bun run validate`).
- **Vocabulary values**: pull request with an issue reference, one review.
- **Vocabulary terms, API shape, ranking**: issue first, then pull request, two reviews from different organisations.

## Removal

A publisher can remove its entries at any time by pull request. Maintainers remove entries whose endpoint has failed for 30 consecutive days, marking them `demo` first for 7 days, and any entry that misrepresents its publisher.

## Roadmap to v1

1. Domain verification: a DNS TXT record or a signed `trustManifest` per publisher.
2. Scheduled crawl of `registry/sources.json` with status updates.
3. Federation: `referrals` to peer ARD registries, and answering their queries.
4. Semantic ranking with embeddings, alongside the lexical ranking.
5. A conformance badge for publishers whose catalog passes validation.
