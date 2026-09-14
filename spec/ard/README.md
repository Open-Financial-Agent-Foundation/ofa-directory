# Vendored ARD schemas

Copied from https://github.com/ards-project/ard-spec (`spec/schemas/`, Apache-2.0), specification v0.91.
FinCommons validates every registry file against `ai-catalog.schema.json` and `ard-entry.schema.json` in CI (`bun run validate`).
Re-vendor by running `bun run spec:sync`.
