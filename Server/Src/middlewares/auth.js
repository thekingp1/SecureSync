import jwt from "jsonwebtoken";
import Session from "../models/Session.js";

export async function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");  
  if (type !== "Bearer" || !token)
    return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    console.log("AUTH - payload:", payload);

    const session = await Session.findOne({ jti: payload.jti });
    console.log("AUTH - session:", session);
    
    if (!session)
      return res.status(401).json({ message: "Session not found" });
    if (session.revokedAt)
      return res.status(401).json({ message: "Session revoked" });

    req.user = payload;
    return next();
  } catch (e) {
    console.log("AUTH - error:", e.message);
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}

