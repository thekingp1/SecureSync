import crypto from "crypto";
import KeyPair from "../models/KeyPair.js";
import mongoose from "mongoose";


// יצירת זוג מפתחות למשתמש
export async function generateKeyPair(userId) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding:  { type: "spki",  format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  await KeyPair.create({ userId, publicKey, privateKey });
  return { publicKey, privateKey };
}

// חתימה על buffer של קובץ
export function signBuffer(buffer, privateKeyPem) {
  const sign = crypto.createSign("SHA256");
  sign.update(buffer);
  sign.end();
  return sign.sign(privateKeyPem, "base64");
}

// אימות חתימה
export function verifySignature(buffer, signatureB64, publicKeyPem) {
  const verify = crypto.createVerify("SHA256");
  verify.update(buffer);
  verify.end();
  return verify.verify(publicKeyPem, signatureB64, "base64");
}

// שליפת KeyPair של משתמש
export async function getUserKeyPair(userId) {
  return KeyPair.findOne({ userId: new mongoose.Types.ObjectId(userId) });
}