import { Router } from "express";
import { upload, uploadVersion, listVersions, restoreVersion } from "../controller/FileVersion.controller.js";

const router = Router();

router.post("/:id/versions", upload.single("file"), uploadVersion);
router.get("/:id/versions", listVersions);
router.post("/:id/versions/:versionId/restore", restoreVersion);

export default router;
