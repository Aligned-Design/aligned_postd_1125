import crypto from "crypto";

/**
 * Encryption configuration
 */
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

/**
 * Get encryption key from environment or generate
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;

  if (!envKey) {
    console.warn(
      "⚠️  ENCRYPTION_KEY not set in environment. Using development key. DO NOT USE IN PRODUCTION!",
    );
    // Development-only fallback - NEVER use in production
    return crypto.scryptSync(
      "dev-key-change-in-production",
      "salt",
      KEY_LENGTH,
    );
  }

  // Derive key from environment variable
  return crypto.scryptSync(envKey, "aligned-salt", KEY_LENGTH);
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * Returns base64-encoded string with format: iv:tag:encrypted
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    const tag = cipher.getAuthTag();

    // Combine iv, tag, and encrypted data
    return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt data encrypted with encrypt()
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(":");

    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(parts[0], "base64");
    const tag = Buffer.from(parts[1], "base64");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Hash password using PBKDF2
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("base64");
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, 64, "sha512")
    .toString("base64");
  return `${salt}:${hash}`;
}

/**
 * Verify password against hash
 */
export function verifyPassword(
  password: string,
  hashedPassword: string,
): boolean {
  try {
    const parts = hashedPassword.split(":");
    if (parts.length !== 2) {
      return false;
    }

    const [salt, originalHash] = parts;
    const hash = crypto
      .pbkdf2Sync(password, salt, ITERATIONS, 64, "sha512")
      .toString("base64");

    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
  } catch (error) {
    return false;
  }
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("base64url");
}

/**
 * Hash data using SHA-256 (for non-password hashing)
 */
export function hash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Generate HMAC signature
 */
export function generateHmac(data: string, secret?: string): string {
  const key =
    secret || process.env.HMAC_SECRET || "dev-secret-change-in-production";
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}

/**
 * Verify HMAC signature
 */
export function verifyHmac(
  data: string,
  signature: string,
  secret?: string,
): boolean {
  const expectedSignature = generateHmac(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

/**
 * Encrypt tokens for storage (OAuth tokens, API keys, etc.)
 */
export function encryptToken(token: string): string {
  return encrypt(token);
}

/**
 * Decrypt tokens from storage
 */
export function decryptToken(encryptedToken: string): string {
  return decrypt(encryptedToken);
}

/**
 * Redact sensitive data in logs
 */
export function redactSensitiveData(data: any): any {
  if (typeof data === "string") {
    // Redact tokens and keys
    return data.replace(
      /\b(token|key|secret|password|auth)[=:]\s*[^\s&]+/gi,
      "$1=***REDACTED***",
    );
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }

  if (data && typeof data === "object") {
    const redacted: any = {};
    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "key",
      "auth",
      "apiKey",
      "accessToken",
      "refreshToken",
    ];

    for (const key in data) {
      if (
        sensitiveKeys.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))
      ) {
        redacted[key] = "***REDACTED***";
      } else {
        redacted[key] = redactSensitiveData(data[key]);
      }
    }

    return redacted;
  }

  return data;
}

/**
 * Generate deterministic ID from data (for deduplication)
 */
export function generateDeterministicId(data: string): string {
  return crypto
    .createHash("sha256")
    .update(data)
    .digest("hex")
    .substring(0, 16);
}

/**
 * Mask sensitive data for display (e.g., credit card numbers)
 */
export function maskSensitiveString(
  str: string,
  visibleChars: number = 4,
): string {
  if (str.length <= visibleChars) {
    return "*".repeat(str.length);
  }

  const masked = "*".repeat(str.length - visibleChars);
  const visible = str.substring(str.length - visibleChars);

  return masked + visible;
}
