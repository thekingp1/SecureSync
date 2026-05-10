import { Router } from "express";
import { authRequired } from "../middlewares/auth.js"
import { heartbeat, getDevices } from "../controller/device.controller.js";

const router = Router();

router.post("/heartbeat", authRequired, heartbeat);
router.get("/", authRequired, getDevices);

export default router;