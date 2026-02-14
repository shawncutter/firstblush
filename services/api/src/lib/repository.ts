import { randomUUID } from "node:crypto";
import { dbPool, dbQuery } from "../db/client.js";

export type AuthProvider = "apple" | "google";
export type Visibility = "public" | "group";
export type NotificationType =
  | "group_join_requested"
  | "group_join_approved"
  | "post_reacted"
  | "post_liked"
  | "post_commented"
  | "post_shared"
  | "user_followed"
  | "report_created"
  | "moderation_updated";

export interface User {
  id: string;
  provider: AuthProvider;
  providerSubject: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  interests: string[];
  defaultPostVisibility: Visibility;
  createdAt: string;
}

export interface GroupSummary {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberCount: number;
  joinRequestCount: number;
  createdAt: string;
}

export interface GroupDetail {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  joinRequestIds: string[];
  createdAt: string;
}

export interface PostEntity {
  id: string;
  userId: string;
  groupId?: string;
  caption: string;
  videoUrl: string;
  visibility: Visibility;
  createdAt: string;
}

export interface FeedItem extends PostEntity {
  reactionCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  author?: {
    id: string;
    displayName?: string;
  };
}

export interface ReactionEntity {
  id: string;
  postId: string;
  parentReactionId?: string;
  userId: string;
  videoUrl: string;
  createdAt: string;
}

export interface CommentEntity {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface NotificationEntity {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  contextId?: string;
  readAt?: string;
  createdAt: string;
}

export interface ReportEntity {
  id: string;
  reporterId: string;
  targetType: "post" | "reaction" | "user";
  targetId: string;
  reason: string;
  status: "open" | "reviewing" | "closed";
  createdAt: string;
}

function asIso(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function mapUser(row: any): User {
  return {
    id: row.id,
    provider: row.provider,
    providerSubject: row.providerSubject,
    displayName: row.displayName,
    bio: row.bio ?? "",
    avatarUrl: row.avatarUrl ?? undefined,
    interests: Array.isArray(row.interests) ? row.interests : [],
    defaultPostVisibility: row.defaultPostVisibility,
    createdAt: asIso(row.createdAt)
  };
}

async function getUserByPredicate(whereClause: string, values: unknown[]): Promise<User | undefined> {
  const result = await dbQuery(
    `
      select
        u.id,
        u.auth_provider as "provider",
        u.provider_subject as "providerSubject",
        u.display_name as "displayName",
        p.bio,
        p.avatar_url as "avatarUrl",
        coalesce(p.interests, '[]'::jsonb) as interests,
        p.default_post_visibility as "defaultPostVisibility",
        u.created_at as "createdAt"
      from users u
      left join profiles p on p.user_id = u.id
      where ${whereClause}
      limit 1
    `,
    values
  );
  const row = result.rows[0];
  return row ? mapUser(row) : undefined;
}

export async function getUserById(userId: string): Promise<User | undefined> {
  return getUserByPredicate("u.id = $1::uuid", [userId]);
}

export async function getUserByProviderSubject(
  provider: AuthProvider,
  providerSubject: string
): Promise<User | undefined> {
  return getUserByPredicate("u.auth_provider = $1 and u.provider_subject = $2", [provider, providerSubject]);
}

export async function createUser(provider: AuthProvider, providerSubject: string, displayName: string): Promise<User> {
  const client = await dbPool.connect();
  try {
    await client.query("begin");
    const created = await client.query<{ id: string }>(
      `
        insert into users(auth_provider, provider_subject, display_name)
        values ($1, $2, $3)
        returning id
      `,
      [provider, providerSubject, displayName]
    );

    const userId = created.rows[0]?.id;
    await client.query(`insert into profiles(user_id) values ($1::uuid) on conflict (user_id) do nothing`, [userId]);
    await client.query("commit");

    const user = await getUserById(userId);
    if (!user) {
      throw new Error("Failed to load created user");
    }
    return user;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateUserProfile(
  userId: string,
  input: { displayName?: string; bio?: string; avatarUrl?: string; interests?: string[] }
): Promise<User | undefined> {
  const client = await dbPool.connect();
  try {
    await client.query("begin");

    if (input.displayName !== undefined) {
      await client.query(`update users set display_name = $1, updated_at = now() where id = $2::uuid`, [
        input.displayName,
        userId
      ]);
    }

    await client.query(`insert into profiles(user_id) values ($1::uuid) on conflict (user_id) do nothing`, [userId]);

    if (
      input.bio !== undefined ||
      input.avatarUrl !== undefined ||
      input.interests !== undefined
    ) {
      await client.query(
        `
          update profiles
          set
            bio = coalesce($1, bio),
            avatar_url = coalesce($2, avatar_url),
            interests = coalesce($3::jsonb, interests),
            updated_at = now()
          where user_id = $4::uuid
        `,
        [
          input.bio ?? null,
          input.avatarUrl ?? null,
          input.interests ? JSON.stringify(input.interests) : null,
          userId
        ]
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  return getUserById(userId);
}

export async function updateUserPrivacy(
  userId: string,
  input: { defaultPostVisibility?: Visibility }
): Promise<User | undefined> {
  if (input.defaultPostVisibility !== undefined) {
    await dbQuery(
      `
        update profiles
        set default_post_visibility = $1, updated_at = now()
        where user_id = $2::uuid
      `,
      [input.defaultPostVisibility, userId]
    );
  }

  return getUserById(userId);
}

export async function createSession(userId: string): Promise<{ token: string; userId: string }> {
  const result = await dbQuery<{ token: string; userId: string }>(
    `
      insert into sessions(user_id)
      values ($1::uuid)
      returning token::text as token, user_id::text as "userId"
    `,
    [userId]
  );

  return result.rows[0];
}

export async function getUserFromToken(token?: string): Promise<User | undefined> {
  if (!token) return undefined;

  const session = await dbQuery<{ userId: string }>(
    `
      select user_id::text as "userId"
      from sessions
      where token = $1::uuid
      limit 1
    `,
    [token]
  );

  const userId = session.rows[0]?.userId;
  if (!userId) return undefined;
  return getUserById(userId);
}

export async function revokeSession(token: string): Promise<boolean> {
  const result = await dbQuery(`delete from sessions where token = $1::uuid`, [token]);
  return (result.rowCount ?? 0) > 0;
}

export async function listUsers(): Promise<Array<Pick<User, "id" | "displayName" | "bio" | "interests" | "createdAt">>> {
  const result = await dbQuery(
    `
      select
        u.id,
        u.display_name as "displayName",
        coalesce(p.bio, '') as bio,
        coalesce(p.interests, '[]'::jsonb) as interests,
        u.created_at as "createdAt"
      from users u
      left join profiles p on p.user_id = u.id
      order by u.created_at desc
    `
  );

  return result.rows.map((row: any) => ({
    id: row.id,
    displayName: row.displayName,
    bio: row.bio,
    interests: Array.isArray(row.interests) ? row.interests : [],
    createdAt: asIso(row.createdAt)
  }));
}

export async function createGroup(ownerId: string, name: string, description: string): Promise<GroupDetail> {
  const client = await dbPool.connect();
  try {
    await client.query("begin");
    const created = await client.query<{ id: string }>(
      `
        insert into groups(name, description, owner_id)
        values ($1, $2, $3::uuid)
        returning id
      `,
      [name, description, ownerId]
    );
    const groupId = created.rows[0]?.id;

    await client.query(
      `
        insert into group_members(group_id, user_id, role)
        values ($1::uuid, $2::uuid, 'owner')
        on conflict (group_id, user_id) do nothing
      `,
      [groupId, ownerId]
    );

    await client.query("commit");
    const detail = await getGroupById(groupId);
    if (!detail) {
      throw new Error("Failed to load created group");
    }
    return detail;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function listGroups(): Promise<GroupSummary[]> {
  const result = await dbQuery(
    `
      select
        g.id,
        g.name,
        g.description,
        g.owner_id::text as "ownerId",
        g.created_at as "createdAt",
        count(distinct gm.user_id)::int as "memberCount",
        count(distinct case when gjr.status = 'pending' then gjr.user_id end)::int as "joinRequestCount"
      from groups g
      left join group_members gm on gm.group_id = g.id
      left join group_join_requests gjr on gjr.group_id = g.id
      group by g.id
      order by g.created_at desc
    `
  );

  return result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.ownerId,
    memberCount: Number(row.memberCount ?? 0),
    joinRequestCount: Number(row.joinRequestCount ?? 0),
    createdAt: asIso(row.createdAt)
  }));
}

export async function getGroupById(groupId: string): Promise<GroupDetail | undefined> {
  const result = await dbQuery(
    `
      select
        g.id,
        g.name,
        g.description,
        g.owner_id::text as "ownerId",
        g.created_at as "createdAt",
        coalesce(array_agg(distinct gm.user_id::text) filter (where gm.user_id is not null), '{}'::text[]) as "memberIds",
        coalesce(array_agg(distinct gjr.user_id::text) filter (where gjr.status = 'pending'), '{}'::text[]) as "joinRequestIds"
      from groups g
      left join group_members gm on gm.group_id = g.id
      left join group_join_requests gjr on gjr.group_id = g.id
      where g.id = $1::uuid
      group by g.id
      limit 1
    `,
    [groupId]
  );

  const row = result.rows[0] as any;
  if (!row) return undefined;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.ownerId,
    memberIds: row.memberIds ?? [],
    joinRequestIds: row.joinRequestIds ?? [],
    createdAt: asIso(row.createdAt)
  };
}

export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  const result = await dbQuery<{ exists: boolean }>(
    `
      select exists(
        select 1 from group_members where group_id = $1::uuid and user_id = $2::uuid
      ) as exists
    `,
    [groupId, userId]
  );

  return result.rows[0]?.exists ?? false;
}

export async function requestGroupJoin(
  groupId: string,
  userId: string
): Promise<"pending_approval" | "already_member" | "already_pending" | "group_not_found"> {
  const group = await getGroupById(groupId);
  if (!group) {
    return "group_not_found";
  }

  if (group.memberIds.includes(userId)) {
    return "already_member";
  }

  const pending = await dbQuery<{ exists: boolean }>(
    `
      select exists(
        select 1
        from group_join_requests
        where group_id = $1::uuid and user_id = $2::uuid and status = 'pending'
      ) as exists
    `,
    [groupId, userId]
  );

  if (pending.rows[0]?.exists) {
    return "already_pending";
  }

  await dbQuery(
    `
      insert into group_join_requests(group_id, user_id, status)
      values ($1::uuid, $2::uuid, 'pending')
    `,
    [groupId, userId]
  );

  return "pending_approval";
}

export async function approveGroupJoin(
  groupId: string,
  ownerId: string,
  candidateUserId: string
): Promise<"approved" | "group_not_found" | "not_owner" | "join_not_found"> {
  const group = await getGroupById(groupId);
  if (!group) {
    return "group_not_found";
  }

  if (group.ownerId !== ownerId) {
    return "not_owner";
  }

  const updated = await dbQuery(
    `
      update group_join_requests
      set status = 'approved', reviewed_at = now()
      where group_id = $1::uuid and user_id = $2::uuid and status = 'pending'
    `,
    [groupId, candidateUserId]
  );

  if (updated.rowCount === 0) {
    return "join_not_found";
  }

  await dbQuery(
    `
      insert into group_members(group_id, user_id, role)
      values ($1::uuid, $2::uuid, 'member')
      on conflict (group_id, user_id) do nothing
    `,
    [groupId, candidateUserId]
  );

  return "approved";
}

export async function createPost(input: Omit<PostEntity, "id" | "createdAt">): Promise<PostEntity> {
  const result = await dbQuery(
    `
      insert into posts(user_id, group_id, caption, video_url, visibility)
      values ($1::uuid, $2::uuid, $3, $4, $5)
      returning
        id,
        user_id::text as "userId",
        group_id::text as "groupId",
        caption,
        video_url as "videoUrl",
        visibility,
        created_at as "createdAt"
    `,
    [input.userId, input.groupId ?? null, input.caption, input.videoUrl, input.visibility]
  );

  const row = result.rows[0] as any;
  return {
    id: row.id,
    userId: row.userId,
    groupId: row.groupId ?? undefined,
    caption: row.caption,
    videoUrl: row.videoUrl,
    visibility: row.visibility,
    createdAt: asIso(row.createdAt)
  };
}

export async function getPostById(postId: string): Promise<PostEntity | undefined> {
  const result = await dbQuery(
    `
      select
        id,
        user_id::text as "userId",
        group_id::text as "groupId",
        caption,
        video_url as "videoUrl",
        visibility,
        created_at as "createdAt"
      from posts
      where id = $1::uuid
      limit 1
    `,
    [postId]
  );

  const row = result.rows[0] as any;
  if (!row) return undefined;

  return {
    id: row.id,
    userId: row.userId,
    groupId: row.groupId ?? undefined,
    caption: row.caption,
    videoUrl: row.videoUrl,
    visibility: row.visibility,
    createdAt: asIso(row.createdAt)
  };
}

export async function canViewPost(post: PostEntity, actorId?: string): Promise<boolean> {
  if (await isBlockedOrMuted(actorId, post.userId)) {
    return false;
  }

  if (post.visibility === "public") {
    return true;
  }

  if (!post.groupId || !actorId) {
    return false;
  }

  return isGroupMember(post.groupId, actorId);
}

export async function listFeed(actorId?: string, groupId?: string): Promise<FeedItem[]> {
  const result = await dbQuery(
    `
      select
        p.id,
        p.user_id::text as "userId",
        p.group_id::text as "groupId",
        p.caption,
        p.video_url as "videoUrl",
        p.visibility,
        p.created_at as "createdAt",
        u.display_name as "authorDisplayName",
        (select count(*)::int from reactions r where r.post_id = p.id) as "reactionCount",
        (select count(*)::int from likes l where l.post_id = p.id) as "likeCount",
        (select count(*)::int from comments c where c.post_id = p.id) as "commentCount",
        (select count(*)::int from shares s where s.post_id = p.id) as "shareCount"
      from posts p
      join users u on u.id = p.user_id
      where ($1::uuid is null or p.group_id = $1::uuid)
        and (
          p.visibility = 'public'
          or (
            $2::uuid is not null
            and p.group_id in (
              select gm.group_id
              from group_members gm
              where gm.user_id = $2::uuid
            )
          )
        )
        and (
          $2::uuid is null
          or not exists (
            select 1
            from user_safety_edges e
            where e.actor_user_id = $2::uuid
              and e.target_user_id = p.user_id
          )
        )
      order by p.created_at desc
    `,
    [groupId ?? null, actorId ?? null]
  );

  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    groupId: row.groupId ?? undefined,
    caption: row.caption,
    videoUrl: row.videoUrl,
    visibility: row.visibility,
    createdAt: asIso(row.createdAt),
    reactionCount: Number(row.reactionCount ?? 0),
    likeCount: Number(row.likeCount ?? 0),
    commentCount: Number(row.commentCount ?? 0),
    shareCount: Number(row.shareCount ?? 0),
    author: {
      id: row.userId,
      displayName: row.authorDisplayName
    }
  }));
}

export async function getPostEngagementCounts(postId: string): Promise<{
  likeCount: number;
  commentCount: number;
  reactionCount: number;
  shareCount: number;
}> {
  const result = await dbQuery(
    `
      select
        (select count(*)::int from likes where post_id = $1::uuid) as "likeCount",
        (select count(*)::int from comments where post_id = $1::uuid) as "commentCount",
        (select count(*)::int from reactions where post_id = $1::uuid) as "reactionCount",
        (select count(*)::int from shares where post_id = $1::uuid) as "shareCount"
    `,
    [postId]
  );

  const row = result.rows[0] as any;
  return {
    likeCount: Number(row?.likeCount ?? 0),
    commentCount: Number(row?.commentCount ?? 0),
    reactionCount: Number(row?.reactionCount ?? 0),
    shareCount: Number(row?.shareCount ?? 0)
  };
}

export async function createReaction(input: Omit<ReactionEntity, "id" | "createdAt">): Promise<ReactionEntity> {
  const result = await dbQuery(
    `
      insert into reactions(post_id, parent_reaction_id, user_id, video_url)
      values ($1::uuid, $2::uuid, $3::uuid, $4)
      returning
        id,
        post_id::text as "postId",
        parent_reaction_id::text as "parentReactionId",
        user_id::text as "userId",
        video_url as "videoUrl",
        created_at as "createdAt"
    `,
    [input.postId, input.parentReactionId ?? null, input.userId, input.videoUrl]
  );

  const row = result.rows[0] as any;
  return {
    id: row.id,
    postId: row.postId,
    parentReactionId: row.parentReactionId ?? undefined,
    userId: row.userId,
    videoUrl: row.videoUrl,
    createdAt: asIso(row.createdAt)
  };
}

export async function getReactionById(reactionId: string): Promise<ReactionEntity | undefined> {
  const result = await dbQuery(
    `
      select
        id,
        post_id::text as "postId",
        parent_reaction_id::text as "parentReactionId",
        user_id::text as "userId",
        video_url as "videoUrl",
        created_at as "createdAt"
      from reactions
      where id = $1::uuid
      limit 1
    `,
    [reactionId]
  );

  const row = result.rows[0] as any;
  if (!row) return undefined;
  return {
    id: row.id,
    postId: row.postId,
    parentReactionId: row.parentReactionId ?? undefined,
    userId: row.userId,
    videoUrl: row.videoUrl,
    createdAt: asIso(row.createdAt)
  };
}

export async function getReactionChain(postId: string, actorId?: string): Promise<Array<ReactionEntity & { position: number }>> {
  const result = await dbQuery(
    `
      select
        r.id,
        r.post_id::text as "postId",
        r.parent_reaction_id::text as "parentReactionId",
        r.user_id::text as "userId",
        r.video_url as "videoUrl",
        r.created_at as "createdAt"
      from reactions r
      where r.post_id = $1::uuid
        and (
          $2::uuid is null
          or not exists (
            select 1 from user_safety_edges e
            where e.actor_user_id = $2::uuid
              and e.target_user_id = r.user_id
          )
        )
      order by r.created_at asc
    `,
    [postId, actorId ?? null]
  );

  return result.rows.map((row: any, index: number) => ({
    id: row.id,
    postId: row.postId,
    parentReactionId: row.parentReactionId ?? undefined,
    userId: row.userId,
    videoUrl: row.videoUrl,
    createdAt: asIso(row.createdAt),
    position: index + 1
  }));
}

export async function toggleLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  const existing = await dbQuery<{ id: string }>(
    `select id::text as id from likes where post_id = $1::uuid and user_id = $2::uuid limit 1`,
    [postId, userId]
  );

  let liked = false;
  if (existing.rows[0]) {
    await dbQuery(`delete from likes where id = $1::uuid`, [existing.rows[0].id]);
    liked = false;
  } else {
    await dbQuery(
      `
        insert into likes(post_id, user_id)
        values ($1::uuid, $2::uuid)
        on conflict (post_id, user_id) do nothing
      `,
      [postId, userId]
    );
    liked = true;
  }

  const countResult = await dbQuery<{ count: string }>(`select count(*)::text as count from likes where post_id = $1::uuid`, [postId]);
  return {
    liked,
    count: Number(countResult.rows[0]?.count ?? 0)
  };
}

export async function addComment(postId: string, userId: string, text: string): Promise<CommentEntity> {
  const result = await dbQuery(
    `
      insert into comments(post_id, user_id, text)
      values ($1::uuid, $2::uuid, $3)
      returning
        id,
        post_id::text as "postId",
        user_id::text as "userId",
        text,
        created_at as "createdAt"
    `,
    [postId, userId, text]
  );

  const row = result.rows[0] as any;
  return {
    id: row.id,
    postId: row.postId,
    userId: row.userId,
    text: row.text,
    createdAt: asIso(row.createdAt)
  };
}

export async function listComments(postId: string): Promise<CommentEntity[]> {
  const result = await dbQuery(
    `
      select
        id,
        post_id::text as "postId",
        user_id::text as "userId",
        text,
        created_at as "createdAt"
      from comments
      where post_id = $1::uuid
      order by created_at asc
    `,
    [postId]
  );

  return result.rows.map((row: any) => ({
    id: row.id,
    postId: row.postId,
    userId: row.userId,
    text: row.text,
    createdAt: asIso(row.createdAt)
  }));
}

export async function sharePost(postId: string, userId: string): Promise<{ shared: boolean; count: number }> {
  const before = await dbQuery<{ count: string }>(`select count(*)::text as count from shares where post_id = $1::uuid`, [postId]);
  const insert = await dbQuery(
    `
      insert into shares(post_id, user_id)
      values ($1::uuid, $2::uuid)
      on conflict (post_id, user_id) do nothing
    `,
    [postId, userId]
  );

  const after = await dbQuery<{ count: string }>(`select count(*)::text as count from shares where post_id = $1::uuid`, [postId]);
  return {
    shared: (insert.rowCount ?? 0) > 0,
    count: Number(after.rows[0]?.count ?? before.rows[0]?.count ?? 0)
  };
}

export async function createNotification(input: Omit<NotificationEntity, "id" | "createdAt">): Promise<NotificationEntity> {
  const result = await dbQuery(
    `
      insert into notifications(user_id, type, message, context_id)
      values ($1::uuid, $2, $3, $4)
      returning
        id,
        user_id::text as "userId",
        type,
        message,
        context_id as "contextId",
        read_at as "readAt",
        created_at as "createdAt"
    `,
    [input.userId, input.type, input.message, input.contextId ?? null]
  );

  const row = result.rows[0] as any;
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    message: row.message,
    contextId: row.contextId ?? undefined,
    readAt: row.readAt ? asIso(row.readAt) : undefined,
    createdAt: asIso(row.createdAt)
  };
}

export async function listNotifications(userId: string): Promise<NotificationEntity[]> {
  const result = await dbQuery(
    `
      select
        id,
        user_id::text as "userId",
        type,
        message,
        context_id as "contextId",
        read_at as "readAt",
        created_at as "createdAt"
      from notifications
      where user_id = $1::uuid
      order by created_at desc
    `,
    [userId]
  );

  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    type: row.type,
    message: row.message,
    contextId: row.contextId ?? undefined,
    readAt: row.readAt ? asIso(row.readAt) : undefined,
    createdAt: asIso(row.createdAt)
  }));
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<NotificationEntity | undefined> {
  const result = await dbQuery(
    `
      update notifications
      set read_at = now()
      where id = $1::uuid and user_id = $2::uuid
      returning
        id,
        user_id::text as "userId",
        type,
        message,
        context_id as "contextId",
        read_at as "readAt",
        created_at as "createdAt"
    `,
    [notificationId, userId]
  );

  const row = result.rows[0] as any;
  if (!row) return undefined;
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    message: row.message,
    contextId: row.contextId ?? undefined,
    readAt: row.readAt ? asIso(row.readAt) : undefined,
    createdAt: asIso(row.createdAt)
  };
}

export async function followUser(
  followerId: string,
  followeeId: string
): Promise<{ followerId: string; followeeId: string; createdAt: string } | undefined> {
  if (followerId === followeeId) {
    return undefined;
  }

  await dbQuery(
    `
      insert into follows(follower_id, followee_id)
      values ($1::uuid, $2::uuid)
      on conflict (follower_id, followee_id) do nothing
    `,
    [followerId, followeeId]
  );

  const result = await dbQuery(
    `
      select
        follower_id::text as "followerId",
        followee_id::text as "followeeId",
        created_at as "createdAt"
      from follows
      where follower_id = $1::uuid and followee_id = $2::uuid
      limit 1
    `,
    [followerId, followeeId]
  );

  const row = result.rows[0] as any;
  if (!row) return undefined;
  return {
    followerId: row.followerId,
    followeeId: row.followeeId,
    createdAt: asIso(row.createdAt)
  };
}

export async function upsertSafetyEdge(
  actorId: string,
  targetId: string,
  edgeType: "block" | "mute"
): Promise<{ actorId: string; targetId: string; edgeType: "block" | "mute"; createdAt: string }> {
  await dbQuery(
    `
      insert into user_safety_edges(actor_user_id, target_user_id, edge_type)
      values ($1::uuid, $2::uuid, $3)
      on conflict (actor_user_id, target_user_id, edge_type) do nothing
    `,
    [actorId, targetId, edgeType]
  );

  const result = await dbQuery(
    `
      select
        actor_user_id::text as "actorId",
        target_user_id::text as "targetId",
        edge_type as "edgeType",
        created_at as "createdAt"
      from user_safety_edges
      where actor_user_id = $1::uuid and target_user_id = $2::uuid and edge_type = $3
      limit 1
    `,
    [actorId, targetId, edgeType]
  );

  const row = result.rows[0] as any;
  return {
    actorId: row.actorId,
    targetId: row.targetId,
    edgeType: row.edgeType,
    createdAt: asIso(row.createdAt)
  };
}

export async function listSafetyEdges(actorId: string): Promise<Array<{ actorId: string; targetId: string; edgeType: "block" | "mute"; createdAt: string }>> {
  const result = await dbQuery(
    `
      select
        actor_user_id::text as "actorId",
        target_user_id::text as "targetId",
        edge_type as "edgeType",
        created_at as "createdAt"
      from user_safety_edges
      where actor_user_id = $1::uuid
      order by created_at desc
    `,
    [actorId]
  );

  return result.rows.map((row: any) => ({
    actorId: row.actorId,
    targetId: row.targetId,
    edgeType: row.edgeType,
    createdAt: asIso(row.createdAt)
  }));
}

export async function isBlockedOrMuted(viewerId: string | undefined, authorId: string): Promise<boolean> {
  if (!viewerId) return false;

  const result = await dbQuery<{ exists: boolean }>(
    `
      select exists(
        select 1
        from user_safety_edges
        where actor_user_id = $1::uuid and target_user_id = $2::uuid
      ) as exists
    `,
    [viewerId, authorId]
  );

  return result.rows[0]?.exists ?? false;
}

export async function createReport(input: {
  reporterId: string;
  targetType: "post" | "reaction" | "user";
  targetId: string;
  reason: string;
}): Promise<ReportEntity> {
  const result = await dbQuery(
    `
      insert into reports(reporter_user_id, target_type, target_id, reason)
      values ($1::uuid, $2, $3::uuid, $4)
      returning
        id,
        reporter_user_id::text as "reporterId",
        target_type as "targetType",
        target_id::text as "targetId",
        reason,
        status,
        created_at as "createdAt"
    `,
    [input.reporterId, input.targetType, input.targetId, input.reason]
  );

  const row = result.rows[0] as any;
  return {
    id: row.id,
    reporterId: row.reporterId,
    targetType: row.targetType,
    targetId: row.targetId,
    reason: row.reason,
    status: row.status,
    createdAt: asIso(row.createdAt)
  };
}

export async function listModerationQueue(status: "open" | "reviewing" | "all" = "all") {
  const statusFilter =
    status === "all"
      ? ""
      : `where r.status = '${status}'`;

  const result = await dbQuery(
    `
      select
        r.id,
        r.reporter_user_id::text as "reporterId",
        u.display_name as "reporterDisplayName",
        r.target_type as "targetType",
        r.target_id::text as "targetId",
        r.reason,
        r.status,
        r.created_at as "createdAt"
      from reports r
      left join users u on u.id = r.reporter_user_id
      ${statusFilter}
      order by r.created_at desc
    `
  );

  return result.rows.map((row: any) => ({
    id: row.id,
    reporterId: row.reporterId,
    reporterDisplayName: row.reporterDisplayName,
    targetType: row.targetType,
    targetId: row.targetId,
    reason: row.reason,
    status: row.status,
    createdAt: asIso(row.createdAt)
  }));
}

export async function createModerationAction(input: {
  reportId: string;
  actorUserId?: string;
  action: "reviewing" | "dismissed" | "remove_content" | "ban_user";
  note?: string;
}) {
  const client = await dbPool.connect();
  try {
    await client.query("begin");
    const status = input.action === "reviewing" ? "reviewing" : "closed";

    const updated = await client.query(
      `
        update reports
        set status = $1
        where id = $2::uuid
        returning
          id,
          reporter_user_id::text as "reporterId"
      `,
      [status, input.reportId]
    );

    if (updated.rowCount === 0) {
      await client.query("rollback");
      return undefined;
    }

    await client.query(
      `
        insert into moderation_actions(id, report_id, actor_user_id, action, note)
        values ($1::uuid, $2::uuid, $3::uuid, $4, $5)
      `,
      [randomUUID(), input.reportId, input.actorUserId ?? null, input.action, input.note ?? null]
    );

    await client.query("commit");
    return {
      reportId: updated.rows[0]?.id,
      reporterId: updated.rows[0]?.reporterId,
      status
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function listCreatorMetrics(actorId: string): Promise<{
  posts: number;
  reactionsReceived: number;
  likesReceived: number;
  commentsReceived: number;
  sharesReceived: number;
  viewsReceived: number;
  followers: number;
}> {
  const result = await dbQuery(
    `
      with owned_posts as (
        select id from posts where user_id = $1::uuid
      )
      select
        (select count(*)::int from owned_posts) as posts,
        (select count(*)::int from reactions r where r.post_id in (select id from owned_posts)) as "reactionsReceived",
        (select count(*)::int from likes l where l.post_id in (select id from owned_posts)) as "likesReceived",
        (select count(*)::int from comments c where c.post_id in (select id from owned_posts)) as "commentsReceived",
        (select count(*)::int from shares s where s.post_id in (select id from owned_posts)) as "sharesReceived",
        (
          select count(*)::int
          from analytics_events a
          where a.event_type = 'post_view'
            and a.post_id in (select id from owned_posts)
        ) as "viewsReceived",
        (select count(*)::int from follows f where f.followee_id = $1::uuid) as followers
    `,
    [actorId]
  );

  const row = result.rows[0] as any;
  return {
    posts: Number(row?.posts ?? 0),
    reactionsReceived: Number(row?.reactionsReceived ?? 0),
    likesReceived: Number(row?.likesReceived ?? 0),
    commentsReceived: Number(row?.commentsReceived ?? 0),
    sharesReceived: Number(row?.sharesReceived ?? 0),
    viewsReceived: Number(row?.viewsReceived ?? 0),
    followers: Number(row?.followers ?? 0)
  };
}

export async function trackPostView(postId: string, actorId?: string): Promise<void> {
  await dbQuery(
    `
      insert into analytics_events(user_id, post_id, event_type, metadata)
      values ($1::uuid, $2::uuid, 'post_view', '{}'::jsonb)
    `,
    [actorId ?? null, postId]
  );
}

export async function createMediaUpload(input: {
  ownerId: string;
  contentType: string;
  fileName?: string;
}): Promise<{
  id: string;
  objectKey: string;
  uploadUrl: string;
  expiresInSeconds: number;
}> {
  const id = randomUUID();
  const objectKey = `${input.ownerId}/${Date.now()}-${id}${input.fileName ? `-${input.fileName}` : ""}`;
  const uploadUrl = `/v1/media/uploads/${id}/put`;

  await dbQuery(
    `
      insert into media_assets(id, owner_user_id, object_key, content_type, status, upload_url)
      values ($1::uuid, $2::uuid, $3, $4, 'pending', $5)
    `,
    [id, input.ownerId, objectKey, input.contentType, uploadUrl]
  );

  return {
    id,
    objectKey,
    uploadUrl,
    expiresInSeconds: 3600
  };
}

export async function completeMediaUpload(input: {
  uploadId: string;
  ownerId: string;
  publicUrl?: string;
}): Promise<{ id: string; videoUrl: string } | undefined> {
  const existing = await dbQuery<{ objectKey: string }>(
    `
      select object_key as "objectKey"
      from media_assets
      where id = $1::uuid and owner_user_id = $2::uuid
      limit 1
    `,
    [input.uploadId, input.ownerId]
  );

  const objectKey = existing.rows[0]?.objectKey;
  if (!objectKey) {
    return undefined;
  }

  const minioApiPort = process.env.MINIO_API_HOST_PORT ?? "29020";
  const fallbackUrl = `http://localhost:${minioApiPort}/firstblush/${objectKey}`;
  const videoUrl = input.publicUrl ?? fallbackUrl;

  await dbQuery(
    `
      update media_assets
      set
        status = 'ready',
        public_url = $1,
        completed_at = now()
      where id = $2::uuid
    `,
    [videoUrl, input.uploadId]
  );

  return {
    id: input.uploadId,
    videoUrl
  };
}

export async function getMediaById(uploadId: string, ownerId: string): Promise<{ id: string; videoUrl?: string; status: string } | undefined> {
  const result = await dbQuery(
    `
      select
        id,
        public_url as "videoUrl",
        status
      from media_assets
      where id = $1::uuid and owner_user_id = $2::uuid
      limit 1
    `,
    [uploadId, ownerId]
  );

  const row = result.rows[0] as any;
  if (!row) return undefined;

  return {
    id: row.id,
    videoUrl: row.videoUrl ?? undefined,
    status: row.status
  };
}
