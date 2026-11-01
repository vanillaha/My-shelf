create extension if not exists pg_trgm;
create index if not exists idx_items_name_trgm on items using gin (name gin_trgm_ops);