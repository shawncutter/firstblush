import { Router } from "express";
import { z } from "zod";
import { store } from "../lib/store.js";

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

meRouter.get("/me", (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const user = store.findUserById(req.actorId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user });
});

meRouter.patch("/me/profile", (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const parsed = profileBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
  }

  const user = store.updateUserProfile(req.actorId, parsed.data);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user });
});

meRouter.patch("/me/privacy", (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const parsed = privacyBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
  }

  const user = store.updateUserPrivacy(req.actorId, parsed.data);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user });
});
