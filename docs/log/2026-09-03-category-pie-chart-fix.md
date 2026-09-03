# Category pie chart shows all categories with spend

- **Date:** 2026-09-03
- **Type:** feature
- **Status:** shipped

## Summary

Fixed the Patterns "By category" donut chart so newly created categories with expenses appear as their own slices instead of being hidden in a generic "Other" bucket.

## What changed

- `src/features/expenses/screens/InsightsPage.tsx` — show up to 12 category slices before grouping the tail; renamed the grouped bucket to "Other categories" so it no longer collides with the default category named "Other".
- `src/shared/ui/charts.tsx` — DonutChart legend and paths use index-based keys so duplicate labels cannot drop slices from the UI.

## Why / rejected

The chart previously kept only the top six categories and lumped the rest into a slice labeled "Other", which also conflicted with the seeded "Other" category and caused React key collisions in the legend.
