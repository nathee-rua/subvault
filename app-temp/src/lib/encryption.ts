// ============================================
// SubVault - AES-256-GCM Encryption Helpers
// ============================================
// 
// These helpers are designed for server-side use (API routes).
// In the current demo mode, credentials are stored in plaintext in localStorage.
// When connected to Supabase, these functions encrypt/decrypt sensitive fields.
//

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

interface EncryptedPayload {
  version: number;
  algorithm: string;
  iv: string;
  ciphertext: string;
  authTag: string;
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Uses Web Crypto API (works in both browser and Node.js)
 */
export async function encrypt(plaintext: string, keyHex: string): Promise<string> {
  const key = await importKey(keyHex);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer, tagLength: AUTH_TAG_LENGTH * 8 },
    key,
    data.buffer as ArrayBuffer
  );

  // In Web Crypto API, the auth tag is appended to the ciphertext
  const encryptedBytes = new Uint8Array(encrypted);
  const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - AUTH_TAG_LENGTH);
  const authTag = encryptedBytes.slice(encryptedBytes.length - AUTH_TAG_LENGTH);

  const payload: EncryptedPayload = {
    version: 1,
    algorithm: ALGORITHM,
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext),
    authTag: bufferToBase64(authTag),
  };

  return JSON.stringify(payload);
}

/**
 * Decrypt an AES-256-GCM encrypted string
 */
export async function decrypt(encryptedStr: string, keyHex: string): Promise<string> {
  const payload: EncryptedPayload = JSON.parse(encryptedStr);

  if (payload.version !== 1 || payload.algorithm !== ALGORITHM) {
    throw new Error(`Unsupported encryption format: v${payload.version} ${payload.algorithm}`);
  }

  const key = await importKey(keyHex);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);
  const authTag = base64ToBuffer(payload.authTag);

  // Combine ciphertext and auth tag (required by Web Crypto API)
  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext);
  combined.set(authTag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer, tagLength: AUTH_TAG_LENGTH * 8 },
    key,
    combined.buffer as ArrayBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Encrypt multiple fields in an object
 */
export async function encryptFields(
  data: Record<string, string | undefined>,
  fields: string[],
  keyHex: string
): Promise<Record<string, string | undefined>> {
  const result = { ...data };
  for (const field of fields) {
    if (result[field]) {
      result[field] = await encrypt(result[field]!, keyHex);
    }
  }
  return result;
}

/**
 * Decrypt multiple fields in an object
 */
export async function decryptFields(
  data: Record<string, string | undefined>,
  fields: string[],
  keyHex: string
): Promise<Record<string, string | undefined>> {
  const result = { ...data };
  for (const field of fields) {
    if (result[field]) {
      try {
        result[field] = await decrypt(result[field]!, keyHex);
      } catch {
        // If decryption fails, leave the field as-is (might not be encrypted)
        console.warn(`Failed to decrypt field: ${field}`);
      }
    }
  }
  return result;
}

/**
 * Generate a new random 256-bit encryption key
 */
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---- Internal helpers ----

async function importKey(keyHex: string): Promise<CryptoKey> {
  const keyBytes = new Uint8Array(keyHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  return crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

function bufferToBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
