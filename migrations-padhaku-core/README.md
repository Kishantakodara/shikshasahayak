# ShikshaSahayak Core DB Migrations (`PADHAKU_CORE_DB`)

Target Database: `shiksha-core-db` (`4e63a42b-1271-462f-8271-da47cf659139`)  
Configuration Binding: `PADHAKU_CORE_DB` in `wrangler.toml`

## Migration Inventory

- `0001_initial_schema.sql`: Core application schema (57 tables, 67 indexes).
- `0002_seed_from_keydocs.sql`: Historical bootstrap seed data (2,394 statements across 21 tables). **Must not be replayed against production.**
- `0004_prep_zone_expansion.sql`: Prep Zone & Career Ecosystem tables (21 tables, 12 indexes).

## Note on Migration 0003
Migration `0003_update_gtu_pyq_links.sql` targeted GTU exam archive tables (`gtu_question_papers`, `gtu_paper_registry`) that belong exclusively to the `keydocs` database (`DB`). It has been relocated to `migrations-keydocs/` to prevent cross-database execution failures on `PADHAKU_CORE_DB`.
Wrangler 4.x supports numerical gaps natively; the sequence `0001` -> `0002` -> `0004` is fully supported. Future migrations must begin with `0005_...`.
