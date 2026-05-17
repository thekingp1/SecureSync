import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import https from "https";
import fs from "fs";
import path from "path";
import filesRouter from "./routes/files.js";
import userRoutes from "./routes/User.routes.js";
import { authRequired } from "./middlewares/auth.js";
import permissionRouter from "./routes/permission.routes.js";
import fileVersionRouter from "./routes/FileVersion.routes.js";
import { initWebSocket } from "./utils/websocket.js";
import adminRouter from "./routes/admin.routes.js";
import deviceRouter from "./routes/device.routes.js";




dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/files", authRequired, filesRouter);
app.use("/users", userRoutes);
app.use("/files", authRequired, permissionRouter);
app.use("/files", authRequired, fileVersionRouter);
app.use("/admin", authRequired, adminRouter);
app.use("/devices", deviceRouter);


const PORT = process.env.PORT || 4000;

const certDir = path.resolve(process.cwd());
const tlsOptions = {
  key:  fs.readFileSync(path.join(certDir, "key.pem")),
  cert: fs.readFileSync(path.join(certDir, "cert.pem")),
  minVersion: "TLSv1.3",
};

async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  const server = https.createServer(tlsOptions, app);
  server.listen(PORT, () => console.log(`Server running on https://localhost:${PORT}`));
  initWebSocket(server);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});