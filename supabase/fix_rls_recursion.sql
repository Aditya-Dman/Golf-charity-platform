-- One-time patch for existing Supabase project
-- Fixes: "infinite recursion detected in policy for relation profiles"

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

drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles"
  on public.profiles for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins manage charities" on public.charities;
create policy "Admins manage charities"
  on public.charities for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins manage subscriptions" on public.subscriptions;
create policy "Admins manage subscriptions"
  on public.subscriptions for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins manage scores" on public.scores;
create policy "Admins manage scores"
  on public.scores for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins manage draws" on public.draws;
create policy "Admins manage draws"
  on public.draws for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins manage winners" on public.winners;
create policy "Admins manage winners"
  on public.winners for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
