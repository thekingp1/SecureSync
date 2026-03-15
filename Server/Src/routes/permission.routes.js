import { Router } from "express";
import {shareFile, revokePermission, getPermissions} from "../controller/Permission.controller.js";
import { authRequired } from "../middlewares/auth.js";

const router = Router();

router.post("/:id/share", authRequired, shareFile);
router.delete("/:id/share/:targetUserId", authRequired, revokePermission);
router.get("/:id/permissions", authRequired, getPermissions);

export default router;