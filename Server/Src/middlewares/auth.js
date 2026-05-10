import jwt from "jsonwebtoken";
import Session from "../models/Session.js";
import BlockRule from "../models/BlockRule.js";
import mongoose from "mongoose";

export async function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token)
    return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");

    const session = await Session.findOne({ jti: payload.jti });

    if (!session)
      return res.status(401).json({ message: "Session not found" });
    if (session.revokedAt)
      return res.status(401).json({ message: "Session revoked" });

    const blocked = await BlockRule.findOne({
      active: true,
      userId: new mongoose.Types.ObjectId(payload.id),
    });
    if (blocked)
      return res.status(403).json({ message: "User is blocked", reason: blocked.reason });

    req.user = payload;
    return next();
  } catch (e) {
    console.log("AUTH - error:", e.message);
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}

