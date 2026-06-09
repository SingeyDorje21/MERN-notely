import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import verifyToken from "../middleware/verifyToken.js";

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
      if (err) {
        console.error("Google OAuth authentication error:", err);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent(err.message || 'auth_failed')}`);
      }
      if (!user) {
        console.error("Google OAuth authentication failed: No user found/created. Info:", info);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=no_user`);
      }
      
      // Sign JWT with user ID
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      // Set httpOnly cookie
      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

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
