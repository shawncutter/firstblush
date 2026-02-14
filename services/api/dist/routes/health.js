import { Router } from "express";
import { dbPing } from "../db/client.js";
export const healthRouter = Router();
healthRouter.get("/health", async (_req, res) => {
    try {
        await dbPing();
        res.json({
            ok: true,
            service: "firstblush-api",
            database: "ok",
            timestamp: new Date().toISOString()
        });
    }
    catch {
        res.status(503).json({
            ok: false,
            service: "firstblush-api",
            database: "unavailable",
            timestamp: new Date().toISOString()
        });
    }
});
