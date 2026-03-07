import { Router } from "express";
import { upload, uploadFile, listFiles, downloadFile, deleteFile } from "../controller/File.controller.js";

const router = Router();

router.post("/upload", upload.single("file"), uploadFile);
router.get("/", listFiles);
router.get("/:id/download", downloadFile);
router.delete("/:id", deleteFile);

export default router;
