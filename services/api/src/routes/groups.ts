import { Router } from "express";
import { z } from "zod";
import {
  approveGroupJoin,
  createGroup,
  createNotification,
  getGroupById,
  listGroups,
  requestGroupJoin
} from "../lib/repository.js";

export const groupsRouter = Router();

const createGroupBody = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(1).max(280)
});

groupsRouter.get("/groups", async (_req, res) => {
  const groups = await listGroups();
  res.json({ groups });
});

groupsRouter.post("/groups", async (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const parsed = createGroupBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
  }

  const group = await createGroup(req.actorId, parsed.data.name, parsed.data.description);
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

groupsRouter.post("/groups/:id/request-join", async (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const status = await requestGroupJoin(req.params.id, req.actorId);
  if (status === "group_not_found") {
    return res.status(404).json({ error: "Group not found" });
  }
  if (status === "already_member") {
    return res.status(409).json({ error: "Already a member" });
  }
  if (status === "already_pending") {
    return res.status(409).json({ error: "Join request already pending" });
  }

  const group = await getGroupById(req.params.id);
  if (group) {
    await createNotification({
      userId: group.ownerId,
      type: "group_join_requested",
      message: "A user requested to join your group",
      contextId: group.id
    });
  }

  return res.status(202).json({ status: "pending_approval" });
});

groupsRouter.post("/groups/:id/approve/:userId", async (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const status = await approveGroupJoin(req.params.id, req.actorId, req.params.userId);

  if (status === "group_not_found") {
    return res.status(404).json({ error: "Group not found" });
  }

  if (status === "not_owner") {
    return res.status(403).json({ error: "Only the group owner can approve requests" });
  }

  if (status === "join_not_found") {
    return res.status(404).json({ error: "Join request not found" });
  }

  const group = await getGroupById(req.params.id);
  if (group) {
    await createNotification({
      userId: req.params.userId,
      type: "group_join_approved",
      message: `Your request to join ${group.name} was approved`,
      contextId: group.id
    });
  }

  return res.status(200).json({ status: "approved" });
});

groupsRouter.get("/groups/:id", async (req, res) => {
  const group = await getGroupById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  return res.json({ group });
});
