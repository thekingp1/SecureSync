import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import filesRouter from "./routes/files.js";
import userRoutes from "./routes/User.routes.js";
import { authRequired } from "./middlewares/auth.js";
import permissionRouter from "./routes/permission.routes.js";
import fileVersionRouter from "./routes/FileVersion.routes.js";
import { initWebSocket } from "./utils/websocket.js";
import adminRouter from "./routes/admin.routes.js";




dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/files", authRequired, filesRouter);
app.use("/users", userRoutes);
app.use("/files", authRequired, permissionRouter);
app.use("/files", authRequired, fileVersionRouter);
app.use("/admin", authRequired, adminRouter);

const PORT = process.env.PORT || 4000;

async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  const httpserver = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  initWebSocket(httpserver);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});