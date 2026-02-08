import { randomUUID } from "node:crypto";
class InMemoryStore {
    users = [];
    sessions = [];
    groups = [];
    posts = [];
    reactions = [];
    reports = [];
    notifications = [];
    comments = [];
    likes = [];
    follows = [];
    safetyEdges = [];
    findUserByProviderSubject(provider, providerSubject) {
        return this.users.find((u) => u.provider === provider && u.providerSubject === providerSubject);
    }
    findUserById(userId) {
        return this.users.find((u) => u.id === userId);
    }
    createUser(provider, providerSubject, displayName) {
        const user = {
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
    updateUserProfile(userId, input) {
        const user = this.findUserById(userId);
        if (!user)
            return undefined;
        if (input.displayName !== undefined)
            user.displayName = input.displayName;
        if (input.bio !== undefined)
            user.bio = input.bio;
        if (input.avatarUrl !== undefined)
            user.avatarUrl = input.avatarUrl;
        if (input.interests !== undefined)
            user.interests = input.interests;
        return user;
    }
    updateUserPrivacy(userId, input) {
        const user = this.findUserById(userId);
        if (!user)
            return undefined;
        if (input.defaultPostVisibility !== undefined)
            user.defaultPostVisibility = input.defaultPostVisibility;
        return user;
    }
    createSession(userId) {
        const session = {
            token: randomUUID(),
            userId
        };
        this.sessions.push(session);
        return session;
    }
    resolveUserFromToken(token) {
        if (!token)
            return undefined;
        const session = this.sessions.find((s) => s.token === token);
        if (!session)
            return undefined;
        return this.findUserById(session.userId);
    }
    revokeSession(token) {
        const index = this.sessions.findIndex((s) => s.token === token);
        if (index < 0)
            return false;
        this.sessions.splice(index, 1);
        return true;
    }
    createGroup(ownerId, name, description) {
        const group = {
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
    createPost(input) {
        const post = {
            id: randomUUID(),
            ...input,
            createdAt: new Date().toISOString()
        };
        this.posts.push(post);
        return post;
    }
    createReaction(input) {
        const reaction = {
            id: randomUUID(),
            ...input,
            createdAt: new Date().toISOString()
        };
        this.reactions.push(reaction);
        return reaction;
    }
    createReport(input) {
        const report = {
            id: randomUUID(),
            ...input,
            createdAt: new Date().toISOString()
        };
        this.reports.push(report);
        return report;
    }
    createNotification(input) {
        const notification = {
            id: randomUUID(),
            ...input,
            createdAt: new Date().toISOString()
        };
        this.notifications.push(notification);
        return notification;
    }
    markNotificationRead(notificationId, userId) {
        const notification = this.notifications.find((item) => item.id === notificationId && item.userId === userId);
        if (!notification)
            return undefined;
        notification.readAt = new Date().toISOString();
        return notification;
    }
    upsertSafetyEdge(actorId, targetId, edgeType) {
        const existing = this.safetyEdges.find((edge) => edge.actorId === actorId && edge.targetId === targetId && edge.edgeType === edgeType);
        if (existing)
            return existing;
        const edge = {
            actorId,
            targetId,
            edgeType,
            createdAt: new Date().toISOString()
        };
        this.safetyEdges.push(edge);
        return edge;
    }
    getSafety(actorId) {
        return this.safetyEdges.filter((edge) => edge.actorId === actorId);
    }
    isBlockedOrMuted(viewerId, authorId) {
        if (!viewerId)
            return false;
        return this.safetyEdges.some((edge) => edge.actorId === viewerId && edge.targetId === authorId);
    }
    follow(followerId, followeeId) {
        if (followerId === followeeId)
            return undefined;
        const existing = this.follows.find((edge) => edge.followerId === followerId && edge.followeeId === followeeId);
        if (existing)
            return existing;
        const edge = {
            followerId,
            followeeId,
            createdAt: new Date().toISOString()
        };
        this.follows.push(edge);
        return edge;
    }
    toggleLike(postId, userId) {
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
    addComment(postId, userId, text) {
        const comment = {
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
