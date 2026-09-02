# LifeLedger documentation set

**Running product log:** [`log/INDEX.md`](log/INDEX.md) — timestamped decisions and features. Read it before new product work; append after shipping. How to write: [`log/README.md`](log/README.md).

Locked architecture ADRs: [`DECISIONS.md`](DECISIONS.md) (not a dated changelog).

Read in this order if recreating the app:

1. `00_Project_Overview.md` — why it exists, what ships, what does not
2. `DECISIONS.md` — locked architecture choices and rejected alternatives
3. `log/` — what shipped after those ADRs (newest first in the index)
4. `01_Architecture.md` — modules, data flow, tenancy
5. `08_Data_Models.md` — types and Dexie/Postgres mapping
6. `03_Features.md` + `09_Workflows.md` — behavior
7. `10_Rebuild_Roadmap.md` + `AI_HANDOFF.md` — implementation order and acceptance tests

Remaining files cover structure, APIs, UI, state, and components.
