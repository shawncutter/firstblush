import { Router } from "express";
import { listNotifications, markNotificationRead } from "../lib/repository.js";

export const notificationsRouter = Router();

notificationsRouter.get("/notifications", async (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const notifications = await listNotifications(req.actorId);
  return res.json({ notifications });
});

notificationsRouter.post("/notifications/:id/read", async (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const notification = await markNotificationRead(req.params.id, req.actorId);
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }

  return res.json({ notification });
});
