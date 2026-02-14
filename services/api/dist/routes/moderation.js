import { Router } from "express";
import { z } from "zod";
import { createModerationAction, createNotification, listModerationQueue } from "../lib/repository.js";
export const moderationRouter = Router();
const actionBody = z.object({
    reportId: z.string().uuid(),
    action: z.enum(["reviewing", "dismissed", "remove_content", "ban_user"]),
    note: z.string().max(500).optional()
});
function isAdmin(req) {
    const incoming = typeof req.headers["x-admin-token"] === "string" ? req.headers["x-admin-token"] : "";
    const expected = process.env.ADMIN_TOKEN ?? "dev-admin-token";
    return incoming === expected;
}
moderationRouter.get("/moderation/queue", async (req, res) => {
    if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin token required" });
    }
    const statusParam = typeof req.query.status === "string" ? req.query.status : "all";
    const normalized = statusParam === "open" || statusParam === "reviewing" ? statusParam : "all";
    const queue = await listModerationQueue(normalized);
    return res.json({ queue, total: queue.length });
});
moderationRouter.post("/moderation/actions", async (req, res) => {
    if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin token required" });
    }
    const parsed = actionBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }
    const action = await createModerationAction({
        reportId: parsed.data.reportId,
        actorUserId: req.actorId,
        action: parsed.data.action,
        note: parsed.data.note
    });
    if (!action) {
        return res.status(404).json({ error: "Report not found" });
    }
    await createNotification({
        userId: action.reporterId,
        type: "moderation_updated",
        message: `Report ${action.reportId} status updated to ${action.status}`,
        contextId: action.reportId
    });
    return res.status(201).json({
        action: {
            reportId: action.reportId,
            status: action.status
        }
    });
});
