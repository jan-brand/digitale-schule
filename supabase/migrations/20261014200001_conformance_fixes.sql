-- Campus Foundation v0.1 — small doc/DATA_MODEL.md conformance fixes found
-- during the pre-M4 compliance pass. Both are additive, nullable-safe
-- columns; no backfill risk.

alter table public.school_years add column status text not null default 'active';

alter table public.user_preferences add column locale text not null default 'de-DE';
