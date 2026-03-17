import { encryptFileWithWrappedKey, decryptPackage, decryptMeta } from "./crypto/crypto.js";

export const API_BASE = "http://localhost:4000";

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function decodeMetaFromHeader(metaHeader) {
  let b64 = metaHeader.trim().replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) b64 += "=";
  return JSON.parse(atob(b64));
}

export async function apiRegister(email, name, password) {
  const res = await fetch(`${API_BASE}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, password }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function apiVerifyOtp(email, otp) {
  const res = await fetch(`${API_BASE}/users/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  if (!data.token) throw new Error("No token");
  return data.token;
}

export async function apiLogout(token) {
  await fetch(`${API_BASE}/users/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiFetchFiles(token) {
  const res = await fetch(`${API_BASE}/files`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("401");
  if (!res.ok) throw new Error(await res.text());
  const rawFiles = await res.json();
  return Promise.all(
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
}

export async function apiUploadFile(token, file) {
  const { ciphertext, meta } = await encryptFileWithWrappedKey(file);
  const form = new FormData();
  form.append("file", ciphertext, `${file.name}.enc`);
  form.append("algorithm", meta.algorithm);
  form.append("ivB64", meta.ivB64);
  form.append("wrappedKeyB64", meta.wrappedKeyB64);
  form.append("ciphertextSha256B64", meta.ciphertextSha256B64);
  form.append("encryptedMetaB64", meta.encryptedMetaB64);
  form.append("metaIvB64", meta.metaIvB64);
  const res = await fetch(`${API_BASE}/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (res.status === 401) throw new Error("401");
  if (!res.ok) throw new Error(await res.text());
}

export async function apiDownloadFile(token, fileId) {
  const res = await fetch(`${API_BASE}/files/${fileId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("401");
  if (!res.ok) throw new Error(await res.text());
  const metaHeader = res.headers.get("x-securesync-meta");
  if (!metaHeader) throw new Error("Missing x-securesync-meta header");
  const meta = decodeMetaFromHeader(metaHeader);
  const cipherBuf = await res.arrayBuffer();
  const { blob, metaPlain } = await decryptPackage({ ciphertextArrayBuffer: cipherBuf, meta });
  downloadBlob(blob, metaPlain.originalName || "download.bin");
}

export async function apiDeleteFile(token, fileId) {
  const res = await fetch(`${API_BASE}/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error("401");
  if (!res.ok) throw new Error(await res.text());
}

export async function apiUploadVersion(token, fileId, file) {
  const { ciphertext, meta } = await encryptFileWithWrappedKey(file);
  const form = new FormData();
  form.append("file", ciphertext, `${file.name}.enc`);
  form.append("algorithm", meta.algorithm);
  form.append("ivB64", meta.ivB64);
  form.append("wrappedKeyB64", meta.wrappedKeyB64);
  form.append("ciphertextSha256B64", meta.ciphertextSha256B64);
  form.append("encryptedMetaB64", meta.encryptedMetaB64);
  form.append("metaIvB64", meta.metaIvB64);
  const res = await fetch(`${API_BASE}/files/${fileId}/versions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function apiShareFile(token, fileId, email, role) {
  const res = await fetch(`${API_BASE}/files/${fileId}/share`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function apiLeaveShared(token, fileId) {
  const res = await fetch(`${API_BASE}/files/${fileId}/leave`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
}
