# Product log

Chronological record of **product decisions** and **features shipped** after the locked architecture ADRs.

[`../DECISIONS.md`](../DECISIONS.md) is the source of truth for stack, tenancy, money, LLM, and sync. Do not copy those ADRs here. Link `Dxx` when a log entry depends on one.

## When to read

Before implementing a feature or changing product behavior, read [`INDEX.md`](INDEX.md) and any related entry files.

## When to write

After shipping (same session), add a new file and update the index. Do not wait to be asked. No secrets (API keys, `.env`).

## File name

`YYYY-MM-DD-short-slug.md` using the session calendar date (ISO). Newest entries first in the index.

## Entry template

```markdown
# Title

- **Date:** YYYY-MM-DD
- **Type:** decision | feature
- **Status:** shipped | intent

## Summary

1–3 sentences.

## What changed

- Paths, UX, data.

## Why / rejected

Only if this is a decision. Otherwise omit.

## Follow-ups

Optional.
```
