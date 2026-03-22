import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

const clients = new Map();

export function initWebSocket(server){
    const wss = new WebSocketServer ({server});
    wss.on("connection", (ws,req)=>{
            const params = new URL(req.url, "http://localhost").searchParams;
            const token = params.get("token");
            let userId;
            try {
                const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
                userId = payload.id;
            } catch {
                ws.close();
                return;
            }
            clients.set(userId, ws);
            ws.on("close", () => {
                clients.delete(userId);
            });
        });
    }
export function sendToUser(userId, payload) {
  const ws = clients.get(userId);
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}
