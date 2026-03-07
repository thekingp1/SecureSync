import { Router } from "express";
import { register, login, verifyOtp, logout } from "../controller/User.controller.js";
import { authRequired } from "../middlewares/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/logout", authRequired, logout);

export default router;
