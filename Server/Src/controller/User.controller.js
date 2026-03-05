import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

export const register = async (req, res) => {
  try {
    const { email, name, password } = req.body || {};
    if (!email || !name || !password) {
      return res.status(400).json({ message: "Missing email/name/password", isSuccess: false });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists", isSuccess: false });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      name,
      password: hashed,
    });

    return res.json({
      isSuccess: true,
      user: { id: String(user._id), email: user.email, name: user.name },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "error to register user", isSuccess: false });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Missing email/password", isSuccess: false });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email not exist", isSuccess: false });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Invalid credentials", isSuccess: false });
    }

    const token = jwt.sign(
      { id: String(user._id), email: user.email },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "12h" }
    );

    return res.json({
      isSuccess: true,
      token,
      user: { id: String(user._id), email: user.email, name: user.name },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Error to login user", isSuccess: false });
  }
};