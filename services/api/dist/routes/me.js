import { Router } from "express";
import { z } from "zod";
import { getUserById, updateUserPrivacy, updateUserProfile } from "../lib/repository.js";
export const meRouter = Router();
const profileBody = z.object({
    displayName: z.string().min(1).max(40).optional(),
    bio: z.string().max(280).optional(),
    avatarUrl: z.string().url().optional(),
    interests: z.array(z.string().min(1).max(40)).max(12).optional()
});
const privacyBody = z.object({
    defaultPostVisibility: z.enum(["public", "group"]).optional()
});
meRouter.get("/me", async (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const user = await getUserById(req.actorId);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    return res.json({ user });
});
meRouter.patch("/me/profile", async (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const parsed = profileBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }
    const user = await updateUserProfile(req.actorId, parsed.data);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    return res.json({ user });
});
meRouter.patch("/me/privacy", async (req, res) => {
    if (!req.actorId) {
        return res.status(401).json({ error: "Missing or invalid token" });
    }
    const parsed = privacyBody.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }
    const user = await updateUserPrivacy(req.actorId, parsed.data);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    return res.json({ user });
});
