import { Router } from "express";
import { z } from "zod";
import { canViewPost, createNotification, createPost, createReaction, getMediaById, getPostById, getPostEngagementCounts, getReactionById, getReactionChain, getUserById, isGroupMember, listComments, sharePost, toggleLike, addComment, trackPostView } from "../lib/repository.js";
export const postsRouter = Router();
const createPostBody = z
    .object({
    groupId: z.string().uuid().optional(),
    caption: z.string().max(280).default(""),
    videoUrl: z.string().url().optional(),
    mediaUploadId: z.string().uuid().optional(),
    visibility: z.enum(["public", "group"]).optional()
})
    .refine((value) => Boolean(value.videoUrl || value.mediaUploadId), {
    message: "Either videoUrl or mediaUploadId is required"
});
const createReactionBody = z.object({
    videoUrl: z.string().url(),
    parentReactionId: z.string().uuid().optional()
});
const createCommentBody = z.object({
    text: z.string().min(1).max(280)
});
postsRouter.post("/posts", async (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const parsed = createPostBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }
    if (parsed.data.groupId) {
        const isMember = await isGroupMember(parsed.data.groupId, req.actorId);
        if (!isMember) {
            return res.status(403).json({ error: "Must be a group member to post in this group" });
        }
    }
    const actor = await getUserById(req.actorId);
    if (!actor) {
        return res.status(404).json({ error: "User not found" });
    }
    let videoUrl = parsed.data.videoUrl;
    if (!videoUrl && parsed.data.mediaUploadId) {
        const media = await getMediaById(parsed.data.mediaUploadId, req.actorId);
        if (!media || media.status !== "ready" || !media.videoUrl) {
            return res.status(400).json({ error: "Media upload is not ready" });
        }
        videoUrl = media.videoUrl;
    }
    const post = await createPost({
        userId: req.actorId,
        groupId: parsed.data.groupId,
        caption: parsed.data.caption,
        videoUrl: videoUrl,
        visibility: parsed.data.visibility ?? actor.defaultPostVisibility
    });
    return res.status(201).json({ post });
});
postsRouter.get("/posts/:id", async (req, res) => {
    const post = await getPostById(req.params.id);
    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }
    const visible = await canViewPost(post, req.actorId);
    if (!visible) {
        return res.status(403).json({ error: "You do not have access to this post" });
    }
    await trackPostView(post.id, req.actorId);
    const counts = await getPostEngagementCounts(post.id);
    return res.json({
        post,
        ...counts
    });
});
postsRouter.post("/posts/:id/reactions", async (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const post = await getPostById(req.params.id);
    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }
    const visible = await canViewPost(post, req.actorId);
    if (!visible) {
        return res.status(403).json({ error: "You do not have access to this post" });
    }
    const parsed = createReactionBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }
    if (parsed.data.parentReactionId) {
        const parent = await getReactionById(parsed.data.parentReactionId);
        if (!parent || parent.postId !== post.id) {
            return res.status(404).json({ error: "Parent reaction not found for this post" });
        }
    }
    const reaction = await createReaction({
        postId: post.id,
        parentReactionId: parsed.data.parentReactionId,
        userId: req.actorId,
        videoUrl: parsed.data.videoUrl
    });
    if (post.userId !== req.actorId) {
        await createNotification({
            userId: post.userId,
            type: "post_reacted",
            message: "Someone reacted to your post",
            contextId: post.id
        });
    }
    return res.status(201).json({ reaction });
});
postsRouter.get("/posts/:id/reaction-chain", async (req, res) => {
    const post = await getPostById(req.params.id);
    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }
    const visible = await canViewPost(post, req.actorId);
    if (!visible) {
        return res.status(403).json({ error: "You do not have access to this post" });
    }
    const chain = await getReactionChain(post.id, req.actorId);
    return res.json({
        postId: post.id,
        total: chain.length,
        chain
    });
});
postsRouter.post("/posts/:id/like", async (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const post = await getPostById(req.params.id);
    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }
    const visible = await canViewPost(post, req.actorId);
    if (!visible) {
        return res.status(403).json({ error: "You do not have access to this post" });
    }
    const result = await toggleLike(post.id, req.actorId);
    if (result.liked && post.userId !== req.actorId) {
        await createNotification({
            userId: post.userId,
            type: "post_liked",
            message: "Someone liked your post",
            contextId: post.id
        });
    }
    return res.json(result);
});
postsRouter.post("/posts/:id/share", async (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const post = await getPostById(req.params.id);
    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }
    const visible = await canViewPost(post, req.actorId);
    if (!visible) {
        return res.status(403).json({ error: "You do not have access to this post" });
    }
    const result = await sharePost(post.id, req.actorId);
    if (result.shared && post.userId !== req.actorId) {
        await createNotification({
            userId: post.userId,
            type: "post_shared",
            message: "Someone shared your post",
            contextId: post.id
        });
    }
    return res.json(result);
});
postsRouter.post("/posts/:id/comments", async (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const post = await getPostById(req.params.id);
    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }
    const visible = await canViewPost(post, req.actorId);
    if (!visible) {
        return res.status(403).json({ error: "You do not have access to this post" });
    }
    const parsed = createCommentBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }
    const comment = await addComment(post.id, req.actorId, parsed.data.text);
    if (post.userId !== req.actorId) {
        await createNotification({
            userId: post.userId,
            type: "post_commented",
            message: "Someone commented on your post",
            contextId: post.id
        });
    }
    return res.status(201).json({ comment });
});
postsRouter.get("/posts/:id/comments", async (req, res) => {
    const post = await getPostById(req.params.id);
    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }
    const visible = await canViewPost(post, req.actorId);
    if (!visible) {
        return res.status(403).json({ error: "You do not have access to this post" });
    }
    const comments = await listComments(post.id);
    return res.json({ comments });
});
