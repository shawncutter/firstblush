import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { feedRouter } from "./routes/feed.js";
import { groupsRouter } from "./routes/groups.js";
import { healthRouter } from "./routes/health.js";
import { mediaRouter } from "./routes/media.js";
import { meRouter } from "./routes/me.js";
import { metricsRouter } from "./routes/metrics.js";
import { moderationRouter } from "./routes/moderation.js";
import { notificationsRouter } from "./routes/notifications.js";
import { postsRouter } from "./routes/posts.js";
import { reportsRouter } from "./routes/reports.js";
import { safetyRouter } from "./routes/safety.js";
import { socialRouter } from "./routes/social.js";
import { getUserFromToken } from "./lib/repository.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  app.use(async (req, _res, next) => {
    try {
      const bearer = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.substring("Bearer ".length)
        : undefined;
      const user = await getUserFromToken(bearer);
      if (user) {
        req.actorId = user.id;
      }
      next();
    } catch (error) {
      next(error);
    }
  });

  app.use("/v1", healthRouter);
  app.use("/v1", authRouter);
  app.use("/v1", meRouter);
  app.use("/v1", groupsRouter);
  app.use("/v1", mediaRouter);
  app.use("/v1", postsRouter);
  app.use("/v1", feedRouter);
  app.use("/v1", socialRouter);
  app.use("/v1", safetyRouter);
  app.use("/v1", reportsRouter);
  app.use("/v1", moderationRouter);
  app.use("/v1", notificationsRouter);
  app.use("/v1", metricsRouter);

  return app;
}
