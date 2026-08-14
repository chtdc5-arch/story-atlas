-- 卷宗台第一版資料庫草圖（Supabase / PostgreSQL）

create table works (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  title text not null,
  synopsis text default '',
  status text not null default 'idea' check (status in ('idea','writing','serializing','paused','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table episodes (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references works(id) on delete cascade,
  episode_number integer not null,
  title text not null,
  status text not null default 'outline' check (status in ('outline','draft','revising','final','published')),
  hook text default '',
  logic_check text default '',
  unique(work_id, episode_number)
);

create table content_versions (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  format text not null check (format in ('outline','novel','comic','video')),
  version_number integer not null,
  title text default '',
  content jsonb not null default '{}'::jsonb,
  change_summary text default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(episode_id, format, version_number)
);

create table characters (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references works(id) on delete cascade,
  name text not null,
  aliases text[] default '{}',
  identity text default '',
  personality text default '',
  age text default '',
  height text default '',
  appearance text default '',
  ai_prompt text default '',
  created_at timestamptz not null default now()
);

create table outfits (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  name text not null,
  category text not null check (category in ('daily','combat','formal','plot_specific','other')),
  description text default '',
  ai_prompt text default ''
);

create table scenes (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references works(id) on delete cascade,
  name text not null,
  location_category text default '',
  time_of_day text default '',
  weather text default '',
  description text default '',
  ai_prompt text default ''
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references works(id) on delete cascade,
  storage_path text not null,
  asset_type text not null check (asset_type in ('character','outfit','scene','comic_panel','video','floor_plan','reference','other')),
  title text not null,
  notes text default '',
  ai_prompt text default '',
  generation_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table works add column cover_asset_id uuid references assets(id) on delete set null;

create table episode_characters (
  episode_id uuid references episodes(id) on delete cascade,
  character_id uuid references characters(id) on delete cascade,
  primary key (episode_id, character_id)
);

create table episode_scenes (
  episode_id uuid references episodes(id) on delete cascade,
  scene_id uuid references scenes(id) on delete cascade,
  scene_order integer not null default 1,
  primary key (episode_id, scene_id)
);

create table scene_appearances (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes(id) on delete cascade,
  scene_id uuid not null references scenes(id) on delete cascade,
  character_id uuid references characters(id),
  outfit_id uuid references outfits(id),
  usage_note text default ''
);

-- Row-level security: each signed-in creator sees only their own works and related data.
alter table works enable row level security;
alter table episodes enable row level security;
alter table characters enable row level security;
alter table outfits enable row level security;
alter table scenes enable row level security;
alter table assets enable row level security;
alter table episode_characters enable row level security;
alter table episode_scenes enable row level security;
alter table scene_appearances enable row level security;

create policy "owners manage works" on works for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owners manage episodes" on episodes for all using (exists (select 1 from works where works.id = episodes.work_id and works.owner_id = auth.uid())) with check (exists (select 1 from works where works.id = episodes.work_id and works.owner_id = auth.uid()));
create policy "owners manage characters" on characters for all using (exists (select 1 from works where works.id = characters.work_id and works.owner_id = auth.uid())) with check (exists (select 1 from works where works.id = characters.work_id and works.owner_id = auth.uid()));
create policy "owners manage scenes" on scenes for all using (exists (select 1 from works where works.id = scenes.work_id and works.owner_id = auth.uid())) with check (exists (select 1 from works where works.id = scenes.work_id and works.owner_id = auth.uid()));
create policy "owners manage assets" on assets for all using (exists (select 1 from works where works.id = assets.work_id and works.owner_id = auth.uid())) with check (exists (select 1 from works where works.id = assets.work_id and works.owner_id = auth.uid()));
create policy "owners manage outfits" on outfits for all using (exists (select 1 from characters join works on works.id = characters.work_id where characters.id = outfits.character_id and works.owner_id = auth.uid())) with check (exists (select 1 from characters join works on works.id = characters.work_id where characters.id = outfits.character_id and works.owner_id = auth.uid()));
create policy "owners manage episode characters" on episode_characters for all using (exists (select 1 from episodes join works on works.id = episodes.work_id where episodes.id = episode_characters.episode_id and works.owner_id = auth.uid())) with check (exists (select 1 from episodes join works on works.id = episodes.work_id where episodes.id = episode_characters.episode_id and works.owner_id = auth.uid()));
create policy "owners manage episode scenes" on episode_scenes for all using (exists (select 1 from episodes join works on works.id = episodes.work_id where episodes.id = episode_scenes.episode_id and works.owner_id = auth.uid())) with check (exists (select 1 from episodes join works on works.id = episodes.work_id where episodes.id = episode_scenes.episode_id and works.owner_id = auth.uid()));
create policy "owners manage scene appearances" on scene_appearances for all using (exists (select 1 from episodes join works on works.id = episodes.work_id where episodes.id = scene_appearances.episode_id and works.owner_id = auth.uid())) with check (exists (select 1 from episodes join works on works.id = episodes.work_id where episodes.id = scene_appearances.episode_id and works.owner_id = auth.uid()));
