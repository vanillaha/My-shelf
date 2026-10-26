create table if not exists users(
    id serial primary key,
    email text unique not null,
    pw_hash text not null,
    created_at timestamptz not null default now()
);
alter table items add column if not exists user_id int;