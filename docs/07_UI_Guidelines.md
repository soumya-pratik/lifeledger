# 07 — UI guidelines

## Design system (de facto)

- **Background:** `ink-900` `#0b1220`; cards `ink-800` `#121b2e`.
- **Text:** slate-100 titles, slate-400 labels, slate-500 hints, rose-300 errors, amber-200 warnings, sky-200/300 actions, emerald-300 confirm.
- **Accent button:** `bg-sky-400` on `text-ink-950`, rounded-xl, full width for primary actions.
- **Radius:** 2xl cards, full nav pills, xl inputs.
- **Type:** DM Sans via Google Fonts; 11px uppercase tracking for kicker “LifeLedger”.
- **Numbers:** `tabular-nums` + `formatInr` (`en-IN` grouping, always two decimal places).

No light theme. No animation library.

## Layout hierarchy

1. Viewport `min-h-dvh`
2. `Shell`: `max-w-lg mx-auto px-4 pt-6 pb-8` (phone-first; laptop is a narrow column)
3. Header (product + ledger)
4. Nav
5. Page `space-y-*` sections

Safe area: `viewport-fit=cover` in HTML; no extra env(safe-area) padding yet.

## Responsive behavior

Single column. Do not build a desktop multi-pane until needed. Touch targets: Keep/Skip text buttons are small — acceptable MVP, enlarge if household testing fails.

## Forms

- Labels: `text-xs text-slate-400` wrapping controls
- Controls: `bg-ink-900 ring-1 ring-white/10 rounded-xl px-3 py-2`
- Amount: `inputMode="decimal"`, placeholder `185.50`
- File: styled `file:` sky chip

## Lists / tables

Not HTML tables. Unordered lists with `divide-y divide-white/5` on `bg-ink-800`.

## Modals / notifications

None. Inline messages. Pending imports use an amber ring card, not a modal.

## Empty states

One-line `text-sm text-slate-500` (e.g. “No manual expenses yet.”).

## Accessibility (current)

Native label wrapping, select/options, date input. Contrast is dark-theme typical. No explicit aria-live for errors. Recreate with the same native controls; do not use clickable divs for Keep/Skip (current uses `button`).

## Content copy rules

- Wizard must name the **active ledger** when importing (page header already shows it).
- LLM review helper text must say aggregates are sent, not the raw statement.
- Credits-skipped behavior should stay documented on the import page.
