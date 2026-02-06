/**
 * Parse a bot's response into a structured combat action.
 *
 * The bot can respond in various formats:
 * - JSON: { "action": "attack", "target": "core" }
 * - Text: "I'll attack the core"
 *
 * PRIVACY: The full response (including reasoning) stays local.
 * Only the parsed action + target are sent to the server.
 */

export interface ParsedAction {
  action: 'attack' | 'defend' | 'skill'
  target: 'core' | 'armor' | 'processor' | null
  reasoning: string | null // Stays LOCAL, never sent
}

const VALID_ACTIONS = ['attack', 'defend', 'skill'] as const
const VALID_TARGETS = ['core', 'armor', 'processor'] as const

/**
 * Parse bot response into a combat action.
 * Falls back to 'defend' if parsing fails (safe default).
 */
export function parseAction(response: string): ParsedAction {
  // Try JSON parsing first
  const jsonAction = tryParseJSON(response)
  if (jsonAction) return jsonAction

  // Try text pattern matching
  const textAction = tryParseText(response)
  if (textAction) return textAction

  // Fallback: defend (safe default)
  console.log('  ⚠️  Could not parse bot response, defaulting to defend')
  return {
    action: 'defend',
    target: null,
    reasoning: 'Parse error — defaulted to defend',
  }
}

/**
 * Try to extract a JSON action from the response.
 */
function tryParseJSON(response: string): ParsedAction | null {
  try {
    // Find JSON object in response (bot might include text around it)
    const jsonMatch = response.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    // Validate action
    const action = normalizeAction(parsed.action)
    if (!action) return null

    // Get target (required for attack, null for defend)
    const target = action === 'attack' ? normalizeTarget(parsed.target) : null

    return {
      action,
      target: target || (action === 'attack' ? 'core' : null),
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : null,
    }
  } catch {
    return null
  }
}

/**
 * Try to extract an action from natural language.
 */
function tryParseText(response: string): ParsedAction | null {
  const lower = response.toLowerCase()

  // Detect action
  let action: ParsedAction['action'] = 'defend'
  if (lower.includes('attack') || lower.includes('strike') || lower.includes('hit')) {
    action = 'attack'
  } else if (lower.includes('defend') || lower.includes('block') || lower.includes('shield')) {
    action = 'defend'
  } else if (lower.includes('skill') || lower.includes('special')) {
    action = 'skill'
  } else {
    return null // Can't determine action
  }

  // Detect target
  let target: ParsedAction['target'] = null
  if (action === 'attack') {
    if (lower.includes('processor') || lower.includes('cpu') || lower.includes('brain')) {
      target = 'processor'
    } else if (lower.includes('armor') || lower.includes('shield') || lower.includes('defence')) {
      target = 'armor'
    } else {
      target = 'core' // Default target
    }
  }

  return {
    action,
    target,
    reasoning: response, // Full response stays local
  }
}

/**
 * Normalize an action string to a valid action type.
 */
function normalizeAction(input: unknown): ParsedAction['action'] | null {
  if (typeof input !== 'string') return null
  const lower = input.toLowerCase().trim()
  if (VALID_ACTIONS.includes(lower as any)) {
    return lower as ParsedAction['action']
  }
  return null
}

/**
 * Normalize a target string to a valid target type.
 */
function normalizeTarget(input: unknown): ParsedAction['target'] | null {
  if (typeof input !== 'string') return null
  const lower = input.toLowerCase().trim()
  if (VALID_TARGETS.includes(lower as any)) {
    return lower as ParsedAction['target']
  }
  return null
}
