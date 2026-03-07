import "dotenv/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User.model.js";
import crypto from "crypto";
import Session from "../models/Session.js";

console.log("EMAIL_HOST:", process.env.EMAIL_HOST);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000)); 
}

export async function register(req, res) {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password)
      return res.status(400).json({ message: "Missing fields" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already in use" });
    const hashed = await bcrypt.hash(password, 12);
    await User.create({ email, name, password: hashed });
    res.status(201).json({ message: "Registered successfully" });
  } catch (e) {
    console.error("Register error:", e);
    res.status(500).json({ message: "Server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const otp = generateOtp();
    user.otpCode = await bcrypt.hash(otp, 10);
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: "SecureSync – קוד אימות",
      text: `קוד האימות שלך: ${otp}\nהקוד תקף ל-5 דקות.`,
      html: `<p>קוד האימות שלך: <strong style="font-size:24px">${otp}</strong></p><p>הקוד תקף ל-5 דקות.</p>`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "Server error" });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user || !user.otpCode || !user.otpExpires)
      return res.status(401).json({ message: "No OTP requested" });
    if (new Date() > user.otpExpires)
      return res.status(401).json({ message: "OTP expired" });

    const match = await bcrypt.compare(otp, user.otpCode);
    if (!match) return res.status(401).json({ message: "Invalid OTP" });

    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    const jti = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8h

    const token = jwt.sign(
      { id: user._id, email: user.email, jti },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "8h" }
    );

    await Session.create({
      userId: user._id,
      jti,
      expiresAt,
      ip:        req.headers["x-forwarded-for"] || req.ip || null,
      userAgent: req.headers["user-agent"] || null,
    });

    res.json({ token });
  } catch (e) {
    console.error("VerifyOtp error:", e);
    res.status(500).json({ message: "Server error" });
  }
}
export async function logout(req, res) {
  try {
    const header = req.headers.authorization || "";
    const [, token] = header.split(" ");
    if (!token) return res.status(400).json({ message: "Missing token" });

    const decoded = jwt.decode(token);
    if (!decoded?.jti) return res.status(400).json({ message: "Invalid token" });

    await Session.findOneAndUpdate(
      { jti: decoded.jti },
      { revokedAt: new Date() }
    );

    res.json({ message: "Logged out successfully" });
  } catch (e) {
    console.error("Logout error:", e);
    res.status(500).json({ message: "Server error" });
  }
}

