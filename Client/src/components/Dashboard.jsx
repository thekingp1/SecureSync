import { useEffect, useState } from "react";
import { apiFetchAuditLogs, apiFetchAnomalyScores, apiFetchSessions } from "../api.js";

export default function Dashboard({ token, onBack }) {
  const [tab, setTab] = useState("audit");
  const [auditLogs, setAuditLogs] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    apiFetchAuditLogs(token).then(setAuditLogs).catch(() => {});
    apiFetchAnomalyScores(token).then(setAnomalies).catch(() => {});
    apiFetchSessions(token).then(setSessions).catch(() => {});
  }, []);

  const tabStyle = (t) => ({
    padding: "8px 20px", cursor: "pointer", border: "none",
    borderBottom: tab === t ? "2px solid #4472C4" : "2px solid transparent",
    background: "none", fontWeight: tab === t ? "bold" : "normal",
    fontSize: 14,
  });

  return (
    <div style={{ maxWidth: 1000, margin: "30px auto", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Dashboard</h2>
        <button onClick={onBack} style={{ padding: "8px 16px" }}>← חזרה</button>
      </div>

      {/* TABS */}
      <div style={{ borderBottom: "1px solid #ffffff", marginBottom: 20 }}>
        <button style={tabStyle("audit")} onClick={() => setTab("audit")}>
          Audit Logs ({auditLogs.length})
        </button>
        <button style={tabStyle("anomaly")} onClick={() => setTab("anomaly")}>
          Anomaly Scores ({anomalies.length})
        </button>
        <button style={tabStyle("sessions")} onClick={() => setTab("sessions")}>
          Active Sessions ({sessions.length})
        </button>
      </div>

      {/* AUDIT LOGS */}
      {tab === "audit" && (
        <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#00000000", textAlign: "left" }}>
              <th>User</th><th>action</th><th>result</th><th>IP</th><th>time</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((l, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td>{l.userId?.email ?? l.userId}</td>
                <td>{l.action}</td>
                <td style={{ color: l.outcome === "success" ? "green" : "red" }}>{l.outcome}</td>
                <td>{l.ip}</td>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {auditLogs.length === 0 && <tr><td colSpan="5">אין נתונים</td></tr>}
          </tbody>
        </table>
      )}

      {/* ANOMALY SCORES */}
      {tab === "anomaly" && (
        <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#00000000",textAlign: "left" }}>
              <th>User</th><th>action</th><th>Z-score</th><th>detail</th><th>time</th>
            </tr>
          </thead>
          <tbody>
            {anomalies.map((a, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #000000", background: a.score > 3 ? "#000000" : "#1e1e2e00", color: "#fff" }}>
                <td>{a.userId}</td>
                <td>{a.action}</td>
                <td style={{ color: a.score > 3 ? "red" : "orange", fontWeight: "bold" }}>{a.score}</td>
                <td>{a.details?.join(", ") || "—"}</td>
                <td>{new Date(a.detectedAt).toLocaleString()}</td>
              </tr>
            ))}
            {anomalies.length === 0 && <tr><td colSpan="5">אין חריגות</td></tr>}
          </tbody>
        </table>
      )}

      {/* SESSIONS */}
      {tab === "sessions" && (
        <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#00000000", textAlign: "left" }}>
              <th>User</th><th>IP</th><th>created</th><th>expiry</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #000000" }}>
                <td>{s.userId?.email ?? s.userId}</td>
                <td>{s.ip}</td>
                <td>{new Date(s.createdAt).toLocaleString()}</td>
                <td>{new Date(s.expiresAt).toLocaleString()}</td>
              </tr>
            ))}
            {sessions.length === 0 && <tr><td colSpan="4">אין סשנים פעילים</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}