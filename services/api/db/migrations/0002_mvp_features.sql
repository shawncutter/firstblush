create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id) on delete cascade,
  object_key text not null unique,
  content_type text not null,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  upload_url text,
  public_url text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  post_id uuid references posts(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  actor_user_id uuid references users(id) on delete set null,
  action text not null check (action in ('reviewing', 'dismissed', 'remove_content', 'ban_user')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_media_assets_owner_status on media_assets(owner_user_id, status);
create index if not exists idx_shares_post_id on shares(post_id);
create index if not exists idx_analytics_events_post_type on analytics_events(post_id, event_type, created_at desc);
create index if not exists idx_moderation_actions_report_id on moderation_actions(report_id, created_at desc);
