-- FirstBlush MVP baseline schema.
-- Idempotence is handled by the migration runner's version table.

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_provider text not null check (auth_provider in ('apple', 'google')),
  provider_subject text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (auth_provider, provider_subject)
);

create table if not exists profiles (
  user_id uuid primary key references users(id) on delete cascade,
  bio text not null default '',
  avatar_url text,
  interests jsonb not null default '[]'::jsonb,
  default_post_visibility text not null default 'public' check (default_post_visibility in ('public', 'group')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  token uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  owner_id uuid not null references users(id) on delete cascade,
  join_policy text not null default 'invite_approval' check (join_policy in ('invite_approval')),
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists group_join_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create unique index if not exists uniq_pending_join_request
  on group_join_requests(group_id, user_id)
  where status = 'pending';

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  group_id uuid references groups(id) on delete set null,
  caption text not null default '',
  video_url text not null,
  visibility text not null default 'public' check (visibility in ('public', 'group')),
  created_at timestamptz not null default now()
);

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  parent_reaction_id uuid references reactions(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  video_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists follows (
  follower_id uuid not null references users(id) on delete cascade,
  followee_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  message text not null,
  context_id text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists user_safety_edges (
  actor_user_id uuid not null references users(id) on delete cascade,
  target_user_id uuid not null references users(id) on delete cascade,
  edge_type text not null check (edge_type in ('block', 'mute')),
  created_at timestamptz not null default now(),
  primary key (actor_user_id, target_user_id, edge_type)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references users(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'reaction', 'user')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_group_members_user_id on group_members(user_id);
create index if not exists idx_posts_created_at on posts(created_at desc);
create index if not exists idx_posts_user_id_created_at on posts(user_id, created_at desc);
create index if not exists idx_reactions_post_created_at on reactions(post_id, created_at asc);
create index if not exists idx_likes_post_id on likes(post_id);
create index if not exists idx_comments_post_created_at on comments(post_id, created_at asc);
create index if not exists idx_notifications_user_created_at on notifications(user_id, created_at desc);
create index if not exists idx_reports_status_created_at on reports(status, created_at desc);
