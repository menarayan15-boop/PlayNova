import bcrypt from "bcryptjs"

const SALT_ROUNDS = 12

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS)
}

export async function comparePassword(plainPassword: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hash)
}

export interface PasswordStrengthResult {
  valid: boolean
  errors: string[]
  score: number // 0 to 4
}

export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const errors: string[] = []
  let score = 0

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  } else {
    score++
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  } else {
    score++
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  } else {
    score++
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one digit (0-9)")
  } else {
    score++
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    // Recommended special char check
  }

  return {
    valid: errors.length === 0,
    errors,
    score,
  }
}
