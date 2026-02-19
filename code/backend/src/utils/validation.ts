import { SKILL_DEFS } from './combat'

/**
 * Validate skill action
 */
export function validateSkillAction(
  skillId: string,
  botSkills: string[],
  energy: number,
  cooldowns: Record<string, number>
): { valid: boolean; error?: string } {
  // Check if skill exists
  const skill = SKILL_DEFS[skillId]
  if (!skill) {
    return { valid: false, error: 'Invalid skill ID' }
  }

  // Check if bot owns skill
  if (!botSkills.includes(skillId)) {
    return { valid: false, error: 'Bot does not own this skill' }
  }

  // Check energy cost
  if (energy < skill.energyCost) {
    return { valid: false, error: 'Insufficient energy' }
  }

  // Check cooldown
  if (cooldowns[skillId] > 0) {
    return { valid: false, error: 'Skill on cooldown' }
  }

  return { valid: true }
}

/**
 * Validate bot type
 */
export function validateBotType(botType: string): boolean {
  const validTypes = ['brute', 'logic', 'speed', 'tank', 'balanced']
  return validTypes.includes(botType)
}

/**
 * Validate username
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.length < 3 || username.length > 20) {
    return { valid: false, error: 'Username must be 3-20 characters' }
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' }
  }
  return { valid: true }
}

/**
 * Validate email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: string, maxLength: number = 200): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove angle brackets
}
