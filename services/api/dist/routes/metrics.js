import { Router } from "express";
import { listCreatorMetrics } from "../lib/repository.js";
export const metricsRouter = Router();
metricsRouter.get("/creator/metrics", async (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const metrics = await listCreatorMetrics(req.actorId);
    return res.json({ metrics });
});
