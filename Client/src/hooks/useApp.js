import { useEffect, useState } from "react";
import {
  apiRegister, apiLogin, apiVerifyOtp, apiLogout,
  apiFetchFiles, apiUploadFile, apiDownloadFile, apiDeleteFile,
  apiUploadVersion, apiShareFile, apiLeaveShared,
} from "../api.js";
import { useWebSocket } from "./useWebSocket.js";

export function useApp() {
  const [stage, setStage] = useState("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [selected, setSelected] = useState(null);
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [shareTarget, setShareTarget] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("read");
  const [versionTarget, setVersionTarget] = useState(null);
  const [versionSelected, setVersionSelected] = useState(null);
  const [notifications, setNotifications] = useState([]);

  function getToken() { return localStorage.getItem("securesync_token"); }
  function setToken(t) { localStorage.setItem("securesync_token", t); }
  function clearToken() { localStorage.removeItem("securesync_token"); }
  function handle401() { clearToken(); setStage("login"); setStatus("Session expired. Please login again."); }

  useEffect(() => { if (getToken()) setStage("files"); }, []);

  async function refreshFiles() {
    const token = getToken();
    if (!token) throw new Error("Missing token");
    try {
      setFiles(await apiFetchFiles(token));
    } catch (e) {
      if (e.message === "401") { handle401(); return; }
      throw e;
    }
  }

  useEffect(() => {
    if (stage !== "files") return;
    refreshFiles().catch((e) => setStatus(`Failed to load files: ${String(e)}`));
  }, [stage]);

  useWebSocket(stage, getToken, (data) => {
    setNotifications((prev) => [data, ...prev]);
    if (data.type === "file_shared") refreshFiles();
  });

  async function onRegister() {
    setStatus("");
    if (!email || !name || !password) { setStatus("Register requires: email, name, password"); return; }
    try { await apiRegister(email, name, password); setStatus("Registered successfully. Now click Login."); }
    catch (e) { setStatus(`Register failed: ${e.message}`); }
  }

  async function onLogin() {
    setStatus("");
    if (!email || !password) { setStatus("Login requires: email, password"); return; }
    try { await apiLogin(email, password); setStatus("Verification code sent to your email."); setStage("verify"); }
    catch (e) { setStatus(`Login failed: ${e.message}`); }
  }

  async function onVerifyOtp() {
    if (!otp) { setStatus("הכנס קוד"); return; }
    try { const token = await apiVerifyOtp(email, otp); setToken(token); setOtp(""); setStage("files"); }
    catch (e) { setStatus(`שגיאה: ${e.message}`); }
  }

  async function onLogout() {
    const token = getToken();
    if (token) try { await apiLogout(token); } catch {}
    clearToken(); setFiles([]); setSelected(null); setStage("login"); setStatus("Logged out.");
  }

  async function onUpload() {
    const token = getToken();
    if (!token) { setStatus("Not authenticated."); return; }
    if (!selected) return;
    setStatus("Encrypting + Uploading...");
    try { await apiUploadFile(token, selected); await refreshFiles(); setStatus("Done."); setSelected(null); }
    catch (e) { if (e.message === "401") { handle401(); return; } setStatus(`Upload failed: ${e.message}`); }
  }

  async function onDownloadDecrypt(fileId) {
    const token = getToken();
    if (!token) { setStatus("Not authenticated."); return; }
    setStatus("Downloading + Decrypting...");
    try { await apiDownloadFile(token, fileId); setStatus("Decrypted and downloaded."); }
    catch (e) { if (e.message === "401") { handle401(); return; } setStatus(`Failed: ${e.message}`); }
  }

  async function onDelete(fileId) {
    if (!window.confirm("למחוק את הקובץ לצמיתות?")) return;
    const token = getToken();
    if (!token) { setStatus("Not authenticated."); return; }
    try { await apiDeleteFile(token, fileId); setFiles((prev) => prev.filter((f) => f._id !== fileId)); setStatus("File deleted."); }
    catch (e) { if (e.message === "401") { handle401(); return; } setStatus(`Delete failed: ${e.message}`); }
  }

  async function onUploadVersion(fileId) {
    if (!versionSelected) { setStatus("בחר קובץ"); return; }
    const token = getToken();
    setStatus("Encrypting...");
    try {
      await apiUploadVersion(token, fileId, versionSelected);
      setStatus("new version uploaded"); setVersionTarget(null); setVersionSelected(null); await refreshFiles();
    } catch (e) { setStatus(`שגיאה: ${e.message}`); }
  }

  async function onShare(fileId) {
    if (!shareEmail) { setStatus("הכנס אימייל"); return; }
    const token = getToken();
    try {
      await apiShareFile(token, fileId, shareEmail, shareRole);
      setStatus(`הקובץ שותף עם ${shareEmail} בתור ${shareRole}`);
      setShareTarget(null); setShareEmail(""); setShareRole("read");
    } catch (e) { setStatus(`שיתוף נכשל: ${e.message}`); }
  }

  async function onLeaveShared(fileId) {
    const token = getToken();
    try { await apiLeaveShared(token, fileId); setFiles((prev) => prev.filter((f) => f._id !== fileId)); }
    catch (e) { setStatus(`שגיאה: ${e.message}`); }
  }

  return {
    stage, email, setEmail, name, setName, password, setPassword,
    otp, setOtp, selected, setSelected, files, status,
    shareTarget, setShareTarget, shareEmail, setShareEmail, shareRole, setShareRole,
    versionTarget, setVersionTarget, versionSelected, setVersionSelected,
    notifications, setNotifications,
    refreshFiles, onRegister, onLogin, onVerifyOtp, onLogout,
    onUpload, onDownloadDecrypt, onDelete, onUploadVersion, onShare, onLeaveShared,
  };
}
