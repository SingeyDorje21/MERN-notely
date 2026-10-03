import crypto from "node:crypto";

// OAuth `state` kept in a short-lived httpOnly cookie, so the Google callback
// can be tied to a sign-in this browser actually started (prevents login CSRF:
// an attacker signing a victim into the attacker's account). passport-oauth2's
// built-in stores need express-session, which this app doesn't use.
const COOKIE_NAME = "oauth_state";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax", // sent on Google's top-level redirect back to the callback
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth/google",
};

const sameState = (a, b) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

// Method arities matter: passport-oauth2 picks the call signature by arity
const cookieStateStore = {
  store(req, meta, callback) {
    const state = crypto.randomBytes(32).toString("base64url");
    req.res.cookie(COOKIE_NAME, state, { ...COOKIE_OPTIONS, maxAge: 10 * 60 * 1000 });
    callback(null, state);
  },

  verify(req, providedState, callback) {
    const expected = req.cookies?.[COOKIE_NAME];
    req.res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS); // single use
    if (typeof expected !== "string" || typeof providedState !== "string" || !sameState(expected, providedState)) {
      return callback(null, false, { message: "invalid_state" });
    }
    callback(null, true);
  },
};

export default cookieStateStore;
