import express from "express";
import passport from "passport";
import verifyToken from "../middleware/verifyToken.js";
import { issueAuthCookie } from "../utils/authCookie.js";

const router = express.Router();

// GET /auth/google — Initiate Google OAuth flow
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// GET /auth/google/callback — Handle Google OAuth callback
router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      // Only fixed error codes go in the URL; details stay in the server log
      if (err) {
        console.error("Google OAuth authentication error:", err);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
      }
      if (!user) {
        console.error("Google OAuth authentication failed. Info:", info);
        const code = info?.message === "invalid_state" ? "auth_failed" : "no_user";
        return res.redirect(`${process.env.CLIENT_URL}/login?error=${code}`);
      }
      
      issueAuthCookie(res, user._id);

      // Redirect to frontend
      res.redirect(process.env.CLIENT_URL);
    })(req, res, next);
  }
);

// GET /auth/me — Return currently authenticated user
router.get("/me", verifyToken, (req, res) => {
  res.json({
    _id: req.user._id,
    email: req.user.email,
    displayName: req.user.displayName,
    avatar: req.user.avatar,
  });
});

// POST /auth/logout — Clear token cookie
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ message: "Logged out" });
});

export default router;
