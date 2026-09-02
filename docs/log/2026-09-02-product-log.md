# Timestamped product log under docs/log

- **Date:** 2026-09-02
- **Type:** decision
- **Status:** shipped

## Summary

Product decisions and shipped features are recorded as dated files in `docs/log/`. Locked architecture stays in `DECISIONS.md`. Agents must read the index before new product work and append after shipping.

## What changed

- [`docs/log/`](README.md) — README, INDEX, entry files.
- [`.cursor/rules/decision-log.mdc`](../../.cursor/rules/decision-log.mdc) — always-on.
- [`docs/README.md`](../README.md) — pointer to the log.

## Why / rejected

A single growing ADR file is the wrong shape for a dated changelog. The log is in git (not ignored) so every session can read it.

## Follow-ups

None.
