// CSRF defence for cookie-authenticated writes. SameSite=Lax already keeps the
// auth cookie off cross-site requests, but not off "same-site" ones (another
// localhost port, a sibling subdomain), so state-changing requests must also
// come from the app itself.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const requireTrustedOrigin = (allowedOrigins) => (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get("origin");
  // Browsers always send Origin on cross-origin writes. A request without one
  // comes from a non-browser client, which can't ride on a victim's cookies.
  if (!origin) return next();

  if (allowedOrigins.includes(origin)) return next();

  // Same-origin requests (the production build is served by this server)
  try {
    if (new URL(origin).host === req.get("host")) return next();
  } catch {
    // "null" or otherwise unparseable origins are refused below
  }

  return res.status(403).json({ message: "Forbidden" });
};

export default requireTrustedOrigin;
