create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'subscriber' check (role in ('subscriber', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  image_url text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  plan_type text not null check (plan_type in ('monthly', 'yearly')),
  status text not null check (status in ('active', 'inactive', 'canceled', 'lapsed')),
  renewal_date date,
  charity_id uuid references public.charities(id),
  charity_percent numeric(5,2) not null default 10 check (charity_percent >= 10 and charity_percent <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score int not null check (score >= 1 and score <= 45),
  score_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  month_key text not null unique,
  draw_numbers int[] not null,
  mode text not null check (mode in ('random', 'weighted')),
  status text not null check (status in ('simulated', 'published')),
  jackpot_rollover numeric(12,2) not null default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier int not null check (tier in (3,4,5)),
  match_count int not null check (match_count in (3,4,5)),
  amount numeric(12,2) not null default 0,
  proof_url text,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);

create index if not exists idx_scores_user_date on public.scores(user_id, score_date desc, created_at desc);
create index if not exists idx_winners_draw on public.winners(draw_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'subscriber')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.trim_scores_to_latest_five()
returns trigger
language plpgsql
as $$
begin
  delete from public.scores
  where id in (
    select id
    from public.scores
    where user_id = new.user_id
    order by score_date desc, created_at desc
    offset 5
  );
  return new;
end;
$$;

drop trigger if exists trg_trim_scores on public.scores;
create trigger trg_trim_scores
  after insert on public.scores
  for each row execute procedure public.trim_scores_to_latest_five();

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = uid and role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.scores enable row level security;
alter table public.charities enable row level security;
alter table public.draws enable row level security;
alter table public.winners enable row level security;

create policy "Profiles readable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Subscriber reads own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Subscriber upserts own subscription"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Subscriber updates own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id);

create policy "Subscriber manages own scores"
  on public.scores for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Subscribers read own winners"
  on public.winners for select
  using (auth.uid() = user_id);

create policy "Everyone reads charities"
  on public.charities for select using (true);

create policy "Subscribers read published draws"
  on public.draws for select using (status = 'published');

create policy "Admins manage profiles"
  on public.profiles for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins manage charities"
  on public.charities for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins manage subscriptions"
  on public.subscriptions for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins manage scores"
  on public.scores for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins manage draws"
  on public.draws for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins manage winners"
  on public.winners for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

insert into public.charities(name, description, featured)
values
  ('First Tee Futures', 'Supporting junior golfers from underserved communities.', true),
  ('Green Fairways Foundation', 'Accessible golf opportunities and equipment support.', false),
  ('Swing for Hope', 'Funding community health and sports wellbeing initiatives.', false)
on conflict do nothing;
