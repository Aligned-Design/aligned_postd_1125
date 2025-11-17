/**
 * Password Policy Enforcement
 *
 * Implements strong password requirements:
 * - Minimum 10 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 * - Not a common password
 * - Not similar to email/username
 */

import { hashPassword } from "./encryption";

/**
 * Password strength levels
 */
export enum PasswordStrength {
  VERY_WEAK = 0,
  WEAK = 1,
  MEDIUM = 2,
  STRONG = 3,
  VERY_STRONG = 4,
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  strength: PasswordStrength;
  errors: string[];
  suggestions: string[];
  score: number; // 0-100
}

/**
 * Common passwords to reject (top 100)
 */
const COMMON_PASSWORDS = new Set([
  "password",
  "password123",
  "123456",
  "123456789",
  "12345678",
  "qwerty",
  "abc123",
  "password1",
  "admin",
  "letmein",
  "welcome",
  "monkey",
  "1234567890",
  "password!",
  "qwerty123",
  "welcome123",
  "admin123",
  "root",
  "toor",
  "pass",
  // Add more as needed
]);

/**
 * Character sets for validation
 */
const CHAR_SETS = {
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  numbers: /[0-9]/,
  special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

/**
 * Validate password against policy
 */
export function validatePassword(
  password: string,
  email?: string,
  username?: string,
): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Check minimum length (REQUIRED)
  if (password.length < 10) {
    errors.push("Password must be at least 10 characters long");
  } else {
    score += 20;
    if (password.length >= 12) score += 5;
    if (password.length >= 16) score += 5;
  }

  // Check for lowercase letters (REQUIRED)
  if (!CHAR_SETS.lowercase.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else {
    score += 15;
  }

  // Check for uppercase letters (REQUIRED)
  if (!CHAR_SETS.uppercase.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else {
    score += 15;
  }

  // Check for numbers (REQUIRED)
  if (!CHAR_SETS.numbers.test(password)) {
    errors.push("Password must contain at least one number");
  } else {
    score += 15;
  }

  // Check for special characters (REQUIRED)
  if (!CHAR_SETS.special.test(password)) {
    errors.push(
      "Password must contain at least one special character (!@#$%^&*...)",
    );
  } else {
    score += 15;
  }

  // Check against common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push(
      "This password is too common. Please choose a more unique password",
    );
    score -= 30;
  }

  // Check for sequential characters
  if (hasSequentialChars(password)) {
    suggestions.push("Avoid sequential characters (e.g., abc, 123)");
    score -= 10;
  }

  // Check for repeated characters
  if (hasRepeatedChars(password)) {
    suggestions.push("Avoid repeated characters (e.g., aaa, 111)");
    score -= 10;
  }

  // Check similarity to email/username
  if (email && isSimilarTo(password, email)) {
    errors.push("Password is too similar to your email address");
    score -= 20;
  }

  if (username && isSimilarTo(password, username)) {
    errors.push("Password is too similar to your username");
    score -= 20;
  }

  // Bonus points for diversity
  const charTypesUsed = Object.values(CHAR_SETS).filter((regex) =>
    regex.test(password),
  ).length;
  score += charTypesUsed * 5;

  // Ensure score is in range 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine strength
  let strength: PasswordStrength;
  if (score < 30) {
    strength = PasswordStrength.VERY_WEAK;
  } else if (score < 50) {
    strength = PasswordStrength.WEAK;
  } else if (score < 70) {
    strength = PasswordStrength.MEDIUM;
  } else if (score < 90) {
    strength = PasswordStrength.STRONG;
  } else {
    strength = PasswordStrength.VERY_STRONG;
  }

  // Add suggestions based on strength
  if (strength < PasswordStrength.STRONG) {
    if (password.length < 12) {
      suggestions.push("Use at least 12 characters for better security");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{2,}/.test(password)) {
      suggestions.push("Use multiple special characters");
    }
    suggestions.push(
      'Consider using a passphrase (e.g., "Coffee!Morning@2025#Sunrise")',
    );
  }

  return {
    valid: errors.length === 0 && score >= 50, // Minimum score of 50 required
    strength,
    errors,
    suggestions,
    score,
  };
}

/**
 * Check for sequential characters (abc, 123, etc.)
 */
function hasSequentialChars(password: string): boolean {
  const sequences = [
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
  ];

  const lower = password.toLowerCase();

  for (const seq of sequences) {
    for (let i = 0; i < seq.length - 2; i++) {
      const substring = seq.substring(i, i + 3);
      if (lower.includes(substring)) {
        return true;
      }
      // Check reverse sequence
      if (lower.includes(substring.split("").reverse().join(""))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check for repeated characters (aaa, 111, etc.)
 */
function hasRepeatedChars(password: string): boolean {
  for (let i = 0; i < password.length - 2; i++) {
    if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
      return true;
    }
  }
  return false;
}

/**
 * Check if password is similar to another string
 */
function isSimilarTo(password: string, reference: string): boolean {
  const passwordLower = password.toLowerCase();
  const referenceLower = reference.toLowerCase();

  // Direct inclusion
  if (
    passwordLower.includes(referenceLower) ||
    referenceLower.includes(passwordLower)
  ) {
    return true;
  }

  // Levenshtein distance check
  const distance = levenshteinDistance(passwordLower, referenceLower);
  const threshold = Math.floor(reference.length * 0.3); // 30% similarity threshold

  return distance <= threshold;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Generate a secure random password that meets policy
 */
export function generateSecurePassword(length: number = 16): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const allChars = lowercase + uppercase + numbers + special;

  let password = "";

  // Ensure at least one of each required type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return password;
}

/**
 * Password strength indicator text
 */
export function getStrengthText(strength: PasswordStrength): string {
  switch (strength) {
    case PasswordStrength.VERY_WEAK:
      return "Very Weak";
    case PasswordStrength.WEAK:
      return "Weak";
    case PasswordStrength.MEDIUM:
      return "Medium";
    case PasswordStrength.STRONG:
      return "Strong";
    case PasswordStrength.VERY_STRONG:
      return "Very Strong";
    default:
      return "Unknown";
  }
}

/**
 * Password strength color (for UI)
 */
export function getStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case PasswordStrength.VERY_WEAK:
      return "#dc2626"; // red-600
    case PasswordStrength.WEAK:
      return "#f97316"; // orange-500
    case PasswordStrength.MEDIUM:
      return "#fbbf24"; // yellow-400
    case PasswordStrength.STRONG:
      return "#22c55e"; // green-500
    case PasswordStrength.VERY_STRONG:
      return "#059669"; // emerald-600
    default:
      return "#6b7280"; // gray-500
  }
}

/**
 * Create hashed password with validation
 */
export function createHashedPassword(
  password: string,
  email?: string,
  username?: string,
): { hash: string; validation: PasswordValidationResult } {
  const validation = validatePassword(password, email, username);

  if (!validation.valid) {
    throw new Error(
      `Password does not meet requirements: ${validation.errors.join(", ")}`,
    );
  }

  const hash = hashPassword(password);

  return { hash, validation };
}

/**
 * Check if password has been compromised (using Have I Been Pwned API)
 * This should be called client-side or with k-anonymity
 */
export async function checkPasswordPwned(password: string): Promise<boolean> {
  try {
    const crypto = await import("crypto");
    const sha1 = crypto
      .createHash("sha1")
      .update(password)
      .digest("hex")
      .toUpperCase();
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
    );
    const text = await response.text();

    const hashes = text.split("\n");
    const found = hashes.some((line) => line.startsWith(suffix));

    return found;
  } catch (error) {
    console.error("Error checking password against HIBP:", error);
    return false; // Fail open - don't block if API is unavailable
  }
}
