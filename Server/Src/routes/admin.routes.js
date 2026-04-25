import { Router } from "express";
import { authRequired } from "../middlewares/auth.js"
import { getAuditLogs, getAnomalyScores, getActiveSessions } from "../controller/admin.controller.js";

const router = Router();

router.get("/auditlogs", authRequired, getAuditLogs);
router.get("/anomalyscores", authRequired, getAnomalyScores);
router.get("/sessions", authRequired, getActiveSessions);

export default router;