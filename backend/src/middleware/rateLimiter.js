import jwt from "jsonwebtoken";
import ratelimit from "../config/upstash.js";

// Each signed-in user gets their own bucket; anonymous requests (login, OAuth)
// are bucketed by IP. This runs before verifyToken, so read the cookie here.
const rateLimitKey = (req) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      return `user:${jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] }).userId}`;
    } catch {
      // Invalid or expired token: treat as anonymous
    }
  }
  return `ip:${req.ip}`;
};

const rateLimiter = async (req, res, next) => {
  try {
    const { success } = await ratelimit.limit(rateLimitKey(req));

    if (!success) {
      return res.status(429).json({
        message: "Too many requests, please try again later",
      });
    }

    next();
  } catch (error) {
    console.warn("Rate limit error (degrading gracefully):", error.message || error);
    next(); // fall back and allow request to proceed
  }
};

export default rateLimiter;
