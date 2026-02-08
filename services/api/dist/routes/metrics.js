import { Router } from "express";
import { store } from "../lib/store.js";
export const metricsRouter = Router();
metricsRouter.get("/creator/metrics", (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const ownedPosts = store.posts.filter((post) => post.userId === req.actorId);
    const ownedPostIds = new Set(ownedPosts.map((post) => post.id));
    const metrics = {
        posts: ownedPosts.length,
        reactionsReceived: store.reactions.filter((reaction) => ownedPostIds.has(reaction.postId)).length,
        likesReceived: store.likes.filter((like) => ownedPostIds.has(like.postId)).length,
        commentsReceived: store.comments.filter((comment) => ownedPostIds.has(comment.postId)).length,
        followers: store.follows.filter((edge) => edge.followeeId === req.actorId).length
    };
    return res.json({ metrics });
});
