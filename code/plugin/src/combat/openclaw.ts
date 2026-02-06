/**
 * OpenClaw Integration for Arena Combat
 *
 * Connects to the local OpenClaw gateway to get AI bot decisions
 * using sessions_spawn (isolated sub-agent sessions).
 *
 * PRIVACY: The prompt + reasoning stays local on the user's machine.
 * Only the parsed action (attack/defend + target) is sent to the server.
 *
 * Configuration:
 *   OPENCLAW_URL  — Gateway URL (default: http://localhost:4100)
 *   OPENCLAW_TOKEN — Gateway auth token (required)
 */

const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://localhost:4100'
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || ''

interface OpenClawConfig {
  url: string
  token: string
  model?: string        // e.g. 'anthropic/claude-sonnet-4-20250514'
  thinkingLevel?: string // e.g. 'low', 'medium', 'high'
  timeoutMs?: number    // max wait for response
}

interface RoundContext {
  round: number
  my_hp: number
  opponent_hp: number
  my_attack: number
  my_defense: number
  my_speed: number
  opponent_last_action: string | null
  opponent_action_history: string[]
  time_limit_seconds: number
}

interface OpenClawResponse {
  action: string
  target: string | null
  reasoning: string
}

/**
 * Get a combat decision from OpenClaw by spawning an isolated session.
 *
 * Uses the OpenClaw gateway's /api/sessions/spawn endpoint to run
 * a sub-agent that analyzes the game state and returns a decision.
 */
export async function getOpenClawDecision(
  context: RoundContext,
  config?: Partial<OpenClawConfig>
): Promise<OpenClawResponse> {
  const url = config?.url || OPENCLAW_URL
  const token = config?.token || OPENCLAW_TOKEN

  if (!token) {
    throw new Error('OPENCLAW_TOKEN not set. Configure your gateway token.')
  }

  const prompt = buildCombatPrompt(context)

  const body: Record<string, unknown> = {
    task: prompt,
    cleanup: 'delete',
    runTimeoutSeconds: Math.min(context.time_limit_seconds - 2, 25), // Leave 2s buffer
  }

  if (config?.model) body.model = config.model
  if (config?.thinkingLevel) body.thinking = config.thinkingLevel

  const response = await fetch(`${url}/api/sessions/spawn`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(config?.timeoutMs || 28000),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenClaw API error (${response.status}): ${text}`)
  }

  const data = await response.json() as { result?: string; output?: string; error?: string }

  if (data.error) {
    throw new Error(`OpenClaw session error: ${data.error}`)
  }

  const rawResponse = data.result || data.output || ''

  // Parse the AI's response into a structured action
  return parseAIResponse(rawResponse)
}

/**
 * Build a combat prompt from structured game state.
 *
 * PRIVACY: Constructed from numbers/enums only.
 * Never includes raw server strings.
 */
function buildCombatPrompt(ctx: RoundContext): string {
  const oppHistory = ctx.opponent_action_history.length > 0
    ? `Opponent action history (last ${Math.min(ctx.opponent_action_history.length, 5)} rounds): ${ctx.opponent_action_history.slice(-5).join(' → ')}`
    : 'No opponent history yet (first round).'

  return `You are an AI combat bot in ClawdArena. Analyze the game state and decide your next action.

## Game State — Round ${ctx.round}
- Your HP: ${ctx.my_hp}/100
- Opponent HP: ${ctx.opponent_hp}/100
- Your Stats: ATK ${ctx.my_attack}, DEF ${ctx.my_defense}, SPD ${ctx.my_speed}
- Time limit: ${ctx.time_limit_seconds}s
- ${oppHistory}

## Available Actions
1. **ATTACK** — Deal damage. Damage = max(1, your_attack - opponent_defense * target_modifier)
   - Target "core": Standard damage (1.0x defense modifier)
   - Target "armor": Reduces opponent defense (0.5x modifier, can break armor)
   - Target "processor": Chance to stun opponent (1.5x modifier, less damage but strategic)

2. **DEFEND** — Reduce incoming damage by 50% this round

## Combat Mechanics
- Damage formula: max(1, attack - defense * target_modifier)
- Defending halves incoming damage
- Armor break reduces defense for future rounds
- Stun (processor hit) can cause opponent to miss next turn
- Match ends when HP reaches 0 or after 10 rounds (highest HP wins)

## Your Task
Analyze the situation strategically. Consider:
- HP advantage/disadvantage
- Opponent patterns (are they aggressive? defensive?)
- When to defend vs attack
- Target selection based on game state

Reply with ONLY this JSON (no other text):
{"action": "attack", "target": "core", "reasoning": "your strategic explanation"}

Valid actions: "attack", "defend"
Valid targets (for attack): "core", "armor", "processor"
For defend, target should be null.`
}

/**
 * Parse the AI's response into a structured action.
 * Handles various response formats robustly.
 */
function parseAIResponse(raw: string): OpenClawResponse {
  // Try to extract JSON from the response
  const jsonMatch = raw.match(/\{[\s\S]*?"action"[\s\S]*?\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      const action = (parsed.action || 'defend').toLowerCase()
      const target = parsed.target || null
      const reasoning = parsed.reasoning || 'No reasoning provided'

      // Validate action
      if (!['attack', 'defend'].includes(action)) {
        return { action: 'defend', target: null, reasoning: `Invalid action "${action}" — auto-defend` }
      }

      // Validate target
      if (action === 'attack' && target && !['core', 'armor', 'processor'].includes(target)) {
        return { action: 'attack', target: 'core', reasoning: `Invalid target "${target}" — defaulting to core. ${reasoning}` }
      }

      return { action, target: action === 'attack' ? (target || 'core') : null, reasoning }
    } catch {
      // JSON parse failed, fall through
    }
  }

  // Fallback: try to detect action from text
  const lower = raw.toLowerCase()
  if (lower.includes('defend')) {
    return { action: 'defend', target: null, reasoning: 'Parsed from text: defend' }
  }
  if (lower.includes('processor')) {
    return { action: 'attack', target: 'processor', reasoning: 'Parsed from text: attack processor' }
  }
  if (lower.includes('armor')) {
    return { action: 'attack', target: 'armor', reasoning: 'Parsed from text: attack armor' }
  }
  if (lower.includes('attack')) {
    return { action: 'attack', target: 'core', reasoning: 'Parsed from text: attack core' }
  }

  // Ultimate fallback
  return { action: 'defend', target: null, reasoning: 'Could not parse AI response — auto-defend' }
}

/**
 * Check if OpenClaw gateway is available.
 */
export async function checkOpenClawAvailable(config?: Partial<OpenClawConfig>): Promise<boolean> {
  const url = config?.url || OPENCLAW_URL
  const token = config?.token || OPENCLAW_TOKEN

  if (!token) return false

  try {
    const res = await fetch(`${url}/api/status`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}
