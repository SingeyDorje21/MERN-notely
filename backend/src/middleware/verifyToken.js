import jwt from "jsonwebtoken";
import User from "../models/User.js";

const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized — no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-__v");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized — user not found" });
    }

    // Rolling refresh: if token expires in < 24 hours, re-sign and set a new cookie
    const timeUntilExpiry = decoded.exp * 1000 - Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (timeUntilExpiry < twentyFourHours) {
      const newToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("token", newToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(401).json({ message: "Unauthorized — invalid token" });
  }
};

export default verifyToken;
