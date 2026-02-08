import { Router } from "express";
import { z } from "zod";
import { store } from "../lib/store.js";

export const groupsRouter = Router();

const createGroupBody = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(1).max(280)
});

groupsRouter.get("/groups", (_req, res) => {
  const groups = store.groups.map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    ownerId: group.ownerId,
    memberCount: group.members.size,
    joinRequestCount: group.joinRequests.size,
    createdAt: group.createdAt
  }));
  res.json({ groups });
});

groupsRouter.post("/groups", (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const parsed = createGroupBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
  }

  const group = store.createGroup(req.actorId, parsed.data.name, parsed.data.description);
  return res.status(201).json({
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      ownerId: group.ownerId,
      createdAt: group.createdAt
    }
  });
});

groupsRouter.post("/groups/:id/request-join", (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const group = store.groups.find((g) => g.id === req.params.id);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  if (group.members.has(req.actorId)) {
    return res.status(409).json({ error: "Already a member" });
  }

  group.joinRequests.add(req.actorId);
  store.createNotification({
    userId: group.ownerId,
    type: "group_join_requested",
    message: "A user requested to join your group",
    contextId: group.id
  });

  return res.status(202).json({ status: "pending_approval" });
});

groupsRouter.post("/groups/:id/approve/:userId", (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const group = store.groups.find((g) => g.id === req.params.id);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  if (group.ownerId !== req.actorId) {
    return res.status(403).json({ error: "Only the group owner can approve requests" });
  }

  const candidateUserId = req.params.userId;
  if (!group.joinRequests.has(candidateUserId)) {
    return res.status(404).json({ error: "Join request not found" });
  }

  group.joinRequests.delete(candidateUserId);
  group.members.add(candidateUserId);
  store.createNotification({
    userId: candidateUserId,
    type: "group_join_approved",
    message: `Your request to join ${group.name} was approved`,
    contextId: group.id
  });
  return res.status(200).json({ status: "approved" });
});

groupsRouter.get("/groups/:id", (req, res) => {
  const group = store.groups.find((g) => g.id === req.params.id);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  return res.json({
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      ownerId: group.ownerId,
      memberIds: Array.from(group.members),
      joinRequestIds: Array.from(group.joinRequests),
      createdAt: group.createdAt
    }
  });
});
