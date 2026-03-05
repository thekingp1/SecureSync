// Client/src/App.jsx
// import "dotenv/config";
import { useEffect, useState } from "react";
import { encryptFileWithWrappedKey, decryptPackage, decryptMeta } from "./crypto/crypto.js";


const API_BASE = "http://localhost:4000";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function decodeMetaFromHeader(metaHeader) {
  // metaHeader is base64url from the server
  let b64 = metaHeader.trim().replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) b64 += "=";
  const json = atob(b64);
  return JSON.parse(json);
}

export default function App() {
  // stage: "login" | "files"
  const [stage, setStage] = useState("login");

  // auth
  const [email, setEmail] = useState("");
  const [name, setName] = useState(""); // for register
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  // files
  const [selected, setSelected] = useState(null);
  const [files, setFiles] = useState([]);

  // status
  const [status, setStatus] = useState("");

  function getToken() {
    return localStorage.getItem("securesync_token");
  }
  function setToken(token) {
    localStorage.setItem("securesync_token", token);
  }
  function clearToken() {
    localStorage.removeItem("securesync_token");
  }

  // auto-login if token exists
  useEffect(() => {
    const t = getToken();
    if (t) setStage("files");
  }, []);

  async function refreshFiles() {
  const token = getToken();
  if (!token) throw new Error("Missing token");
  const res = await fetch(`${API_BASE}/files`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    clearToken();
    setStage("login");
    throw new Error("Session expired. Please login again.");
  }
  if (!res.ok) throw new Error(await res.text());
  const rawFiles = await res.json();
  const filesWithNames = await Promise.all(
    rawFiles.map(async (f) => {
      try {
        const meta = await decryptMeta({
          wrappedKeyB64: f.wrappedKeyB64,
          encryptedMetaB64: f.encryptedMetaB64,
          metaIvB64: f.metaIvB64,
        });
        return { ...f, originalName: meta.originalName };
      } catch {
        return { ...f, originalName: null };
      }
    })
  );
  setFiles(filesWithNames);
}

  // when entering files stage, load list
  useEffect(() => {
    if (stage !== "files") return;
    refreshFiles().catch((e) => setStatus(`Failed to load files: ${String(e)}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  async function onRegister() {
    setStatus("");
    if (!email || !name || !password) {
      setStatus("Register requires: email, name, password");
      return;
    }

    const res = await fetch(`${API_BASE}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });

    if (!res.ok) {
      const err = await res.text();
      setStatus(`Register failed: ${err}`);
      return;
    }

    setStatus("Registered successfully. Now click Login.");
  }

 async function onLogin() {
    setStatus("");
    if (!email || !password) {
      setStatus("Login requires: email, password");
      return;
    }
    const res = await fetch(`${API_BASE}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) { setStatus(`Login failed: ${await res.text()}`); return; }
    setStatus("Verification code sent to your email.");
    setStage("verify");
  }
  async function onVerifyOtp() {
  if (!otp) { setStatus("הכנס קוד"); return; }
  const res = await fetch(`${API_BASE}/users/verify-otp`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) { setStatus(`שגיאה: ${await res.text()}`); return; }
  const data = await res.json();
  if (!data.token) { setStatus("No token"); return; }
  setToken(data.token);
  setOtp("");
  setStage("files");
}


  function onLogout() {
    clearToken();
    setFiles([]);
    setSelected(null);
    setStage("login");
    setStatus("Logged out.");
  }

  async function onUpload() {
    const token = getToken();
    if (!token) {
      setStatus("Not authenticated.");
      return;
    }
    if (!selected) return;

    setStatus("Encrypting on client...");
    const { ciphertext, meta } = await encryptFileWithWrappedKey(selected);

    setStatus("Uploading ciphertext...");
    const form = new FormData();

    // Server expects field name "file"
    const encryptedName = `${selected.name}.enc`;
    form.append("file", ciphertext, encryptedName);

    // Send encryption metadata fields
    form.append("algorithm", meta.algorithm);
    form.append("ivB64", meta.ivB64);
    form.append("wrappedKeyB64", meta.wrappedKeyB64);
    form.append("ciphertextSha256B64", meta.ciphertextSha256B64);

    form.append("encryptedMetaB64", meta.encryptedMetaB64);
    form.append("metaIvB64",        meta.metaIvB64);
    const res = await fetch(`${API_BASE}/files/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (res.status === 401) {
      clearToken();
      setStage("login");
      setStatus("Session expired. Please login again.");
      return;
    }

    if (!res.ok) {
      const err = await res.text();
      setStatus(`Upload failed: ${err}`);
      return;
    }

    setStatus("Uploaded. Refreshing list...");
    await refreshFiles();
    setStatus("Done.");
    setSelected(null);
  }

  async function onDownloadDecrypt(fileId) {
    const token = getToken();
    if (!token) {
      setStatus("Not authenticated.");
      return;
    }

    setStatus("Downloading ciphertext + metadata...");
    const res = await fetch(`${API_BASE}/files/${fileId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      clearToken();
      setStage("login");
      setStatus("Session expired. Please login again.");
      return;
    }

    if (!res.ok) {
      const err = await res.text();
      setStatus(`Download failed: ${err}`);
      return;
    }

    const metaHeader = res.headers.get("x-securesync-meta");
    if (!metaHeader) {
      setStatus("Missing x-securesync-meta header");
      return;
    }

    const meta = decodeMetaFromHeader(metaHeader);
    const cipherBuf = await res.arrayBuffer();

    setStatus("Decrypting on client...");
    try {
     const { blob, metaPlain } = await decryptPackage({
  ciphertextArrayBuffer: cipherBuf,
  meta,
});
downloadBlob(blob, metaPlain.originalName || "download.bin");
      setStatus("Decrypted and downloaded.");
    } catch (e) {
      setStatus(`Decrypt failed: ${String(e)}`);
    }
  }
// הוסף את הבלוק הזה לפני: if (stage === "verify") {

  if (stage === "login") {
    return (
      <div style={{ maxWidth: 400, margin: "60px auto", fontFamily: "Arial" }}>
        <h2>SecureSync</h2>
        <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          <div style={{ marginBottom: 8 }}>
            <label>Email</label><br />
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: 8 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Name (register only)</label><br />
            <input value={name} onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: 8 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Password</label><br />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: 8 }}
              onKeyDown={(e) => e.key === "Enter" && onLogin()} />
          </div>
          <button onClick={onLogin} style={{ width: "100%", padding: "10px", marginBottom: 8 }}>Login</button>
          <button onClick={onRegister} style={{ width: "100%", padding: "10px", background: "none", border: "1px solid #aaa" }}>Register</button>
          <div style={{ marginTop: 10, color: "#c00" }}>{status}</div>
        </div>
      </div>
    );
  }

  // ---------- UI ----------
  if (stage === "verify") {
  return (
    <div style={{ maxWidth: 400, margin: "60px auto", fontFamily: "Arial" }}>
      <h2>SecureSync – אימות דו-שלבי</h2>
      <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <p>נשלח קוד בן 4 ספרות לכתובת <strong>{email}</strong></p>
        <label style={{ display: "block", marginBottom: 6 }}>קוד אימות</label>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={4}
          inputMode="numeric"
          placeholder="1234"
          style={{ width: "100%", padding: 12, fontSize: 24, textAlign: "center", letterSpacing: 8, marginBottom: 12 }}
          onKeyDown={(e) => e.key === "Enter" && onVerifyOtp()}
          autoFocus
        />
        <button onClick={onVerifyOtp} style={{ width: "100%", padding: "10px", fontSize: 16 }}>
          אמת
        </button>
        <button
          onClick={() => { setStage("login"); setOtp(""); setStatus(""); }}
          style={{ width: "100%", padding: "8px", marginTop: 8, background: "none", border: "none", cursor: "pointer", color: "#666" }}
        >
          חזרה
        </button>
        <div style={{ marginTop: 10, color: "#c00" }}>{status}</div>
      </div>
    </div>
  );
}


  // stage === "files"
  return (
    <div style={{ maxWidth: 900, margin: "30px auto", fontFamily: "Arial" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>SecureSync – Encrypted Files</h2>
        <button onClick={onLogout} style={{ padding: "8px 12px" }}>
          Logout
        </button>
      </div>

      <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
        <input
          type="file"
          onChange={(e) => setSelected(e.target.files?.[0] || null)}
        />
        <button onClick={onUpload} style={{ marginLeft: 10 }}>
          Encrypt + Upload
        </button>
        <button
          onClick={() => refreshFiles().catch((e) => setStatus(String(e)))}
          style={{ marginLeft: 10 }}
        >
          Refresh
        </button>

        <div style={{ marginTop: 10, color: "#444", whiteSpace: "pre-wrap" }}>
          {status}
        </div>
      </div>

      <h3 style={{ marginTop: 24 }}>Uploaded files</h3>

      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
          <th>originalName</th>
            <th>Stored name</th>
            <th>Algorithm</th>
            <th>Created</th>
            <th></th>
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
                <button onClick={() => onDownloadDecrypt(f._id)}>
                  Download + Decrypt
                </button>
              </td>
            </tr>
          ))}
          {files.length === 0 && (
            <tr>
              <td colSpan="5">No files yet</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}