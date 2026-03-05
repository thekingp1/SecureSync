import { Router } from "express";
import { register, login, verifyOtp } from "../controller/User.controller.js";

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);

export default router;
