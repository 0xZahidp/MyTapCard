
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  theme text not null default 'system' check (theme in ('system','light','dark')),
  public_enabled boolean not null default true,
  branding_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (public_enabled = true or auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Username format check
alter table public.profiles
  add constraint username_format check (username is null or username ~ '^[a-zA-Z0-9_]{3,30}$');

-- Link groups
create table public.link_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  position int not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.link_groups enable row level security;

create policy "Link groups viewable for public profiles"
  on public.link_groups for select
  using (
    exists (select 1 from public.profiles p where p.id = user_id and (p.public_enabled = true or p.id = auth.uid()))
  );

create policy "Owner manages link groups"
  on public.link_groups for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Links
create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid references public.link_groups(id) on delete cascade,
  label text not null default '',
  type text not null default 'url' check (type in ('url','phone','email','sms','social')),
  platform text,
  value text not null default '',
  position int not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.links enable row level security;

create policy "Links viewable for public profiles"
  on public.links for select
  using (
    exists (select 1 from public.profiles p where p.id = user_id and (p.public_enabled = true or p.id = auth.uid()))
  );

create policy "Owner manages links"
  on public.links for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();
