import { Router } from "express";
import { store } from "../lib/store.js";

export const notificationsRouter = Router();

notificationsRouter.get("/notifications", (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const notifications = store.notifications
    .filter((item) => item.userId === req.actorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return res.json({ notifications });
});

notificationsRouter.post("/notifications/:id/read", (req, res) => {
  if (!req.actorId) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const notification = store.markNotificationRead(req.params.id, req.actorId);
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }

  return res.json({ notification });
});
