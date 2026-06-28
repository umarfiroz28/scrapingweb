create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  city text not null,
  product_type text not null,
  quantity integer default 1,
  product_age text,
  image_url text,
  telegram_status text default 'pending',
  email_status text default 'pending',
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "Anyone can create leads"
on public.leads
for insert
to anon
with check (true);

create policy "Lead owners cannot read public leads"
on public.leads
for select
to anon
using (false);

insert into storage.buckets (id, name, public)
values ('lead-images', 'lead-images', true)
on conflict (id) do nothing;

create policy "Anyone can upload lead images"
on storage.objects
for insert
to anon
with check (bucket_id = 'lead-images');
