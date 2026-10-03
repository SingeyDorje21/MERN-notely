import express from "express";
import User from "../models/User.js";
import { issueAuthCookie } from "../utils/authCookie.js";

// Local development sign-in that skips Google OAuth.
// Only mounted when DEV_LOGIN=true, and each request must come straight from
// this machine (loopback, not through a proxy).
const router = express.Router();

const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

export const DEV_USER = {
  googleId: "dev-local-user",
  email: "dev@localhost.test",
  displayName: "Local Developer",
};

export const isDevLoginEnabled = () => process.env.DEV_LOGIN === "true";

// Loopback socket, no proxy headers, and a localhost Host: a reverse proxy on
// the same machine connects from 127.0.0.1 but forwards the public Host.
// Cross-origin browser requests are already refused by requireTrustedOrigin.
const isDirectLocalRequest = (req) =>
  LOOPBACK_ADDRESSES.has(req.socket.remoteAddress) &&
  LOCAL_HOSTNAMES.has(req.hostname) &&
  !req.headers["x-forwarded-for"] &&
  !req.headers["forwarded"];

// POST /auth/dev-login — sign in as the local dev user
router.post("/dev-login", async (req, res) => {
  if (!isDirectLocalRequest(req)) {
    return res.status(404).json({ message: "Not found" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { googleId: DEV_USER.googleId },
      { $setOnInsert: DEV_USER },
      { upsert: true, new: true }
    );
    issueAuthCookie(res, user._id);
    res.json({ message: "Signed in as local dev user" });
  } catch (error) {
    console.error("Error in dev login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
