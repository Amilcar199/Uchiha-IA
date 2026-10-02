-- UCHIHA IA — esquema inicial. Versão de regras 1.0.0.
-- Aplicar no Supabase SQL editor ou via CLI de migrations.

create extension if not exists pgcrypto;

create type public.user_role as enum ('USER', 'MENTOR', 'ADMIN');
create type public.market_regime as enum ('REAL', 'OTC');
create type public.decision_state as enum ('OPERAR_COMPRA', 'OPERAR_VENDA', 'AGUARDAR', 'NAO_OPERAR');
create type public.reading_confidence as enum ('baixa', 'media', 'alta');
create type public.news_status as enum ('FREE', 'ATTENTION', 'BLOCKED');
create type public.outcome_follow as enum ('SEGUIU', 'NAO_SEGUIU');
create type public.outcome_result as enum ('GAIN', 'LOSS', 'NO_TRADE');
create type public.feedback_verdict as enum ('CORRETA', 'INCORRETA', 'PARCIAL');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null,
  role public.user_role not null default 'USER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  image_id text,
  asset text not null,
  market_regime public.market_regime not null,
  platform text,
  timeframe text not null,
  analysis_status text not null default 'COMPLETED',
  cycle text,
  trend text,
  decision public.decision_state not null,
  confidence public.reading_confidence not null,
  rule_version text not null,
  image_path text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.analysis_images (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table public.candles (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  index integer not null,
  open double precision not null,
  close double precision not null,
  high double precision not null,
  low double precision not null,
  body_size double precision not null,
  upper_wick double precision not null,
  lower_wick double precision not null,
  range double precision not null,
  color text not null,
  confidence double precision not null,
  created_at timestamptz not null default now()
);

create table public.market_contexts (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  cycle text,
  trend text not null,
  cycle_status text not null,
  created_at timestamptz not null default now()
);

create table public.markings (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  type text not null,
  price double precision,
  direction text,
  candle_index integer,
  confidence double precision,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.patterns (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  type text not null,
  direction text,
  confidence double precision,
  evidence jsonb not null default '[]'::jsonb,
  rule_id text,
  created_at timestamptz not null default now()
);

create table public.confluences (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  type text not null,
  direction text,
  weight double precision not null default 1,
  evidence text,
  rule_id text,
  created_at timestamptz not null default now()
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  state public.decision_state not null,
  confidence public.reading_confidence not null,
  explanation text not null,
  blockers jsonb not null default '[]'::jsonb,
  missing_conditions jsonb not null default '[]'::jsonb,
  rule_version text not null,
  created_at timestamptz not null default now()
);

create table public.rule_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  description text not null,
  created_at timestamptz not null default now()
);

create table public.rule_parameters (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null,
  version text not null,
  parameters jsonb not null,
  status text not null default 'PENDING_MENTOR_VALIDATION',
  created_at timestamptz not null default now()
);

create table public.rule_executions (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  rule_id text not null,
  rule_version text not null,
  triggered boolean not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create table public.analysis_outcomes (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  followed public.outcome_follow not null,
  result public.outcome_result not null,
  created_at timestamptz not null default now()
);

create table public.mentor_feedback (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  mentor_id uuid not null references auth.users (id) on delete cascade,
  verdict public.feedback_verdict not null,
  comment text not null default '',
  created_at timestamptz not null default now()
);

create table public.news_events (
  id uuid primary key default gen_random_uuid(),
  currency text not null,
  impact text not null,
  title text not null,
  event_time timestamptz not null,
  status public.news_status not null,
  source text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id),
  action text not null,
  target text not null,
  previous_version text,
  next_version text,
  created_at timestamptz not null default now()
);

insert into public.rule_versions (version, description)
values ('1.0.0', 'Fase 1: comando, taxa única, contexto por topos e fundos, gates de decisão.');

insert into public.rule_parameters (rule_key, version, parameters, status)
values
  ('wick_classification', '1.0.0', '{"longWickRatio": null, "smallWickRatio": null}'::jsonb, 'PENDING_MENTOR_VALIDATION'),
  ('defense_distance', '1.0.0', '{"defenseDistanceRatio": null, "proximityTolerance": null}'::jsonb, 'PENDING_MENTOR_VALIDATION'),
  ('news_window', '1.0.0', '{"newsBlockWindowMinutes": null}'::jsonb, 'PENDING_MENTOR_VALIDATION'),
  ('first_15_seconds', '1.0.0', '{"enabled": true, "windowSeconds": 15, "applicableTimeframes": ["M1"]}'::jsonb, 'PENDING_MENTOR_VALIDATION');

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid()
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 'USER');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.analysis_images enable row level security;
alter table public.candles enable row level security;
alter table public.market_contexts enable row level security;
alter table public.markings enable row level security;
alter table public.patterns enable row level security;
alter table public.confluences enable row level security;
alter table public.decisions enable row level security;
alter table public.analysis_outcomes enable row level security;
alter table public.mentor_feedback enable row level security;
alter table public.rule_versions enable row level security;
alter table public.rule_parameters enable row level security;
alter table public.rule_executions enable row level security;
alter table public.news_events enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_select on public.profiles
  for select using (user_id = auth.uid() or public.current_role() in ('MENTOR', 'ADMIN'));

create policy profiles_update_self on public.profiles
  for update using (user_id = auth.uid());

create policy analyses_owner on public.analyses
  for all using (user_id = auth.uid() or public.current_role() in ('MENTOR', 'ADMIN'))
  with check (user_id = auth.uid() or public.current_role() = 'ADMIN');

create policy images_owner on public.analysis_images
  for all using (user_id = auth.uid() or public.current_role() in ('MENTOR', 'ADMIN'))
  with check (user_id = auth.uid());

create policy candles_owner on public.candles
  for all using (
    exists (
      select 1 from public.analyses a
      where a.id = analysis_id
        and (a.user_id = auth.uid() or public.current_role() in ('MENTOR', 'ADMIN'))
    )
  );

create policy contexts_owner on public.market_contexts
  for all using (
    exists (
      select 1 from public.analyses a
      where a.id = analysis_id
        and (a.user_id = auth.uid() or public.current_role() in ('MENTOR', 'ADMIN'))
    )
  );

create policy markings_owner on public.markings
  for all using (
    exists (
      select 1 from public.analyses a
      where a.id = analysis_id
        and (a.user_id = auth.uid() or public.current_role() in ('MENTOR', 'ADMIN'))
    )
  );

create policy patterns_owner on public.patterns
  for all using (
    exists (
      select 1 from public.analyses a
      where a.id = analysis_id
        and (a.user_id = auth.uid() or public.current_role() in ('MENTOR', 'ADMIN'))
    )
  );

create policy confluences_owner on public.confluences
  for all using (
    exists (
      select 1 from public.analyses a
      where a.id = analysis_id
        and (a.user_id = auth.uid() or public.current_role() in ('MENTOR', 'ADMIN'))
    )
  );

create policy decisions_owner on public.decisions
  for all using (
    exists (
      select 1 from public.analyses a
      where a.id = analysis_id
        and (a.user_id = auth.uid() or public.current_role() in ('MENTOR', 'ADMIN'))
    )
  );

create policy outcomes_owner on public.analysis_outcomes
  for all using (user_id = auth.uid() or public.current_role() in ('MENTOR', 'ADMIN'))
  with check (user_id = auth.uid());

create policy feedback_read on public.mentor_feedback
  for select using (
    public.current_role() in ('MENTOR', 'ADMIN')
    or exists (select 1 from public.analyses a where a.id = analysis_id and a.user_id = auth.uid())
  );

create policy feedback_insert on public.mentor_feedback
  for insert with check (public.current_role() in ('MENTOR', 'ADMIN') and mentor_id = auth.uid());

create policy rules_read on public.rule_versions
  for select using (auth.uid() is not null);

create policy rules_admin on public.rule_versions
  for all using (public.current_role() = 'ADMIN')
  with check (public.current_role() = 'ADMIN');

create policy parameters_read on public.rule_parameters
  for select using (auth.uid() is not null);

create policy parameters_admin on public.rule_parameters
  for all using (public.current_role() = 'ADMIN')
  with check (public.current_role() = 'ADMIN');

create policy executions_owner on public.rule_executions
  for select using (
    exists (
      select 1 from public.analyses a
      where a.id = analysis_id
        and (a.user_id = auth.uid() or public.current_role() in ('MENTOR', 'ADMIN'))
    )
  );

create policy news_read on public.news_events
  for select using (auth.uid() is not null);

create policy audit_admin on public.audit_logs
  for select using (public.current_role() = 'ADMIN');

create policy audit_admin_insert on public.audit_logs
  for insert with check (public.current_role() = 'ADMIN');

insert into storage.buckets (id, name, public)
values ('analysis-images', 'analysis-images', false)
on conflict (id) do nothing;

create policy analysis_images_read on storage.objects
  for select using (
    bucket_id = 'analysis-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_role() in ('MENTOR', 'ADMIN')
    )
  );

create policy analysis_images_insert on storage.objects
  for insert with check (
    bucket_id = 'analysis-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy analysis_images_delete on storage.objects
  for delete using (
    bucket_id = 'analysis-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_role() = 'ADMIN'
    )
  );
