import { Router } from "express";
import { store } from "../lib/store.js";

export const socialRouter = Router();

socialRouter.get("/users", (_req, res) => {
  const users = store.users.map((user) => ({
    id: user.id,
    displayName: user.displayName,
    bio: user.bio,
    interests: user.interests,
    createdAt: user.createdAt
  }));

  return res.json({ users });
});

socialRouter.post("/users/:id/follow", (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const followee = store.findUserById(req.params.id);
  if (!followee) {
    return res.status(404).json({ error: "User not found" });
  }

  const edge = store.follow(req.actorId, followee.id);
  if (!edge) {
    return res.status(400).json({ error: "Cannot follow self" });
  }

  if (followee.id !== req.actorId) {
    store.createNotification({
      userId: followee.id,
      type: "user_followed",
      message: "You have a new follower",
      contextId: req.actorId
    });
  }

  return res.status(201).json({ edge });
});
