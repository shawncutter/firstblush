import { randomUUID } from "node:crypto";

export type AuthProvider = "apple" | "google";
export type Visibility = "public" | "group";
export type NotificationType =
  | "group_join_requested"
  | "group_join_approved"
  | "post_reacted"
  | "post_liked"
  | "post_commented"
  | "user_followed"
  | "report_created";

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

export interface Group {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: Set<string>;
  joinRequests: Set<string>;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  groupId?: string;
  caption: string;
  videoUrl: string;
  visibility: Visibility;
  createdAt: string;
}

export interface Reaction {
  id: string;
  postId: string;
  parentReactionId?: string;
  userId: string;
  videoUrl: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: "post" | "reaction" | "user";
  targetId: string;
  reason: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  contextId?: string;
  readAt?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
}

interface Session {
  token: string;
  userId: string;
}

interface FollowEdge {
  followerId: string;
  followeeId: string;
  createdAt: string;
}

interface SafetyEdge {
  actorId: string;
  targetId: string;
  edgeType: "block" | "mute";
  createdAt: string;
}

interface Like {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

class InMemoryStore {
  users: User[] = [];
  sessions: Session[] = [];
  groups: Group[] = [];
  posts: Post[] = [];
  reactions: Reaction[] = [];
  reports: Report[] = [];
  notifications: Notification[] = [];
  comments: Comment[] = [];
  likes: Like[] = [];
  follows: FollowEdge[] = [];
  safetyEdges: SafetyEdge[] = [];

  findUserByProviderSubject(provider: AuthProvider, providerSubject: string): User | undefined {
    return this.users.find((u) => u.provider === provider && u.providerSubject === providerSubject);
  }

  findUserById(userId: string): User | undefined {
    return this.users.find((u) => u.id === userId);
  }

  createUser(provider: AuthProvider, providerSubject: string, displayName: string): User {
    const user: User = {
      id: randomUUID(),
      provider,
      providerSubject,
      displayName,
      bio: "",
      interests: [],
      defaultPostVisibility: "public",
      createdAt: new Date().toISOString()
    };
    this.users.push(user);
    return user;
  }

  updateUserProfile(userId: string, input: { displayName?: string; bio?: string; avatarUrl?: string; interests?: string[] }) {
    const user = this.findUserById(userId);
    if (!user) return undefined;
    if (input.displayName !== undefined) user.displayName = input.displayName;
    if (input.bio !== undefined) user.bio = input.bio;
    if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl;
    if (input.interests !== undefined) user.interests = input.interests;
    return user;
  }

  updateUserPrivacy(userId: string, input: { defaultPostVisibility?: Visibility }) {
    const user = this.findUserById(userId);
    if (!user) return undefined;
    if (input.defaultPostVisibility !== undefined) user.defaultPostVisibility = input.defaultPostVisibility;
    return user;
  }

  createSession(userId: string): Session {
    const session: Session = {
      token: randomUUID(),
      userId
    };
    this.sessions.push(session);
    return session;
  }

  resolveUserFromToken(token?: string): User | undefined {
    if (!token) return undefined;
    const session = this.sessions.find((s) => s.token === token);
    if (!session) return undefined;
    return this.findUserById(session.userId);
  }

  revokeSession(token: string): boolean {
    const index = this.sessions.findIndex((s) => s.token === token);
    if (index < 0) return false;
    this.sessions.splice(index, 1);
    return true;
  }

  createGroup(ownerId: string, name: string, description: string): Group {
    const group: Group = {
      id: randomUUID(),
      name,
      description,
      ownerId,
      members: new Set([ownerId]),
      joinRequests: new Set(),
      createdAt: new Date().toISOString()
    };
    this.groups.push(group);
    return group;
  }

  createPost(input: Omit<Post, "id" | "createdAt">): Post {
    const post: Post = {
      id: randomUUID(),
      ...input,
      createdAt: new Date().toISOString()
    };
    this.posts.push(post);
    return post;
  }

  createReaction(input: Omit<Reaction, "id" | "createdAt">): Reaction {
    const reaction: Reaction = {
      id: randomUUID(),
      ...input,
      createdAt: new Date().toISOString()
    };
    this.reactions.push(reaction);
    return reaction;
  }

  createReport(input: Omit<Report, "id" | "createdAt">): Report {
    const report: Report = {
      id: randomUUID(),
      ...input,
      createdAt: new Date().toISOString()
    };
    this.reports.push(report);
    return report;
  }

  createNotification(input: Omit<Notification, "id" | "createdAt">): Notification {
    const notification: Notification = {
      id: randomUUID(),
      ...input,
      createdAt: new Date().toISOString()
    };
    this.notifications.push(notification);
    return notification;
  }

  markNotificationRead(notificationId: string, userId: string): Notification | undefined {
    const notification = this.notifications.find((item) => item.id === notificationId && item.userId === userId);
    if (!notification) return undefined;
    notification.readAt = new Date().toISOString();
    return notification;
  }

  upsertSafetyEdge(actorId: string, targetId: string, edgeType: "block" | "mute"): SafetyEdge {
    const existing = this.safetyEdges.find((edge) => edge.actorId === actorId && edge.targetId === targetId && edge.edgeType === edgeType);
    if (existing) return existing;
    const edge: SafetyEdge = {
      actorId,
      targetId,
      edgeType,
      createdAt: new Date().toISOString()
    };
    this.safetyEdges.push(edge);
    return edge;
  }

  getSafety(actorId: string) {
    return this.safetyEdges.filter((edge) => edge.actorId === actorId);
  }

  isBlockedOrMuted(viewerId: string | undefined, authorId: string): boolean {
    if (!viewerId) return false;
    return this.safetyEdges.some((edge) => edge.actorId === viewerId && edge.targetId === authorId);
  }

  follow(followerId: string, followeeId: string): FollowEdge | undefined {
    if (followerId === followeeId) return undefined;
    const existing = this.follows.find((edge) => edge.followerId === followerId && edge.followeeId === followeeId);
    if (existing) return existing;
    const edge: FollowEdge = {
      followerId,
      followeeId,
      createdAt: new Date().toISOString()
    };
    this.follows.push(edge);
    return edge;
  }

  toggleLike(postId: string, userId: string): { liked: boolean; count: number } {
    const existingIndex = this.likes.findIndex((like) => like.postId === postId && like.userId === userId);
    if (existingIndex >= 0) {
      this.likes.splice(existingIndex, 1);
      return { liked: false, count: this.likes.filter((like) => like.postId === postId).length };
    }
    this.likes.push({
      id: randomUUID(),
      postId,
      userId,
      createdAt: new Date().toISOString()
    });
    return { liked: true, count: this.likes.filter((like) => like.postId === postId).length };
  }

  addComment(postId: string, userId: string, text: string): Comment {
    const comment: Comment = {
      id: randomUUID(),
      postId,
      userId,
      text,
      createdAt: new Date().toISOString()
    };
    this.comments.push(comment);
    return comment;
  }
}

export const store = new InMemoryStore();
