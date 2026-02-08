export {};

declare global {
  namespace Express {
    interface Request {
      actorId?: string;
    }
  }
}
