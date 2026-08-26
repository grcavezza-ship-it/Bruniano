-- Bruniano mini-CMS schema
-- Run in Supabase SQL editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  specialty text,
  bio text,
  photo_url text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  media_type text not null check (media_type in ('image','video')),
  media_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  starts_at date,
  ends_at date,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_url text,
  category text,
  meta_description text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.team_members enable row level security;
alter table public.gallery_items enable row level security;
alter table public.promotions enable row level security;
alter table public.blog_posts enable row level security;
alter table public.settings enable row level security;

-- Public read access only for published content.
create policy "public read published team" on public.team_members for select using (is_published = true);
create policy "public read published gallery" on public.gallery_items for select using (is_published = true);
create policy "public read active promotions" on public.promotions for select using (is_published = true and (starts_at is null or starts_at <= current_date) and (ends_at is null or ends_at >= current_date));
create policy "public read published blog" on public.blog_posts for select using (is_published = true);

-- Admin writes should be performed only by authenticated users with appropriate roles.
-- Tighten these policies in the Supabase dashboard using your chosen admin role.

create index if not exists team_members_sort_idx on public.team_members(sort_order);
create index if not exists gallery_sort_idx on public.gallery_items(sort_order);
create index if not exists promotions_dates_idx on public.promotions(starts_at, ends_at);
create index if not exists blog_published_idx on public.blog_posts(is_published, published_at desc);

insert into public.settings(key,value) values
('contact', jsonb_build_object('address','Via Nazionale delle Puglie, 283','city','San Vitaliano (NA)','whatsapp','393343755885','phone','390812352977'))
on conflict (key) do nothing;
