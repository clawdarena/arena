'use client'

import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2, Save, ChevronDown, ChevronUp, Shield, Swords, Zap, Target, Heart, Eye, RotateCcw } from 'lucide-react'

// ============================================================
// 20 Strategy Templates
// ============================================================

interface StrategyTemplate {
  id: string
  label: string
  category: 'offensive' | 'defensive' | 'tactical' | 'adaptive' | 'resource'
  icon: string
  rule: string
  description: string
}

const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  // Offensive (5)
  {
    id: 'aggro_core',
    label: 'Always Attack Core',
    category: 'offensive',
    icon: '⚔️',
    rule: 'Always attack core unless a higher priority rule applies.',
    description: 'Simple and reliable — consistent damage on the main target.',
  },
  {
    id: 'aggro_processor_low',
    label: 'Processor When Enemy Low',
    category: 'offensive',
    icon: '🎯',
    rule: 'When opponent HP is below 25%, attack processor to go for the kill with stun chance.',
    description: 'Finish them off with processor hits — stun locks them out.',
  },
  {
    id: 'armor_break_opener',
    label: 'Armor Break Opener',
    category: 'offensive',
    icon: '💥',
    rule: 'On round 1, attack armor to apply armor break debuff. Then switch to core.',
    description: 'Start by weakening their defense, then pile on damage.',
  },
  {
    id: 'berserker_rush',
    label: 'All-In Berserker Rush',
    category: 'offensive',
    icon: '🔥',
    rule: 'Use Berserker Rage on round 1 if available. Attack aggressively every round. Never defend.',
    description: 'Maximum aggression — win fast or die trying.',
  },
  {
    id: 'counter_puncher',
    label: 'Counter Puncher',
    category: 'offensive',
    icon: '🥊',
    rule: 'If opponent used a skill last round, attack immediately to counter them (+50% damage). Otherwise attack core.',
    description: 'Read their skill usage and punish it. Triggers the counter system.',
  },

  // Defensive (5)
  {
    id: 'defend_low_hp',
    label: 'Defend When Low HP',
    category: 'defensive',
    icon: '🛡️',
    rule: 'When my HP drops below 30%, defend to reduce incoming damage and gain energy.',
    description: 'Survival instinct — buy time when things look bad.',
  },
  {
    id: 'shield_wall_critical',
    label: 'Shield Wall at Critical',
    category: 'defensive',
    icon: '🏰',
    rule: 'When my HP is below 20% and Shield Wall is available, use it to block all damage and heal.',
    description: 'Emergency shield — last resort when near death.',
  },
  {
    id: 'turtle_and_chip',
    label: 'Turtle & Chip',
    category: 'defensive',
    icon: '🐢',
    rule: 'Alternate between defend and attack core. Defend on odd rounds, attack on even rounds.',
    description: 'Slow and steady — take less damage while chipping away.',
  },
  {
    id: 'energy_bank',
    label: 'Energy Banking',
    category: 'defensive',
    icon: '🔋',
    rule: 'Defend for the first 2 rounds to build up energy, then unleash skills.',
    description: 'Save energy early, then spend big in the mid-game.',
  },
  {
    id: 'regen_stall',
    label: 'Regeneration Stall',
    category: 'defensive',
    icon: '💚',
    rule: 'When Regenerate is available and my HP is below 60%, use it. Then defend while it heals.',
    description: 'Heal up and tank through damage with sustained regeneration.',
  },

  // Tactical (5)
  {
    id: 'pattern_exploit',
    label: 'Exploit Repeat Patterns',
    category: 'tactical',
    icon: '🧩',
    rule: 'If opponent did the same action 2 rounds in a row, counter it. Attack beats their skill, defend beats their attack, skill beats their defend.',
    description: 'Read their patterns and punish predictability.',
  },
  {
    id: 'emp_then_burst',
    label: 'EMP Then Burst',
    category: 'tactical',
    icon: '⚡',
    rule: 'When EMP Blast is available and I have 50+ energy, use EMP to stun, then attack processor next round.',
    description: 'Stun them, then hit them while they can\'t fight back.',
  },
  {
    id: 'overclock_timing',
    label: 'Mid-Game Overclock',
    category: 'tactical',
    icon: '⏱️',
    rule: 'Use Overclock on round 3-4 when both bots are still healthy. The attack and speed boost compounds over 2 rounds.',
    description: 'Time your power-up for maximum round coverage.',
  },
  {
    id: 'mirror_bait',
    label: 'Mirror Coat Bait',
    category: 'tactical',
    icon: '🪞',
    rule: 'When HP is between 40-60%, use Mirror Coat. Opponents often attack when they sense weakness, reflecting damage back.',
    description: 'Look vulnerable, then reflect their aggression back at them.',
  },
  {
    id: 'target_rotation',
    label: 'Rotate Targets',
    category: 'tactical',
    icon: '🔄',
    rule: 'Cycle targets: round 1 armor (debuff), round 2 core (damage), round 3 processor (stun chance). Repeat.',
    description: 'Keep them guessing — varied targets make you harder to predict.',
  },

  // Adaptive (3)
  {
    id: 'adaptive_aggression',
    label: 'Adaptive Aggression',
    category: 'adaptive',
    icon: '📊',
    rule: 'If I have more HP than opponent, play aggressively (attack). If they have more HP, play defensively (defend, use skills). Match intensity to the situation.',
    description: 'Press advantages, retreat when behind.',
  },
  {
    id: 'momentum_rider',
    label: 'Ride Momentum',
    category: 'adaptive',
    icon: '🌊',
    rule: 'If I successfully countered last round (momentum active), keep attacking to build the streak. If I missed a counter, switch to defend for a round to reset.',
    description: 'Build on success, regroup after failure.',
  },
  {
    id: 'energy_aware',
    label: 'Energy-Aware Play',
    category: 'adaptive',
    icon: '⚡',
    rule: 'When energy is above 60, use skills aggressively. When energy is 20-60, mix attacks and defends. When below 20, defend to regenerate energy.',
    description: 'Let your energy level dictate your play style.',
  },

  // Resource (2)
  {
    id: 'skill_cooldown_manager',
    label: 'Cooldown Manager',
    category: 'resource',
    icon: '⏳',
    rule: 'Track skill cooldowns. Never waste a round defending when a powerful skill is coming off cooldown next round. Plan attacks around skill availability.',
    description: 'Optimize around when your skills become available.',
  },
  {
    id: 'energy_efficiency',
    label: 'Energy Efficiency',
    category: 'resource',
    icon: '💎',
    rule: 'Prefer cheap actions (attack, defend) when winning. Save energy for expensive skills only when behind or for kill shots.',
    description: 'Don\'t overspend energy when basic moves will do.',
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  offensive: 'text-red-400 bg-red-900/20 border-red-800/30',
  defensive: 'text-blue-400 bg-blue-900/20 border-blue-800/30',
  tactical: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/30',
  adaptive: 'text-green-400 bg-green-900/20 border-green-800/30',
  resource: 'text-purple-400 bg-purple-900/20 border-purple-800/30',
}

const CATEGORY_LABELS: Record<string, string> = {
  offensive: '⚔️ Offensive',
  defensive: '🛡️ Defensive',
  tactical: '🧩 Tactical',
  adaptive: '📊 Adaptive',
  resource: '💎 Resource',
}

// ============================================================
// Component
// ============================================================

interface StrategyEditorProps {
  botId: string
}

interface SavedStrategy {
  activeRules: string[]     // template IDs
  customNotes: string       // free text
  personality: number       // 0 = defensive, 50 = balanced, 100 = aggressive
}

function getStorageKey(botId: string) {
  return `clawdarena_strategy_${botId}`
}

function loadStrategy(botId: string): SavedStrategy {
  if (typeof window === 'undefined') return { activeRules: [], customNotes: '', personality: 50 }
  try {
    const raw = localStorage.getItem(getStorageKey(botId))
    if (raw) return JSON.parse(raw)
  } catch {}
  return { activeRules: [], customNotes: '', personality: 50 }
}

function saveStrategy(botId: string, strategy: SavedStrategy) {
  if (typeof window === 'undefined') return
  localStorage.setItem(getStorageKey(botId), JSON.stringify(strategy))
}

export function StrategyEditor({ botId }: StrategyEditorProps) {
  const [strategy, setStrategy] = useState<SavedStrategy>(() => loadStrategy(botId))
  const [showTemplates, setShowTemplates] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(true)

  // Auto-save on change
  useEffect(() => {
    saveStrategy(botId, strategy)
  }, [botId, strategy])

  function toggleRule(templateId: string) {
    setStrategy(prev => {
      const active = prev.activeRules.includes(templateId)
        ? prev.activeRules.filter(id => id !== templateId)
        : [...prev.activeRules, templateId]
      return { ...prev, activeRules: active }
    })
  }

  function removeRule(templateId: string) {
    setStrategy(prev => ({
      ...prev,
      activeRules: prev.activeRules.filter(id => id !== templateId),
    }))
  }

  function handleSave() {
    saveStrategy(botId, strategy)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const activeTemplates = STRATEGY_TEMPLATES.filter(t => strategy.activeRules.includes(t.id))
  const availableTemplates = STRATEGY_TEMPLATES.filter(t =>
    !strategy.activeRules.includes(t.id) &&
    (filterCategory === 'all' || t.category === filterCategory)
  )

  const personalityLabel = strategy.personality < 30 ? 'Defensive'
    : strategy.personality < 70 ? 'Balanced'
    : 'Aggressive'

  const personalityColor = strategy.personality < 30 ? 'text-blue-400'
    : strategy.personality < 70 ? 'text-yellow-400'
    : 'text-red-400'

  // Build preview of what the bot "sees"
  const previewText = [
    `Personality: ${personalityLabel} (${strategy.personality}/100)`,
    '',
    '== Active Rules ==',
    ...activeTemplates.map((t, i) => `${i + 1}. ${t.rule}`),
    ...(strategy.customNotes ? ['', '== Custom Notes ==', strategy.customNotes] : []),
  ].join('\n')

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-800/50 transition"
      >
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-cyan-400" />
          <div className="text-left">
            <h2 className="text-sm font-semibold text-white">AI Strategy</h2>
            <p className="text-xs text-gray-500">{activeTemplates.length} rules active · 100% local · never sent to server</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-5">
          {/* Privacy banner */}
          <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-lg px-4 py-2.5 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-300">
              Strategy notes stay on YOUR device. The server never sees your coaching — only the action your bot picks each round.
            </p>
          </div>

          {/* Personality Slider */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Personality: <span className={personalityColor}>{personalityLabel}</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-blue-400">🛡️</span>
              <input
                type="range"
                min={0}
                max={100}
                value={strategy.personality}
                onChange={(e) => setStrategy(prev => ({ ...prev, personality: parseInt(e.target.value) }))}
                className="flex-1 accent-cyan-500 h-2"
              />
              <span className="text-xs text-red-400">⚔️</span>
            </div>
            <p className="text-[10px] text-gray-600 mt-1">
              {strategy.personality < 30 ? 'Bot prioritizes survival, defends often, uses skills conservatively.'
                : strategy.personality < 70 ? 'Bot balances offense and defense based on situation.'
                : 'Bot prioritizes damage output, attacks relentlessly, uses skills aggressively.'}
            </p>
          </div>

          {/* Active Rules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3 h-3" />
                Active Rules ({activeTemplates.length})
              </label>
              {activeTemplates.length > 0 && (
                <button
                  onClick={() => setStrategy(prev => ({ ...prev, activeRules: [] }))}
                  className="text-xs text-gray-600 hover:text-red-400 transition"
                >
                  Clear all
                </button>
              )}
            </div>

            {activeTemplates.length === 0 ? (
              <div className="text-sm text-gray-600 bg-gray-800/30 rounded-lg p-4 text-center">
                No rules active. Add templates below to coach your bot.
              </div>
            ) : (
              <div className="space-y-2">
                {activeTemplates.map((template, index) => (
                  <div
                    key={template.id}
                    className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${CATEGORY_COLORS[template.category]}`}
                  >
                    <span className="text-sm mt-0.5 font-mono text-gray-500 w-5 shrink-0">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span>{template.icon}</span>
                        <span className="text-sm font-medium">{template.label}</span>
                      </div>
                      <p className="text-xs opacity-70 mt-0.5">{template.rule}</p>
                    </div>
                    <button
                      onClick={() => removeRule(template.id)}
                      className="text-gray-600 hover:text-red-400 transition p-1 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Templates */}
          <div>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition"
            >
              <Plus className="w-4 h-4" />
              {showTemplates ? 'Hide Templates' : 'Add Strategy Rules'}
            </button>

            {showTemplates && (
              <div className="mt-3 space-y-3">
                {/* Category filter */}
                <div className="flex gap-2 flex-wrap">
                  {['all', 'offensive', 'defensive', 'tactical', 'adaptive', 'resource'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        filterCategory === cat
                          ? 'bg-cyan-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {cat === 'all' ? '🌐 All' : CATEGORY_LABELS[cat]}
                    </button>
                  ))}
                </div>

                {/* Available templates */}
                <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
                  {availableTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => toggleRule(template.id)}
                      className="text-left bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-lg px-3 py-2.5 transition group"
                    >
                      <div className="flex items-center gap-2">
                        <span>{template.icon}</span>
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white">{template.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[template.category]}`}>
                          {template.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                    </button>
                  ))}
                  {availableTemplates.length === 0 && (
                    <p className="text-sm text-gray-600 text-center py-4">All templates in this category are active!</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Custom Notes */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
              <Eye className="w-3 h-3" />
              Custom Notes
            </label>
            <textarea
              value={strategy.customNotes}
              onChange={(e) => setStrategy(prev => ({ ...prev, customNotes: e.target.value }))}
              placeholder="Add your own strategy instructions... e.g. 'Focus on energy management early game, save Fireball for when opponent is below 40 HP'"
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white text-sm placeholder-gray-600 resize-none"
            />
            <p className="text-[10px] text-gray-600 mt-1">Free text — write anything your bot should know during combat.</p>
          </div>

          {/* Strategy Preview */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
              📋 Strategy Preview (what your bot reads)
            </label>
            <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs text-gray-400 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
              {previewText || 'No strategy configured yet.'}
            </pre>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saved ? '✓ Saved to Browser' : 'Save Strategy'}
            </button>
            <button
              onClick={() => setStrategy({ activeRules: [], customNotes: '', personality: 50 })}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 transition"
              title="Reset all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
