import { Router } from "express";
import { store } from "../lib/store.js";
export const feedRouter = Router();
feedRouter.get("/feed", (req, res) => {
    const groupId = typeof req.query.groupId === "string" ? req.query.groupId : undefined;
    const actorId = req.actorId;
    let posts = store.posts;
    if (groupId) {
        posts = posts.filter((post) => post.groupId === groupId);
    }
    const visiblePosts = posts.filter((post) => {
        if (store.isBlockedOrMuted(actorId, post.userId)) {
            return false;
        }
        if (post.visibility === "public") {
            return true;
        }
        if (!post.groupId) {
            return false;
        }
        const group = store.groups.find((g) => g.id === post.groupId);
        if (!group) {
            return false;
        }
        return actorId ? group.members.has(actorId) : false;
    });
    const items = visiblePosts
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((post) => ({
        ...post,
        reactionCount: store.reactions.filter((reaction) => reaction.postId === post.id).length,
        likeCount: store.likes.filter((like) => like.postId === post.id).length,
        commentCount: store.comments.filter((comment) => comment.postId === post.id).length,
        author: store.findUserById(post.userId)
            ? {
                id: post.userId,
                displayName: store.findUserById(post.userId)?.displayName
            }
            : undefined
    }));
    res.json({
        strategy: "chronological",
        total: items.length,
        items
    });
});
