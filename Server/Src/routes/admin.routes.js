import { Router } from "express";
import { authRequired } from "../middlewares/auth.js";
import {
  getAuditLogs, getAnomalyScores, getActiveSessions,
  blockDevice, unblockDevice, getBlockRules,
  getUsers, blockUser
} from "../controller/admin.controller.js";

const router = Router();

router.get("/auditlogs",      authRequired, getAuditLogs);
router.get("/anomalyscores",  authRequired, getAnomalyScores);
router.get("/sessions",       authRequired, getActiveSessions);
router.post("/block",         authRequired, blockDevice);
router.delete("/block/:id",   authRequired, unblockDevice);
router.get("/blocks",         authRequired, getBlockRules);
router.get("/users",          authRequired, getUsers);
router.post("/block-user",    authRequired, blockUser);

export default router; 