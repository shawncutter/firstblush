import { Router } from "express";
import { z } from "zod";
import { store } from "../lib/store.js";
export const reportsRouter = Router();
const reportBody = z.object({
    targetType: z.enum(["post", "reaction", "user"]),
    targetId: z.string().uuid(),
    reason: z.string().min(3).max(240)
});
reportsRouter.post("/reports", (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const parsed = reportBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }
    const report = store.createReport({
        reporterId: req.actorId,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        reason: parsed.data.reason
    });
    store.createNotification({
        userId: req.actorId,
        type: "report_created",
        message: "Your report has been submitted",
        contextId: report.id
    });
    return res.status(201).json({ report });
});
