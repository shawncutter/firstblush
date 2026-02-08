import { Router } from "express";
import { z } from "zod";
import { store } from "../lib/store.js";
export const postsRouter = Router();
const createPostBody = z.object({
    groupId: z.string().uuid().optional(),
    caption: z.string().max(280).default(""),
    videoUrl: z.string().url(),
    visibility: z.enum(["public", "group"]).optional()
});
const createReactionBody = z.object({
    videoUrl: z.string().url(),
    parentReactionId: z.string().uuid().optional()
});
const createCommentBody = z.object({
    text: z.string().min(1).max(280)
});
postsRouter.post("/posts", (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const parsed = createPostBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }
    if (parsed.data.groupId) {
        const group = store.groups.find((g) => g.id === parsed.data.groupId);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }
        if (!group.members.has(req.actorId)) {
            return res.status(403).json({ error: "Must be a group member to post in this group" });
        }
    }
    const actor = store.findUserById(req.actorId);
    if (!actor) {
        return res.status(404).json({ error: "User not found" });
    }
    const post = store.createPost({
        userId: req.actorId,
        groupId: parsed.data.groupId,
        caption: parsed.data.caption,
        videoUrl: parsed.data.videoUrl,
        visibility: parsed.data.visibility ?? actor.defaultPostVisibility
    });
    return res.status(201).json({ post });
});
postsRouter.get("/posts/:id", (req, res) => {
    const post = store.posts.find((p) => p.id === req.params.id);
    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }
    const likeCount = store.likes.filter((like) => like.postId === post.id).length;
    const commentCount = store.comments.filter((comment) => comment.postId === post.id).length;
    const reactionCount = store.reactions.filter((reaction) => reaction.postId === post.id).length;
    return res.json({ post, likeCount, commentCount, reactionCount });
});
postsRouter.post("/posts/:id/reactions", (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const post = store.posts.find((p) => p.id === req.params.id);
    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }
    const parsed = createReactionBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }
    if (parsed.data.parentReactionId) {
        const parent = store.reactions.find((r) => r.id === parsed.data.parentReactionId && r.postId === post.id);
        if (!parent) {
            return res.status(404).json({ error: "Parent reaction not found for this post" });
        }
    }
    const reaction = store.createReaction({
        postId: post.id,
        parentReactionId: parsed.data.parentReactionId,
        userId: req.actorId,
        videoUrl: parsed.data.videoUrl
    });
    if (post.userId !== req.actorId) {
        store.createNotification({
            userId: post.userId,
            type: "post_reacted",
            message: "Someone reacted to your post",
            contextId: post.id
        });
    }
    return res.status(201).json({ reaction });
});
postsRouter.get("/posts/:id/reaction-chain", (req, res) => {
    const post = store.posts.find((p) => p.id === req.params.id);
    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }
    // Stacked-carousel ready: return a stable, chronological chain list.
    const chain = store.reactions
        .filter((r) => r.postId === post.id)
        .filter((r) => !store.isBlockedOrMuted(req.actorId, r.userId))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((r, index) => ({
        ...r,
        position: index + 1
    }));
    return res.json({
        postId: post.id,
        total: chain.length,
        chain
    });
});
postsRouter.post("/posts/:id/like", (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const post = store.posts.find((p) => p.id === req.params.id);
    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }
    const result = store.toggleLike(post.id, req.actorId);
    if (result.liked && post.userId !== req.actorId) {
        store.createNotification({
            userId: post.userId,
            type: "post_liked",
            message: "Someone liked your post",
            contextId: post.id
        });
    }
    return res.json(result);
});
postsRouter.post("/posts/:id/comments", (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const post = store.posts.find((p) => p.id === req.params.id);
    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }
    const parsed = createCommentBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }
    const comment = store.addComment(post.id, req.actorId, parsed.data.text);
    if (post.userId !== req.actorId) {
        store.createNotification({
            userId: post.userId,
            type: "post_commented",
            message: "Someone commented on your post",
            contextId: post.id
        });
    }
    return res.status(201).json({ comment });
});
postsRouter.get("/posts/:id/comments", (req, res) => {
    const post = store.posts.find((p) => p.id === req.params.id);
    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }
    const comments = store.comments
        .filter((item) => item.postId === post.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return res.json({ comments });
});
