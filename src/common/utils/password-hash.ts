import * as argon2 from 'argon2';

/**
 * Hash a plain text password using Argon2id
 *
 * Argon2 was selected because:
 * - Winner of the Password Hashing Competition (PHC)
 * - Resistant to GPU/ASIC attacks due to memory-hard design
 * - Recommended by OWASP for password hashing
 * - Better resistance to side-channel attacks than bcrypt
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3, // 3 iterations
    parallelism: 4, // 4 parallel threads
  });
}

/**
 * Verify a plain text password against an Argon2 hash
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hashedPassword, plainPassword);
  } catch {
    return false;
  }
}
