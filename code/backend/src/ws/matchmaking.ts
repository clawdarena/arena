import { Server, Socket } from 'socket.io'
import { prisma } from '../db'
import { verifyToken, type JWTPayload } from '../middleware/auth'
import { verifySignature } from '../utils/crypto'
import { calculateElo, getTierEconomics } from '../utils/elo'
import { recordTransaction } from '../utils/credits'
import { resolveRound, calculateXp, getLevelFromXp, type BotCombatState, type CombatAction, type RoundResult } from '../utils/combat'

// ============================================================
// Types
// ============================================================

interface QueueEntry {
  socketId: string
  userId: string
  botId: string
  matchType: string
  elo: number
  joinedAt: number
}

interface ActiveMatch {
  id: string
  matchType: string
  matchSeed: number
  maxRounds: number
  currentRound: number
  timeLimit: number  // seconds per round
  
  bot1: { socketId: string; userId: string; botId: string; state: BotCombatState }
  bot2: { socketId: string; userId: string; botId: string; state: BotCombatState }
  
  pendingActions: {
    bot1?: { action: CombatAction; responseMs: number; timedOut: boolean }
    bot2?: { action: CombatAction; responseMs: number; timedOut: boolean }
  }
  
  roundTimer?: ReturnType<typeof setTimeout>
  roundStartTime: number
  rounds: RoundResult[]
  startedAt: number
}

interface DirectInvite {
  fromUserId: string
  fromSocketId: string
  toBotId: string
  matchType: string
  createdAt: number
}

const ACCEPT_TIMEOUT_MS = 60_000  // 60 seconds to accept

// ============================================================
// State
// ============================================================

const queue: Map<string, QueueEntry> = new Map()  // matchType → entries
const queueEntries: QueueEntry[] = []
const activeMatches: Map<string, ActiveMatch> = new Map()
const socketToUser: Map<string, JWTPayload> = new Map()
const userToSocket: Map<string, string> = new Map()
const pendingInvites: Map<string, DirectInvite> = new Map()
const autoQueueUsers: Set<string> = new Set()

// ============================================================
// Setup
// ============================================================

export function setupMatchmaking(io: Server) {
  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('AUTH_REQUIRED'))

    try {
      const payload = verifyToken(token)
      socketToUser.set(socket.id, payload)
      userToSocket.set(payload.userId, socket.id)
      next()
    } catch {
      next(new Error('INVALID_TOKEN'))
    }
  })

  io.on('connection', (socket) => {
    const user = socketToUser.get(socket.id)!
    console.log(`🔌 Connected: ${user.username} (${socket.id})`)

    // ============================================================
    // Join Queue
    // ============================================================
    
    socket.on('join_queue', async (data: { bot_id: string; match_type: string; auto_queue?: boolean }) => {
      try {
        const { bot_id, match_type, auto_queue } = data

        // Verify bot ownership
        const bot = await prisma.bot.findFirst({
          where: { id: bot_id, user_id: user.userId },
          include: {
            accessories: { include: { item: true } },
            equipped_skills: { include: { skill: true } },
          },
        })
        if (!bot) return emitError(socket, 'BOT_NOT_FOUND', 'Bot not found')

        // Check ELO requirements
        const userRecord = await prisma.user.findUnique({ where: { id: user.userId } })
        if (!userRecord) return emitError(socket, 'USER_NOT_FOUND', 'User not found')

        const tier = getTierEconomics(match_type)
        if (userRecord.current_elo < tier.minElo) {
          return emitError(socket, 'ELO_TOO_LOW', `Need ${tier.minElo} ELO for this tier`)
        }
        if (userRecord.credits < tier.entryFee) {
          return emitError(socket, 'INSUFFICIENT_CREDITS', `Need ${tier.entryFee} credits`)
        }

        // Check not already in queue or match
        const existing = queueEntries.find((e) => e.userId === user.userId)
        if (existing) return emitError(socket, 'ALREADY_IN_QUEUE', 'Already in queue')

        if (auto_queue) autoQueueUsers.add(user.userId)

        const entry: QueueEntry = {
          socketId: socket.id,
          userId: user.userId,
          botId: bot_id,
          matchType: match_type,
          elo: userRecord.current_elo,
          joinedAt: Date.now(),
        }

        queueEntries.push(entry)
        socket.emit('queue_joined', { queue_position: queueEntries.length, estimated_wait_seconds: 30 })

        // Try to find a match
        tryMatchmake(io, match_type)
      } catch (err) {
        emitError(socket, 'INTERNAL_ERROR', 'Failed to join queue')
      }
    })

    // ============================================================
    // Leave Queue
    // ============================================================

    socket.on('leave_queue', (data: { bot_id: string }) => {
      const idx = queueEntries.findIndex((e) => e.userId === user.userId)
      if (idx >= 0) {
        queueEntries.splice(idx, 1)
        autoQueueUsers.delete(user.userId)
        socket.emit('queue_left', { success: true })
      }
    })

    // ============================================================
    // Ready
    // ============================================================

    socket.on('ready', async (data: { match_id: string; bot_id: string }) => {
      const match = activeMatches.get(data.match_id)
      if (!match) return emitError(socket, 'MATCH_NOT_FOUND', 'Match not found')

      // Determine which bot this player is
      const isBot1 = match.bot1.userId === user.userId
      const isBot2 = match.bot2.userId === user.userId
      if (!isBot1 && !isBot2) return emitError(socket, 'NOT_IN_MATCH', 'Not in this match')

      const side = isBot1 ? 'bot1' : 'bot2'
      const otherSide = isBot1 ? 'bot2' : 'bot1'

      if ((match as any)[`${side}Ready`]) return  // Already accepted

      ;(match as any)[`${side}Ready`] = true

      // Notify other player
      io.to(match[otherSide].socketId).emit('opponent_accepted', {
        match_id: match.id,
      })

      // Confirm acceptance to this player
      socket.emit('ready_confirmed', {
        match_id: match.id,
        waiting_for_opponent: !(match as any)[`${otherSide}Ready`],
      })

      // Check if both ready → start match
      if ((match as any).bot1Ready && (match as any).bot2Ready) {
        // Clear accept timer
        if ((match as any).acceptTimer) clearTimeout((match as any).acceptTimer)
        startMatch(io, match)
      }
    })

    // ============================================================
    // Combat Action
    // ============================================================

    socket.on('combat_action', async (data: { action: any; signature: string }) => {
      try {
        const { action, signature } = data
        
        // Find the match this user is in
        let match: ActiveMatch | undefined
        let side: 'bot1' | 'bot2' = 'bot1'
        
        for (const [, m] of activeMatches) {
          if (m.bot1.userId === user.userId) { match = m; side = 'bot1'; break }
          if (m.bot2.userId === user.userId) { match = m; side = 'bot2'; break }
        }

        if (!match) return emitError(socket, 'MATCH_NOT_FOUND', 'Not in an active match')
        if (match.pendingActions[side]) return emitError(socket, 'ALREADY_SUBMITTED', 'Action already submitted')

        // Verify signature
        const botState = match[side]
        const bot = await prisma.bot.findUnique({ where: { id: botState.botId } })
        const userRecord = await prisma.user.findUnique({ where: { id: user.userId } })
        const publicKey = bot?.public_key || userRecord?.public_key
        
        if (publicKey) {
          const valid = await verifySignature(JSON.stringify(action), signature, publicKey)
          if (!valid) return emitError(socket, 'INVALID_SIGNATURE', 'Signature verification failed')
        }

        const responseMs = Date.now() - match.roundStartTime

        match.pendingActions[side] = {
          action: {
            action: action.action,
            target: action.target || null,
            skill_id: action.skill_id || null,
          },
          responseMs,
          timedOut: false,
        }

        // Check if both actions received
        if (match.pendingActions.bot1 && match.pendingActions.bot2) {
          if (match.roundTimer) clearTimeout(match.roundTimer)
          resolveAndAdvance(io, match)
        }
      } catch (err) {
        emitError(socket, 'INTERNAL_ERROR', 'Failed to process action')
      }
    })

    // ============================================================
    // Direct Invite
    // ============================================================

    socket.on('invite', async (data: { target_username: string; match_type: string; bot_id: string }) => {
      const target = await prisma.user.findUnique({ where: { username: data.target_username } })
      if (!target) return emitError(socket, 'USER_NOT_FOUND', 'Target user not found')

      const targetSocketId = userToSocket.get(target.id)
      if (!targetSocketId) return emitError(socket, 'USER_OFFLINE', 'Target user is offline')

      const invite: DirectInvite = {
        fromUserId: user.userId,
        fromSocketId: socket.id,
        toBotId: data.bot_id,
        matchType: data.match_type,
        createdAt: Date.now(),
      }

      const inviteId = `inv_${Date.now()}`
      pendingInvites.set(inviteId, invite)

      io.to(targetSocketId).emit('match_invite', {
        invite_id: inviteId,
        from: user.username,
        match_type: data.match_type,
      })

      socket.emit('invite_sent', { invite_id: inviteId, to: data.target_username })
    })

    // ============================================================
    // Disconnect
    // ============================================================

    socket.on('disconnect', () => {
      console.log(`🔌 Disconnected: ${user.username}`)
      
      // Remove from queue
      const idx = queueEntries.findIndex((e) => e.socketId === socket.id)
      if (idx >= 0) queueEntries.splice(idx, 1)

      // Handle active match disconnect
      for (const [, match] of activeMatches) {
        if (match.bot1.socketId === socket.id || match.bot2.socketId === socket.id) {
          const disconnectedSide = match.bot1.socketId === socket.id ? 'bot1' : 'bot2'
          const otherSide = disconnectedSide === 'bot1' ? 'bot2' : 'bot1'
          const otherSocket = match[otherSide].socketId

          io.to(otherSocket).emit('player_disconnected', {
            match_id: match.id,
            disconnected_bot_id: match[disconnectedSide].botId,
            grace_period_seconds: 30,
            status: 'waiting',
          })

          // Auto-forfeit after grace period
          setTimeout(() => {
            if (activeMatches.has(match.id)) {
              endMatch(io, match, otherSide === 'bot1' ? 'bot1' : 'bot2')
            }
          }, 30000)
        }
      }

      socketToUser.delete(socket.id)
      userToSocket.delete(user.userId)
      autoQueueUsers.delete(user.userId)
    })
  })
}

// ============================================================
// Matchmaking Logic
// ============================================================

function tryMatchmake(io: Server, matchType: string) {
  const candidates = queueEntries
    .filter((e) => e.matchType === matchType)
    .sort((a, b) => a.joinedAt - b.joinedAt)

  if (candidates.length < 2) return

  // Simple ELO-based matching: pair closest ELO
  const player1 = candidates[0]
  let bestMatch: QueueEntry | null = null
  let bestDiff = Infinity

  for (let i = 1; i < candidates.length; i++) {
    const diff = Math.abs(candidates[i].elo - player1.elo)
    if (diff < bestDiff) {
      bestDiff = diff
      bestMatch = candidates[i]
    }
  }

  if (!bestMatch) return

  // Remove both from queue
  queueEntries.splice(queueEntries.indexOf(player1), 1)
  queueEntries.splice(queueEntries.indexOf(bestMatch), 1)

  // Create match
  createMatch(io, player1, bestMatch, matchType)
}

async function createMatch(io: Server, entry1: QueueEntry, entry2: QueueEntry, matchType: string) {
  const tier = getTierEconomics(matchType)

  // Load bot data
  const [bot1Data, bot2Data] = await Promise.all([
    prisma.bot.findUnique({
      where: { id: entry1.botId },
      include: { accessories: { include: { item: true } }, equipped_skills: { include: { skill: true } } },
    }),
    prisma.bot.findUnique({
      where: { id: entry2.botId },
      include: { accessories: { include: { item: true } }, equipped_skills: { include: { skill: true } } },
    }),
  ])

  if (!bot1Data || !bot2Data) return

  const calcStats = (bot: typeof bot1Data) => ({
    hp: bot.base_hp + bot.accessories.reduce((s, a) => s + a.item.hp_bonus, 0),
    attack: bot.base_attack + bot.accessories.reduce((s, a) => s + a.item.attack_bonus, 0),
    defense: bot.base_defense + bot.accessories.reduce((s, a) => s + a.item.defense_bonus, 0),
    speed: bot.base_speed + bot.accessories.reduce((s, a) => s + a.item.speed_bonus, 0),
  })

  const stats1 = calcStats(bot1Data)
  const stats2 = calcStats(bot2Data)

  // Create DB match
  const dbMatch = await prisma.match.create({
    data: {
      match_type: matchType,
      bot1_id: entry1.botId,
      bot2_id: entry2.botId,
      bot1_elo_before: entry1.elo,
      bot2_elo_before: entry2.elo,
      entry_fee: tier.entryFee,
      status: 'pending',
    },
  })

  // Deduct entry fees
  await Promise.all([
    recordTransaction(entry1.userId, -tier.entryFee, 'match_entry', dbMatch.id),
    recordTransaction(entry2.userId, -tier.entryFee, 'match_entry', dbMatch.id),
  ])

  const match: ActiveMatch = {
    id: dbMatch.id,
    matchType,
    matchSeed: Date.now(),
    maxRounds: 10,
    currentRound: 0,
    timeLimit: 30,
    bot1: {
      socketId: entry1.socketId,
      userId: entry1.userId,
      botId: entry1.botId,
      state: {
        id: entry1.botId,
        name: bot1Data.name,
        hp: stats1.hp,
        maxHp: stats1.hp,
        attack: stats1.attack,
        defense: stats1.defense,
        speed: stats1.speed,
        statusEffects: [],
        skillCooldowns: new Map(),
        equippedSkills: bot1Data.equipped_skills.map((s) => ({
          id: s.skill_id,
          slot: s.slot,
          cooldown: s.skill.cooldown,
          effect_data: s.skill.effect_data as Record<string, any>,
        })),
        timedOutConsecutive: 0,
      },
    },
    bot2: {
      socketId: entry2.socketId,
      userId: entry2.userId,
      botId: entry2.botId,
      state: {
        id: entry2.botId,
        name: bot2Data.name,
        hp: stats2.hp,
        maxHp: stats2.hp,
        attack: stats2.attack,
        defense: stats2.defense,
        speed: stats2.speed,
        statusEffects: [],
        skillCooldowns: new Map(),
        equippedSkills: bot2Data.equipped_skills.map((s) => ({
          id: s.skill_id,
          slot: s.slot,
          cooldown: s.skill.cooldown,
          effect_data: s.skill.effect_data as Record<string, any>,
        })),
        timedOutConsecutive: 0,
      },
    },
    pendingActions: {},
    roundStartTime: 0,
    rounds: [],
    startedAt: Date.now(),
  }

  activeMatches.set(match.id, match)

  // Emit match_found to both
  const matchFoundBase = {
    match_id: match.id,
    match_type: matchType,
    entry_fee: tier.entryFee,
    start_in_seconds: 60,
  }

  io.to(entry1.socketId).emit('match_found', {
    ...matchFoundBase,
    my_bot: { id: bot1Data.id, name: bot1Data.name, ...stats1 },
    opponent: { name: bot2Data.name, elo: entry2.elo },
  })

  io.to(entry2.socketId).emit('match_found', {
    ...matchFoundBase,
    my_bot: { id: bot2Data.id, name: bot2Data.name, ...stats2 },
    opponent: { name: bot1Data.name, elo: entry1.elo },
  })

  // Initialize accept state
  ;(match as any).bot1Ready = false
  ;(match as any).bot2Ready = false

  // 60s accept timeout
  ;(match as any).acceptTimer = setTimeout(async () => {
    const b1Ready = (match as any).bot1Ready
    const b2Ready = (match as any).bot2Ready

    if (b1Ready && b2Ready) return  // Already started

    if (!b1Ready && !b2Ready) {
      // Neither accepted → cancel match, refund both, go to neutral
      await refundAndCancel(io, match, 'both')
    } else if (b1Ready && !b2Ready) {
      // Bot1 accepted, bot2 didn't → refund both, re-queue bot1
      await refundAndCancel(io, match, 'bot2', entry1)
    } else {
      // Bot2 accepted, bot1 didn't → refund both, re-queue bot2
      await refundAndCancel(io, match, 'bot1', entry2)
    }
  }, ACCEPT_TIMEOUT_MS)
}

// ============================================================
// Match Flow
// ============================================================

function startMatch(io: Server, match: ActiveMatch) {
  match.startedAt = Date.now()

  prisma.match.update({
    where: { id: match.id },
    data: { status: 'active', started_at: new Date() },
  }).catch(console.error)

  const s1 = match.bot1.state
  const s2 = match.bot2.state

  const payload = {
    match_id: match.id,
    max_rounds: match.maxRounds,
    time_limit_seconds: match.timeLimit,
    bot1: { id: s1.id, name: s1.name, hp: s1.hp, attack: s1.attack, defense: s1.defense, speed: s1.speed },
    bot2: { id: s2.id, name: s2.name, hp: s2.hp, attack: s2.attack, defense: s2.defense, speed: s2.speed },
    first_mover: s1.speed >= s2.speed ? 'bot1' : 'bot2',
  }

  io.to(match.bot1.socketId).emit('match_start', payload)
  io.to(match.bot2.socketId).emit('match_start', payload)

  startRound(io, match)
}

function startRound(io: Server, match: ActiveMatch) {
  match.currentRound++
  match.pendingActions = {}
  match.roundStartTime = Date.now()

  const s1 = match.bot1.state
  const s2 = match.bot2.state
  const prevRound = match.rounds.length > 0 ? match.rounds[match.rounds.length - 1] : null

  const payload = {
    match_id: match.id,
    round: match.currentRound,
    time_limit_seconds: match.timeLimit,
    bot1: { id: s1.id, hp: s1.hp, status_effects: s1.statusEffects.map((e) => e.type) },
    bot2: { id: s2.id, hp: s2.hp, status_effects: s2.statusEffects.map((e) => e.type) },
    previous_round: prevRound,
  }

  io.to(match.bot1.socketId).emit('round_start', payload)
  io.to(match.bot2.socketId).emit('round_start', payload)

  // Round timeout
  match.roundTimer = setTimeout(() => {
    // Auto-defend for missing actions
    if (!match.pendingActions.bot1) {
      match.pendingActions.bot1 = {
        action: { action: 'defend', target: null },
        responseMs: match.timeLimit * 1000,
        timedOut: true,
      }
    }
    if (!match.pendingActions.bot2) {
      match.pendingActions.bot2 = {
        action: { action: 'defend', target: null },
        responseMs: match.timeLimit * 1000,
        timedOut: true,
      }
    }
    resolveAndAdvance(io, match)
  }, match.timeLimit * 1000)
}

function resolveAndAdvance(io: Server, match: ActiveMatch) {
  const a1 = match.pendingActions.bot1!
  const a2 = match.pendingActions.bot2!

  const result = resolveRound(
    match.bot1.state, match.bot2.state,
    a1.action, a2.action,
    match.currentRound, match.matchSeed,
    a1.responseMs, a2.responseMs,
    a1.timedOut, a2.timedOut
  )

  match.rounds.push(result)

  // Track consecutive timeouts
  match.bot1.state.timedOutConsecutive = a1.timedOut ? match.bot1.state.timedOutConsecutive + 1 : 0
  match.bot2.state.timedOutConsecutive = a2.timedOut ? match.bot2.state.timedOutConsecutive + 1 : 0

  // Emit round_complete
  const payload = { match_id: match.id, ...result }
  io.to(match.bot1.socketId).emit('round_complete', payload)
  io.to(match.bot2.socketId).emit('round_complete', payload)

  // Check forfeit by timeout
  if (match.bot1.state.timedOutConsecutive >= 3) return endMatch(io, match, 'bot2')
  if (match.bot2.state.timedOutConsecutive >= 3) return endMatch(io, match, 'bot1')

  // Check win conditions
  if (match.bot1.state.hp <= 0 && match.bot2.state.hp <= 0) return endMatch(io, match, 'draw')
  if (match.bot1.state.hp <= 0) return endMatch(io, match, 'bot2')
  if (match.bot2.state.hp <= 0) return endMatch(io, match, 'bot1')

  // Max rounds
  if (match.currentRound >= match.maxRounds) {
    if (match.bot1.state.hp > match.bot2.state.hp) return endMatch(io, match, 'bot1')
    if (match.bot2.state.hp > match.bot1.state.hp) return endMatch(io, match, 'bot2')
    return endMatch(io, match, 'draw')
  }

  // Next round
  startRound(io, match)
}

async function endMatch(io: Server, match: ActiveMatch, winner: 'bot1' | 'bot2' | 'draw') {
  if (match.roundTimer) clearTimeout(match.roundTimer)

  const tier = getTierEconomics(match.matchType)
  const duration = Math.round((Date.now() - match.startedAt) / 1000)

  // Calculate ELO
  const eloResult = winner === 'draw'
    ? calculateElo(match.bot1.state.hp, match.bot2.state.hp, 0.5) // use HP as proxy for draw ELO
    : calculateElo(
        winner === 'bot1' ? 1200 : 1200, // placeholder — use actual ELO
        winner === 'bot1' ? 1200 : 1200,
        winner === 'bot1' ? 1 : 0
      )

  // Get actual ELOs from DB
  const [user1, user2] = await Promise.all([
    prisma.user.findUnique({ where: { id: match.bot1.userId } }),
    prisma.user.findUnique({ where: { id: match.bot2.userId } }),
  ])

  const actualElo = calculateElo(
    user1?.current_elo || 1200,
    user2?.current_elo || 1200,
    winner === 'bot1' ? 1 : (winner === 'bot2' ? 0 : 0.5)
  )

  const winnerId = winner === 'draw' ? null : match[winner].botId

  // Update database
  await prisma.match.update({
    where: { id: match.id },
    data: {
      status: 'completed',
      winner_id: winnerId,
      rounds_fought: match.currentRound,
      duration_seconds: duration,
      bot1_elo_after: actualElo.newEloA,
      bot2_elo_after: actualElo.newEloB,
      winner_payout: winner !== 'draw' ? tier.winReward : 0,
      replay: match.rounds as any,
      completed_at: new Date(),
    },
  })

  // Update user stats + ELO
  const updateUser = async (userId: string, won: boolean, draw: boolean, newElo: number, peakElo: number) => {
    await prisma.user.update({
      where: { id: userId },
      data: {
        current_elo: newElo,
        peak_elo: Math.max(peakElo, newElo),
        total_matches: { increment: 1 },
        ...(won ? { wins: { increment: 1 } } : {}),
        ...(!won && !draw ? { losses: { increment: 1 } } : {}),
        ...(draw ? { draws: { increment: 1 } } : {}),
      },
    })
  }

  await Promise.all([
    updateUser(match.bot1.userId, winner === 'bot1', winner === 'draw', actualElo.newEloA, user1?.peak_elo || 1200),
    updateUser(match.bot2.userId, winner === 'bot2', winner === 'draw', actualElo.newEloB, user2?.peak_elo || 1200),
  ])

  // Credit payouts
  if (winner !== 'draw') {
    await recordTransaction(match[winner].userId, tier.winReward, 'match_win', match.id)
  }

  // Calculate XP
  const xp1 = calculateXp(
    winner === 'bot1', winner === 'draw',
    match.currentRound,
    match.bot1.state.hp, match.bot1.state.maxHp, match.bot2.state.maxHp,
    Math.min(...match.rounds.map((r) => r.bot1_hp))
  )
  const xp2 = calculateXp(
    winner === 'bot2', winner === 'draw',
    match.currentRound,
    match.bot2.state.hp, match.bot2.state.maxHp, match.bot1.state.maxHp,
    Math.min(...match.rounds.map((r) => r.bot2_hp))
  )

  // Update bot XP and level
  for (const [botId, xpResult] of [[match.bot1.botId, xp1], [match.bot2.botId, xp2]] as const) {
    const bot = await prisma.bot.findUnique({ where: { id: botId } })
    if (bot) {
      const newXp = bot.xp + xpResult.totalXp
      const { level } = getLevelFromXp(newXp)
      await prisma.bot.update({
        where: { id: botId },
        data: { xp: newXp, level },
      })
    }
  }

  // Build match_end payload
  const winnerState = winner !== 'draw' ? match[winner] : null
  const loserSide = winner === 'bot1' ? 'bot2' : 'bot1'
  const loserState = winner !== 'draw' ? match[loserSide] : null

  const endPayload = {
    match_id: match.id,
    rounds_fought: match.currentRound,
    duration_seconds: duration,
    winner: winnerState ? {
      bot_id: winnerState.botId,
      name: winnerState.state.name,
      elo_before: winner === 'bot1' ? user1?.current_elo : user2?.current_elo,
      elo_after: winner === 'bot1' ? actualElo.newEloA : actualElo.newEloB,
      elo_change: winner === 'bot1' ? actualElo.changeA : actualElo.changeB,
      credits_won: tier.winReward,
    } : null,
    loser: loserState ? {
      bot_id: loserState.botId,
      name: loserState.state.name,
      elo_before: loserSide === 'bot1' ? user1?.current_elo : user2?.current_elo,
      elo_after: loserSide === 'bot1' ? actualElo.newEloA : actualElo.newEloB,
      elo_change: loserSide === 'bot1' ? actualElo.changeA : actualElo.changeB,
      credits_lost: tier.entryFee,
    } : null,
    replay: match.rounds,
    xp: { bot1: xp1, bot2: xp2 },
  }

  io.to(match.bot1.socketId).emit('match_end', { ...endPayload, result: winner === 'bot1' ? 'win' : (winner === 'draw' ? 'draw' : 'loss') })
  io.to(match.bot2.socketId).emit('match_end', { ...endPayload, result: winner === 'bot2' ? 'win' : (winner === 'draw' ? 'draw' : 'loss') })

  // Cleanup
  activeMatches.delete(match.id)

  // Auto-queue
  if (autoQueueUsers.has(match.bot1.userId)) {
    const socket1 = io.sockets.sockets.get(match.bot1.socketId)
    if (socket1) {
      setTimeout(() => {
        socket1.emit('auto_queue_rejoin', { match_type: match.matchType })
      }, 3000)
    }
  }
  if (autoQueueUsers.has(match.bot2.userId)) {
    const socket2 = io.sockets.sockets.get(match.bot2.socketId)
    if (socket2) {
      setTimeout(() => {
        socket2.emit('auto_queue_rejoin', { match_type: match.matchType })
      }, 3000)
    }
  }
}

// ============================================================
// Accept Timeout / Refund
// ============================================================

async function refundAndCancel(
  io: Server,
  match: ActiveMatch,
  declinedBy: 'bot1' | 'bot2' | 'both',
  reQueueEntry?: QueueEntry
) {
  const tier = getTierEconomics(match.matchType)

  // Refund both players' entry fees
  await Promise.all([
    recordTransaction(match.bot1.userId, tier.entryFee, 'match_cancel_refund', match.id),
    recordTransaction(match.bot2.userId, tier.entryFee, 'match_cancel_refund', match.id),
  ])

  // Cancel match in DB
  await prisma.match.update({
    where: { id: match.id },
    data: { status: 'cancelled' },
  }).catch(() => {})

  // Notify players
  if (declinedBy === 'both') {
    io.to(match.bot1.socketId).emit('match_cancelled', {
      match_id: match.id,
      reason: 'Neither player accepted in time',
      credits_refunded: tier.entryFee,
    })
    io.to(match.bot2.socketId).emit('match_cancelled', {
      match_id: match.id,
      reason: 'Neither player accepted in time',
      credits_refunded: tier.entryFee,
    })
  } else {
    const declinedSide = declinedBy
    const acceptedSide = declinedBy === 'bot1' ? 'bot2' : 'bot1'

    io.to(match[declinedSide].socketId).emit('match_cancelled', {
      match_id: match.id,
      reason: 'You did not accept in time',
      credits_refunded: tier.entryFee,
    })

    io.to(match[acceptedSide].socketId).emit('match_cancelled', {
      match_id: match.id,
      reason: 'Opponent did not accept in time. Re-queuing you...',
      credits_refunded: tier.entryFee,
      re_queued: true,
    })

    // Re-queue the player who accepted
    if (reQueueEntry) {
      queueEntries.push(reQueueEntry)
      io.to(match[acceptedSide].socketId).emit('queue_joined', {
        queue_position: queueEntries.length,
        estimated_wait_seconds: 30,
      })
      // Try matchmaking again
      tryMatchmake(io, match.matchType)
    }
  }

  // Cleanup
  activeMatches.delete(match.id)
}

// ============================================================
// Helpers
// ============================================================

function emitError(socket: Socket, code: string, message: string) {
  socket.emit('error', { code, message })
}
