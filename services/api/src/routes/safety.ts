import { Router } from "express";
import { getUserById, listSafetyEdges, upsertSafetyEdge } from "../lib/repository.js";

export const safetyRouter = Router();

safetyRouter.get("/safety", async (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const edges = await listSafetyEdges(req.actorId);
  return res.json({ edges });
});

safetyRouter.post("/safety/block/:userId", async (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const target = await getUserById(req.params.userId);
  if (!target) {
    return res.status(404).json({ error: "User not found" });
  }

  if (target.id === req.actorId) {
    return res.status(400).json({ error: "Cannot block yourself" });
  }

  const edge = await upsertSafetyEdge(req.actorId, target.id, "block");
  return res.status(201).json({ edge });
});

safetyRouter.post("/safety/mute/:userId", async (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const target = await getUserById(req.params.userId);
  if (!target) {
    return res.status(404).json({ error: "User not found" });
  }

  if (target.id === req.actorId) {
    return res.status(400).json({ error: "Cannot mute yourself" });
  }

  const edge = await upsertSafetyEdge(req.actorId, target.id, "mute");
  return res.status(201).json({ edge });
});
