import { useEffect, useState } from "react";
import { apiFetchAuditLogs, apiFetchAnomalyScores, apiFetchSessions, apiFetchDevices, apiBlockDevice, apiFetchBlockRules, apiUnblockDevice, apiFetchUsers, apiBlockUser } from "../api.js";

export default function Dashboard({ token, onBack }) {
  const [tab, setTab] = useState("audit");
  const [auditLogs, setAuditLogs] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [devices, setDevices] = useState([]);
  const [blockRules, setBlockRules] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    apiFetchAuditLogs(token).then(setAuditLogs).catch(() => { });
    apiFetchAnomalyScores(token).then(setAnomalies).catch(() => { });
    apiFetchSessions(token).then(setSessions).catch(() => { });
    apiFetchDevices(token).then(setDevices).catch(() => { });
    apiFetchBlockRules(token).then(setBlockRules).catch(() => {});
    apiFetchUsers(token).then(setUsers).catch(() => {});
  }, []);

  const tabStyle = (t) => ({
    padding: "8px 20px", cursor: "pointer", border: "none",
    borderBottom: tab === t ? "2px solid #4472C4" : "2px solid transparent",
    background: "none", fontWeight: tab === t ? "bold" : "normal",
    fontSize: 14,
  });
  async function handleBlock(device) {
  const reason = prompt("סיבת החסימה:") || "Manual block";
  await apiBlockDevice(token, device.hostname, device.ipAddress, reason);
  apiFetchBlockRules(token).then(setBlockRules);
  alert(`${device.hostname} נחסם`);
}

function isBlocked(device) {
  return blockRules.find(r => r.hostname === device.hostname || r.ipAddress === device.ipAddress);
}

async function handleUnblock(blockRule) {
  await apiUnblockDevice(token, blockRule._id);
  apiFetchBlockRules(token).then(setBlockRules);
  alert("החסימה הוסרה");
}

function isUserBlocked(user) {
  return blockRules.find(r => r.userId === user._id);
}

async function handleBlockUser(user) {
  const reason = prompt("סיבת החסימה:") || "Manual block";
  await apiBlockUser(token, user._id, reason);
  apiFetchBlockRules(token).then(setBlockRules);
  alert(`${user.email} נחסם`);
}

async function handleUnblockUser(blockRule) {
  await apiUnblockDevice(token, blockRule._id);
  apiFetchBlockRules(token).then(setBlockRules);
  alert("החסימה הוסרה");
}

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
        <button style={tabStyle("devices")} onClick={() => setTab("devices")}>
          Devices ({devices.length})
        </button>
        <button style={tabStyle("users")} onClick={() => setTab("users")}>
          Users ({users.length})
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
            <tr style={{ background: "#00000000", textAlign: "left" }}>
              <th>User</th><th>action</th><th>Z-score</th><th>detail</th><th>time</th>
            </tr>
          </thead>
          <tbody>
            {anomalies.map((a, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #000000", background: a.zScore > 3 ? "#000000" : "#1e1e2e00", color: "#fff" }}>
                <td>{a.userId}</td>
                <td>{a.action}</td>
                <td style={{ color: a.zScore > 3 ? "red" : "orange", fontWeight: "bold" }}>{a.zScore}</td>
                <td>{a.details || "—"}</td>
                <td>{new Date(a.createdAt).toLocaleString()}</td>
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
      {/* DEVICES */}
      {tab === "devices" && (
        <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#1e1e2e", color: "#fff", textAlign: "left" }}>
              <th>computer name</th><th>OS</th><th>IP</th><th>open ports</th><th>anti-virus</th><th>last seen</th><th>status</th><th>block</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td>{d.hostname}</td>
                <td>{d.os} {d.osVersion}</td>
                <td>{d.ipAddress}</td>
                <td>{d.openPorts?.join(", ") || "—"}</td>
                <td style={{ color: d.antivirus ? "green" : "red" }}>
                  {d.antivirus ? "✓ פעיל" : "✗ כבוי"}
                </td>
                <td>{new Date(d.lastSeen).toLocaleString()}</td>
                <td style={{ color: d.status === "online" ? "green" : "red" }}>
                  {d.status}
                </td>
                <td>
                  {isBlocked(d) ? (
                    <button
                      onClick={() => handleUnblock(isBlocked(d))}
                      style={{ background: "#e67e22", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 4, cursor: "pointer" }}
                    >
                      🔓 Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBlock(d)}
                      style={{ background: "#c0392b", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 4, cursor: "pointer" }}
                    >
                      🔒 Block
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {devices.length === 0 && <tr><td colSpan="8">  no devices connected</td></tr>}
          </tbody>
        </table>
      )}
      {/* USERS */}
      {tab === "users" && (
        <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#1e1e2e", color: "#fff", textAlign: "left" }}>
              <th>Email</th><th>Name</th><th>Registered</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => {
              const blocked = isUserBlocked(u);
              return (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td>{u.email}</td>
                  <td>{u.name}</td>
                  <td>{new Date(u.createdAt).toLocaleString()}</td>
                  <td style={{ color: blocked ? "red" : "green" }}>
                    {blocked ? "🔴 חסום" : "🟢 פעיל"}
                  </td>
                  <td>
                    {blocked ? (
                      <button
                        onClick={() => handleUnblockUser(blocked)}
                        style={{ background: "#e67e22", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 4, cursor: "pointer" }}
                      >
                        🔓 Unblock
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBlockUser(u)}
                        style={{ background: "#c0392b", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 4, cursor: "pointer" }}
                      >
                        🔒 Block
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && <tr><td colSpan="5">אין משתמשים</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}