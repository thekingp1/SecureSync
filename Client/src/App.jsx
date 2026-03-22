import { useApp } from "./hooks/useApp.js";

export default function App() {
  const {
    stage, email, setEmail, name, setName, password, setPassword,
    otp, setOtp, selected, setSelected, files, status,
    shareTarget, setShareTarget, shareEmail, setShareEmail, shareRole, setShareRole,
    versionTarget, setVersionTarget, versionSelected, setVersionSelected,
    notifications, setNotifications,
    refreshFiles, onRegister, onLogin, onVerifyOtp, onLogout,
    onUpload, onDownloadDecrypt, onDelete, onUploadVersion, onShare, onLeaveShared,
  } = useApp();

  if (stage === "login") return (
    <div style={{ maxWidth: 400, margin: "60px auto", fontFamily: "Arial" }}>
      <h2>SecureSync</h2>
      <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <div style={{ marginBottom: 8 }}>
          <label>Email</label><br />
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Name (register only)</label><br />
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label><br />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 8 }} onKeyDown={(e) => e.key === "Enter" && onLogin()} />
        </div>
        <button onClick={onLogin} style={{ width: "100%", padding: "10px", marginBottom: 8 }}>Login</button>
        <button onClick={onRegister} style={{ width: "100%", padding: "10px", background: "none", border: "1px solid #aaa" }}>Register</button>
        <div style={{ marginTop: 10, color: "#c00" }}>{status}</div>
      </div>
    </div>
  );

  if (stage === "verify") return (
    <div style={{ maxWidth: 400, margin: "60px auto", fontFamily: "Arial" }}>
      <h2>SecureSync – אימות דו-שלבי</h2>
      <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <p>נשלח קוד בן 4 ספרות לכתובת <strong>{email}</strong></p>
        <label style={{ display: "block", marginBottom: 6 }}>קוד אימות</label>
        <input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} inputMode="numeric"
          placeholder="1234" style={{ width: "100%", padding: 12, fontSize: 24, textAlign: "center", letterSpacing: 8, marginBottom: 12 }}
          onKeyDown={(e) => e.key === "Enter" && onVerifyOtp()} autoFocus />
        <button onClick={onVerifyOtp} style={{ width: "100%", padding: "10px", fontSize: 16 }}>אמת</button>
        <button onClick={() => { setStage("login"); setOtp(""); setStatus(""); }}
          style={{ width: "100%", padding: "8px", marginTop: 8, background: "none", border: "none", cursor: "pointer", color: "#666" }}>
          חזרה
        </button>
        <div style={{ marginTop: 10, color: "#c00" }}>{status}</div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "30px auto", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>SecureSync – Encrypted Files</h2>
        <button onClick={onLogout} style={{ padding: "8px 12px" }}>Logout</button>
      </div>
      <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <input type="file" onChange={(e) => setSelected(e.target.files?.[0] || null)} />
        <button onClick={onUpload} style={{ marginLeft: 10 }}>Encrypt + Upload</button>
        <button onClick={() => refreshFiles().catch(() => {})} style={{ marginLeft: 10 }}>Refresh</button>
        <div style={{ marginTop: 10, color: "#444", whiteSpace: "pre-wrap" }}>{status}</div>
      </div>
      {notifications.length > 0 && (
        <div style={{ marginTop: 16 }}>
         {notifications.map((n, i) => (
          <div key={i} style={{
            padding: "8px 12px",
            background: n.type === "anomaly_alert" ? "#ffebee" : "#e8f5e9",
            border: `1px solid ${n.type === "anomaly_alert" ? "#c00" : "#000"}`,
            borderRadius: 6, marginBottom: 6
            }}>
              {n.type === "anomaly_alert" ? "⚠️" : "🔔"} {n.message}
              </div>
            ))}

          <button onClick={() => setNotifications([])}
            style={{ fontSize: 12, color: "#666", background: "none", border: "none", cursor: "pointer" }}>
            clear notifications
          </button>
        </div>
      )}
      <h3 style={{ marginTop: 24 }}>Uploaded files</h3>
      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>originalName</th><th>Stored name</th><th>Algorithm</th><th>Created</th><th></th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f._id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td>{f.originalName ?? "-"}</td>
              <td>{f.storedName}</td>
              <td>{f.algorithm}</td>
              <td>{f.createdAt ? new Date(f.createdAt).toLocaleString() : ""}</td>
              <td>
                <button onClick={() => onDownloadDecrypt(f._id)}>Download + Decrypt</button>
                {!f.sharedAs && <>
                  <button onClick={() => { setShareTarget(f._id); setShareEmail(""); setShareRole("read"); }}
                    style={{ marginLeft: 6, padding: "4px 10px", cursor: "pointer", borderRadius: 4 }}>share</button>
                  <button onClick={() => { setVersionTarget(f._id); setVersionSelected(null); }}
                    style={{ marginLeft: 6, padding: "4px 10px", cursor: "pointer", borderRadius: 4 }}>new version</button>
                  <button onClick={() => onDelete(f._id)}
                    style={{ color: "#fff", background: "#c00", border: "none", padding: "4px 10px", cursor: "pointer", borderRadius: 4, marginLeft: 6 }}>Delete</button>
                </>}
                {f.sharedAs && <>
                  <span style={{ fontSize: 12, color: "#666", marginLeft: 8 }}>shared ({f.sharedAs})</span>
                  <button onClick={() => onLeaveShared(f._id)}
                    style={{ marginLeft: 6, padding: "4px 10px", cursor: "pointer", borderRadius: 4, background: "#888", color: "#fff", border: "none" }}>delete</button>
                </>}
              </td>
            </tr>
          ))}
          {files.length === 0 && <tr><td colSpan="5">No files yet</td></tr>}
        </tbody>
      </table>
      {shareTarget && (
        <div style={{ marginTop: 20, padding: 16, border: "1px solid #aad", borderRadius: 8, background: "#000002" }}>
          <strong>share file</strong>
          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input placeholder="אימייל המשתמש" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)}
              style={{ padding: 8, flex: 1, minWidth: 200 }} />
            <select value={shareRole} onChange={(e) => setShareRole(e.target.value)} style={{ padding: 8 }}>
              <option value="read">read only</option>
              <option value="write">read + write</option>
              <option value="admin">admin</option>
            </select>
            <button onClick={() => onShare(shareTarget)}
              style={{ padding: "8px 16px", background: "#4472C4", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>share</button>
            <button onClick={() => setShareTarget(null)}
              style={{ padding: "8px 12px", background: "#000", border: "1px solid #000", borderRadius: 4, cursor: "pointer" }}>cancel</button>
          </div>
        </div>
      )}
      {versionTarget && (
        <div style={{ marginTop: 20, padding: 16, border: "1px solid #000", borderRadius: 8, background: "#000" }}>
          <strong>upload new version</strong>
          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="file" onChange={(e) => setVersionSelected(e.target.files?.[0] || null)} />
            <button onClick={() => onUploadVersion(versionTarget)}
              style={{ padding: "8px 16px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>upload</button>
            <button onClick={() => { setVersionTarget(null); setVersionSelected(null); }}
              style={{ padding: "8px 12px", background: "none", border: "1px solid #aaa", borderRadius: 4, cursor: "pointer" }}>cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
