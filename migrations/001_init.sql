create table if not exists items(
    id serial primary key,
    user_id int not null,
    name text not null,
    type text,
    year int,
    score numeric(3,1),
    tag text not null default '想看',
    status text,
    created_at timestamptz not null default now()
);