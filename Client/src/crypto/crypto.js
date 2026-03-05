export async function decryptMeta({ wrappedKeyB64, encryptedMetaB64, metaIvB64 }) {
  const masterKey = await getOrCreateMasterKey();
  const wrappedKeyBytes = base64ToBytes(wrappedKeyB64);
  const dataKey = await crypto.subtle.unwrapKey(
    "raw", wrappedKeyBytes.buffer, masterKey, "AES-KW",
    { name: "AES-GCM", length: 256 }, false, ["decrypt"]
  );
  const metaIv = base64ToBytes(metaIvB64);
  const metaCipherBytes = base64ToBytes(encryptedMetaB64);
  const metaPlainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: metaIv }, dataKey, metaCipherBytes.buffer
  );
  return JSON.parse(new TextDecoder().decode(new Uint8Array(metaPlainBuf)));
}



function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sha256(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return bytesToBase64(new Uint8Array(digest));
}

export async function getOrCreateMasterKey() {
  const stored = localStorage.getItem("securesync_master_key_jwk");
  if (stored) {
    const jwk = JSON.parse(stored);
    return await crypto.subtle.importKey("jwk", jwk, { name: "AES-KW" }, false, ["wrapKey", "unwrapKey"]);
  }

  const masterKey = await crypto.subtle.generateKey({ name: "AES-KW", length: 256 }, true, ["wrapKey", "unwrapKey"]);
  const jwk = await crypto.subtle.exportKey("jwk", masterKey);
  localStorage.setItem("securesync_master_key_jwk", JSON.stringify(jwk));
  return masterKey;
}

export async function encryptFileWithWrappedKey(file) {
  // 1) Per-file data key for AES-GCM
  const dataKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2) Wrap data key with master key (AES-KW)
  const masterKey = await getOrCreateMasterKey();
  const wrappedKeyBuf = await crypto.subtle.wrapKey("raw", dataKey, masterKey, "AES-KW");
  const wrappedKeyB64 = bytesToBase64(new Uint8Array(wrappedKeyBuf));

  // 3) Encrypt file bytes (ciphertext includes authTag internally in WebCrypto result)
  const plainBuf = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, dataKey, plainBuf);

  // 4) Encrypt metadata too (zero-knowledge metadata)
  const metaPlain = {
    originalName: file.name,
    originalMimeType: file.type || "application/octet-stream",
    originalSize: file.size,
  };
  const metaIv = crypto.getRandomValues(new Uint8Array(12));
  const metaPlainBuf = new TextEncoder().encode(JSON.stringify(metaPlain));
  const metaCipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv: metaIv }, dataKey, metaPlainBuf);

  const ciphertextSha256B64 = await sha256(cipherBuf);
return {
  ciphertext: new Blob([cipherBuf], { type: "application/octet-stream" }),
  meta: {
    algorithm: "AES-256-GCM",
    ivB64: bytesToBase64(iv),
    wrappedKeyB64,
    ciphertextSha256B64,
    encryptedMetaB64: bytesToBase64(new Uint8Array(metaCipherBuf)), // שם אחיד
    metaIvB64: bytesToBase64(metaIv),                              // שם אחיד
  },
};

}

/**
 * Decrypts ciphertext and also decrypts encrypted metadata.
 * Returns { blob, metaPlain }
 */
export async function decryptPackage({ ciphertextArrayBuffer, meta }) {
  const masterKey = await getOrCreateMasterKey();

  // unwrap dataKey
  const wrappedKeyBytes = base64ToBytes(meta.wrappedKeyB64);
  const dataKey = await crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyBytes.buffer,
    masterKey,
    "AES-KW",
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // decrypt file
  const iv = base64ToBytes(meta.ivB64);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, dataKey, ciphertextArrayBuffer);

  // decrypt metadata
  const metaIv = base64ToBytes(meta.metaIvB64);
  const metaCipherBytes = base64ToBytes(meta.encryptedMetaB64);
  const metaPlainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: metaIv }, dataKey, metaCipherBytes.buffer);
  const metaPlainJson = new TextDecoder().decode(new Uint8Array(metaPlainBuf));
  const metaPlain = JSON.parse(metaPlainJson);

  return {
    blob: new Blob([plainBuf], { type: metaPlain.originalMimeType || "application/octet-stream" }),
    metaPlain,
  };
}
export async function decryptToBlob({ ciphertextArrayBuffer, meta }) {
  const masterKey = await getOrCreateMasterKey();

  const wrappedKeyBytes = base64ToBytes(meta.wrappedKeyB64);

  const dataKey = await crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyBytes.buffer,
    masterKey,
    "AES-KW",
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const iv = base64ToBytes(meta.ivB64);

  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    dataKey,
    ciphertextArrayBuffer
  );

  return new Blob([plainBuf], {
    type: meta.originalMimeType || "application/octet-stream",
  });
}