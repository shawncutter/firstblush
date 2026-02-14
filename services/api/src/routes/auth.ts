import { Router } from "express";
import { z } from "zod";
import {
  createSession,
  createUser,
  getUserByProviderSubject,
  revokeSession,
  type AuthProvider
} from "../lib/repository.js";

export const authRouter = Router();

const authBody = z.object({
  idToken: z.string().min(8),
  displayName: z.string().min(1).max(40).optional()
});

async function socialAuth(provider: AuthProvider, idToken: string, displayName?: string) {
  // Development-safe stub: syntactic token validation only. Replace with provider signature verification.
  const providerSubject = `${provider}:${idToken.slice(0, 24)}`;
  let user = await getUserByProviderSubject(provider, providerSubject);

  if (!user) {
    user = await createUser(provider, providerSubject, displayName ?? `${provider}-user`);
  }

  const session = await createSession(user.id);
  return { user, session };
}

authRouter.post("/auth/apple", async (req, res) => {
  const parsed = authBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
  }

  const result = await socialAuth("apple", parsed.data.idToken, parsed.data.displayName);
  return res.status(201).json({
    token: result.session.token,
    user: result.user
  });
});

authRouter.post("/auth/google", async (req, res) => {
  const parsed = authBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
  }

  const result = await socialAuth("google", parsed.data.idToken, parsed.data.displayName);
  return res.status(201).json({
    token: result.session.token,
    user: result.user
  });
});

authRouter.post("/auth/logout", async (req, res) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.substring("Bearer ".length)
    : undefined;

  if (!bearer) {
    return res.status(401).json({ error: "Missing token" });
  }

  const revoked = await revokeSession(bearer);
  if (!revoked) {
    return res.status(404).json({ error: "Session not found" });
  }

  return res.status(200).json({ ok: true });
});
