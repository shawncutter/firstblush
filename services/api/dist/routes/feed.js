import { Router } from "express";
import { listFeed } from "../lib/repository.js";
export const feedRouter = Router();
feedRouter.get("/feed", async (req, res) => {
    const groupId = typeof req.query.groupId === "string" ? req.query.groupId : undefined;
    const actorId = req.actorId;
    const items = await listFeed(actorId, groupId);
    res.json({
        strategy: "chronological",
        total: items.length,
        items
    });
});
