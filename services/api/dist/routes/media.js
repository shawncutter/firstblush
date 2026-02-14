import { Router } from "express";
import { z } from "zod";
import { completeMediaUpload, createMediaUpload } from "../lib/repository.js";
export const mediaRouter = Router();
const initBody = z.object({
    contentType: z.string().min(3).max(120),
    fileName: z.string().min(1).max(240).optional()
});
const completeBody = z.object({
    uploadId: z.string().uuid(),
    publicUrl: z.string().url().optional()
});
mediaRouter.post("/media/uploads/init", async (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const parsed = initBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }
    const upload = await createMediaUpload({
        ownerId: req.actorId,
        contentType: parsed.data.contentType,
        fileName: parsed.data.fileName
    });
    return res.status(201).json({ upload });
});
mediaRouter.post("/media/uploads/complete", async (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const parsed = completeBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }
    const media = await completeMediaUpload({
        uploadId: parsed.data.uploadId,
        ownerId: req.actorId,
        publicUrl: parsed.data.publicUrl
    });
    if (!media) {
        return res.status(404).json({ error: "Upload not found" });
    }
    return res.json({ media });
});
