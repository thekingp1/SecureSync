// Client/src/App.jsx
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

    if (!res.ok) {
      const err = await res.text();
      setStatus(`Login failed: ${err}`);
      return;
    }

    const data = await res.json();
    const token = data?.token;
    if (!token) {
      setStatus("No token returned from server.");
      return;
    }

    setToken(token);
    setStage("files");
    setStatus("Logged in.");
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

  // ---------- UI ----------
  if (stage === "login") {
    return (
      <div style={{ maxWidth: 520, margin: "60px auto", fontFamily: "Arial" }}>
        <h2>SecureSync – Login / Register</h2>

        <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
            placeholder="email@example.com"
          />

          <label style={{ display: "block", marginBottom: 6 }}>
            Name (only for register)
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
            placeholder="Your name"
          />

          <label style={{ display: "block", marginBottom: 6 }}>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
            placeholder="********"
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onLogin} style={{ padding: "8px 12px" }}>
              Login
            </button>
            <button onClick={onRegister} style={{ padding: "8px 12px" }}>
              Register
            </button>
          </div>

          <div style={{ marginTop: 10, color: "#444", whiteSpace: "pre-wrap" }}>
            {status}
          </div>
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