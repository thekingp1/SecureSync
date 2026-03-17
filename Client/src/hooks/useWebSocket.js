import { useEffect } from "react";
import { API_BASE } from "../api.js";

export function useWebSocket(stage, getToken, onMessage) {
  useEffect(() => {
    if (stage !== "files") return;
    const token = getToken();
    if (!token) return;
    const wsUrl = API_BASE.replace("http", "ws");
    const ws = new WebSocket(`${wsUrl}?token=${token}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    ws.onerror = () => console.log("WS error");
    return () => ws.close();
  }, [stage]);
}
