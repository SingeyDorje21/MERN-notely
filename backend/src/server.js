import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import passport from "passport";
import { fileURLToPath } from "url";

import notesRoutes from "./routes/notesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import devAuthRoutes, { isDevLoginEnabled } from "./routes/devAuthRoutes.js";
import { connectDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import requireTrustedOrigin from "./middleware/requireTrustedOrigin.js";
import errorHandler from "./middleware/errorHandler.js";
import "./config/passport.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const __dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

// middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"], // Radix sets inline styles
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "https://*.googleusercontent.com"], // Google profile photos
        "connect-src": ["'self'"],
        "frame-ancestors": ["'none'"],
        "upgrade-insecure-requests": null, // local production runs are plain http
      },
    },
  })
);
app.use(compression()); // gzip API responses and static files
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    exposedHeaders: ["X-Total-Count"], // lets the dev frontend (other origin) read the pagination total
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "100kb" })); // this middleware will parse JSON bodies: req.body
app.use(requireTrustedOrigin([CLIENT_URL]));
app.use(passport.initialize());
app.use(rateLimiter);

app.use("/api/auth", authRoutes);
if (isDevLoginEnabled()) {
  console.warn("DEV_LOGIN is enabled: POST /api/auth/dev-login signs in without Google (localhost only)");
  app.use("/api/auth", devAuthRoutes);
}
app.use("/api/notes", notesRoutes);
app.use("/api", (req, res) => res.status(404).json({ message: "Not found" }));

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/dist/index.html"));
  });
}

app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
