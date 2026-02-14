import { Router } from "express";
import { createNotification, followUser, getUserById, listUsers } from "../lib/repository.js";

export const socialRouter = Router();

socialRouter.get("/users", async (_req, res) => {
  const users = await listUsers();
  return res.json({ users });
});

socialRouter.post("/users/:id/follow", async (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const followee = await getUserById(req.params.id);
  if (!followee) {
    return res.status(404).json({ error: "User not found" });
  }

  const edge = await followUser(req.actorId, followee.id);
  if (!edge) {
    return res.status(400).json({ error: "Cannot follow self" });
  }

  if (followee.id !== req.actorId) {
    await createNotification({
      userId: followee.id,
      type: "user_followed",
      message: "You have a new follower",
      contextId: req.actorId
    });
  }

  return res.status(201).json({ edge });
});
