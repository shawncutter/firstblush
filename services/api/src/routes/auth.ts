import { Router } from "express";
import { z } from "zod";
import { store, type AuthProvider } from "../lib/store.js";

export const authRouter = Router();

const authBody = z.object({
  idToken: z.string().min(8),
  displayName: z.string().min(1).max(40).optional()
});

function socialAuth(provider: AuthProvider, idToken: string, displayName?: string) {
  // This is a development stub. Real provider token verification is required before public launch.
  const providerSubject = `${provider}:${idToken.slice(0, 24)}`;
  let user = store.findUserByProviderSubject(provider, providerSubject);

  if (!user) {
    user = store.createUser(provider, providerSubject, displayName ?? `${provider}-user`);
  }

  const session = store.createSession(user.id);
  return { user, session };
}

authRouter.post("/auth/apple", (req, res) => {
  const parsed = authBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
  }

  const result = socialAuth("apple", parsed.data.idToken, parsed.data.displayName);
  return res.status(201).json({
    token: result.session.token,
    user: result.user
  });
});

authRouter.post("/auth/google", (req, res) => {
  const parsed = authBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
  }

  const result = socialAuth("google", parsed.data.idToken, parsed.data.displayName);
  return res.status(201).json({
    token: result.session.token,
    user: result.user
  });
});

authRouter.post("/auth/logout", (req, res) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.substring("Bearer ".length)
    : undefined;

  if (!bearer) {
    return res.status(401).json({ error: "Missing token" });
  }

  const revoked = store.revokeSession(bearer);
  if (!revoked) {
    return res.status(404).json({ error: "Session not found" });
  }

  return res.status(200).json({ ok: true });
});
