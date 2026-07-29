// ============================================================
// Hegemonía Core Engine — Player Action System
// ============================================================
// Defines all 10 player actions, their costs, effects, cooldowns,
// and execution logic. Called during the "player_decisions" phase.

import type {
  NationNode, TradeEdge, GameState, GameEvent,
  PlayerActionType, PlayerAction, PlayerActionMeta, CooldownMap, Ideology,
} from "./types";
import { computeMilitaryPower, computeCulturalPower, computeDiplomaticPower } from "./economy";

// ─── Action Registry ────────────────────────────────────────

export const PLAYER_ACTIONS: PlayerActionMeta[] = [
  {
    type: "invest_industry",
    label: "Invertir en Industria",
    icon: "🏭",
    description: "+8-12 industrialización, +0.03B GDP. Acelera la transición manufacturera.",
    cost: 0.05,
    cooldown: 1,
    requiresTarget: false,
    category: "economy",
    ideologyBonus: ["mercantilism", "liberalism"],
  },
  {
    type: "build_military",
    label: "Fortalecer Ejército",
    icon: "⚔️",
    description: "+15 poder militar. Costo de oportunidad: -0.02B GDP.",
    cost: 0.03,
    cooldown: 2,
    requiresTarget: false,
    category: "military",
    ideologyBonus: ["nationalism", "absolutism"],
  },
  {
    type: "lower_tariffs",
    label: "Reducir Aranceles",
    icon: "📉",
    description: "Baja todos los aranceles un 30%. Impulsa comercio pero reduce ingresos.",
    cost: 0.02,
    cooldown: 3,
    requiresTarget: false,
    category: "economy",
    ideologyBonus: ["liberalism"],
  },
  {
    type: "raise_tariffs",
    label: "Subir Aranceles",
    icon: "📈",
    description: "Sube todos los aranceles un 30%. Protege industria pero enfria relaciones.",
    cost: 0.01,
    cooldown: 3,
    requiresTarget: false,
    category: "economy",
    ideologyBonus: ["mercantilism"],
  },
  {
    type: "seek_trade",
    label: "Buscar Socios",
    icon: "🤝",
    description: "Abre nueva ruta comercial con una nación cercana.",
    cost: 0.04,
    cooldown: 1,
    requiresTarget: true,
    category: "diplomacy",
    ideologyBonus: ["liberalism"],
  },
  {
    type: "spread_ideology",
    label: "Expansión Cultural",
    icon: "📢",
    description: "+5 poder cultural. Presiona ideológicamente a un vecino.",
    cost: 0.03,
    cooldown: 2,
    requiresTarget: true,
    category: "ideology",
    ideologyBonus: ["mercantilism", "liberalism", "marxism"],
  },
  {
    type: "suppress_unrest",
    label: "Restaurar Orden",
    icon: "🛡️",
    description: "-20 descontento, +10 estabilidad. Costo: -0.02B GDP.",
    cost: 0.02,
    cooldown: 2,
    requiresTarget: false,
    category: "control",
    minStability: 0,
  },
  {
    type: "build_infrastructure",
    label: "Construir Infraestructura",
    icon: "🏗️",
    description: "+0.05B GDP permanente, +3 industrialización. Inversión a largo plazo.",
    cost: 0.06,
    cooldown: 3,
    requiresTarget: false,
    category: "economy",
    ideologyBonus: ["liberalism", "mercantilism"],
  },
  {
    type: "diplomatic_pressure",
    label: "Presión Diplomática",
    icon: "🏛️",
    description: "+10 poder diplomático, +5 cultural. Mejora influencia internacional.",
    cost: 0.03,
    cooldown: 2,
    requiresTarget: false,
    category: "diplomacy",
    ideologyBonus: ["conservatism", "liberalism"],
  },
  {
    type: "colonial_expansion",
    label: "Expansión Colonial",
    icon: "🏴",
    description: "Extrae recursos de una nación periférica. +recursos, -relaciones.",
    cost: 0.04,
    cooldown: 3,
    requiresTarget: true,
    category: "military",
    ideologyBonus: ["mercantilism", "absolutism"],
  },
];

const ACTION_META: Record<PlayerActionType, PlayerActionMeta> = {
  invest_industry: PLAYER_ACTIONS[0],
  build_military: PLAYER_ACTIONS[1],
  lower_tariffs: PLAYER_ACTIONS[2],
  raise_tariffs: PLAYER_ACTIONS[3],
  seek_trade: PLAYER_ACTIONS[4],
  spread_ideology: PLAYER_ACTIONS[5],
  suppress_unrest: PLAYER_ACTIONS[6],
  build_infrastructure: PLAYER_ACTIONS[7],
  diplomatic_pressure: PLAYER_ACTIONS[8],
  colonial_expansion: PLAYER_ACTIONS[9],
};

// ─── Public API ─────────────────────────────────────────────

/** Get metadata for a player action type */
export function getPlayerActionMeta(type: PlayerActionType): PlayerActionMeta {
  return ACTION_META[type];
}

/** Check if an action is on cooldown */
export function isOnCooldown(type: PlayerActionType, cooldowns: CooldownMap, currentTurn: number): boolean {
  const available = cooldowns[type];
  return available !== undefined && available > currentTurn;
}

/** Check if player can afford an action (considers primary + secondary ideologies for discount) */
export function canAfford(type: PlayerActionType, playerNation: NationNode): boolean {
  const meta = ACTION_META[type];
  // Apply ideology discount (20% cost reduction for matching primary or any secondary ideology)
  const hasIdeologyBonus = meta.ideologyBonus?.some(
    (i) => i === playerNation.primaryIdeology || playerNation.secondaryIdeologies.includes(i)
  ) ?? false;
  const discount = hasIdeologyBonus ? 0.8 : 1.0;
  return playerNation.gdp >= meta.cost * discount;
}

/** Get effective cost (with ideology discount for primary + secondary ideologies) */
export function getEffectiveCost(type: PlayerActionType, playerNation: NationNode): number {
  const meta = ACTION_META[type];
  const hasIdeologyBonus = meta.ideologyBonus?.some(
    (i) => i === playerNation.primaryIdeology || playerNation.secondaryIdeologies.includes(i)
  ) ?? false;
  const discount = hasIdeologyBonus ? 0.8 : 1.0;
  return Math.round(meta.cost * discount * 1000) / 1000;
}

/** Queue a player action for next turn execution */
export function queueAction(
  type: PlayerActionType,
  targetId: string | undefined,
  state: GameState
): { success: boolean; reason?: string } {
  const player = state.nations.find((n) => n.isPlayer);
  if (!player) return { success: false, reason: "No hay nación del jugador" };

  if (state.playerActionsUsedThisTurn >= state.maxActionsPerTurn) {
    return { success: false, reason: `Máximo ${state.maxActionsPerTurn} acciones por turno` };
  }

  if (isOnCooldown(type, state.playerCooldowns, state.turn)) {
    return { success: false, reason: "Acción en período de enfriamiento" };
  }

  if (!canAfford(type, player)) {
    return { success: false, reason: "PIB insuficiente" };
  }

  const meta = ACTION_META[type];
  if (meta.requiresTarget && !targetId) {
    return { success: false, reason: "Selecciona una nación objetivo" };
  }

  state.playerActionQueue.push({
    id: `pa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    targetId,
    queuedTurn: state.turn,
  });

  return { success: true };
}

// ─── Phase 6: PLAYER DECISIONS ─────────────────────────────

/**
 * Execute all queued player actions during the player_decisions phase.
 * This is called by simulation.ts during the game loop.
 * Returns events generated by player actions.
 */
export function executePlayerActions(state: GameState): GameEvent[] {
  const player = state.nations.find((n) => n.isPlayer);
  if (!player) return [];

  const events: GameEvent[] = [];

  for (const action of state.playerActionQueue) {
    const result = executeAction(action, player, state.nations, state.edges, state.turn);
    if (result.event) {
      events.push(result.event);
    }

    // Set cooldown
    const meta = ACTION_META[action.type];
    state.playerCooldowns[action.type] = state.turn + meta.cooldown;

    // Deduct cost
    const cost = getEffectiveCost(action.type, player);
    player.gdp = Math.max(0.01, player.gdp - cost);
  }

  // Clear queue
  state.playerActionQueue = [];
  state.playerActionsUsedThisTurn = 0;

  // Recompute power stats for player
  const ec = state.edges.filter((e) => e.from === player.id || e.to === player.id).length;
  player.militaryPower = computeMilitaryPower(player);
  player.culturalPower = computeCulturalPower(player);
  player.diplomaticPower = computeDiplomaticPower(player, ec);

  return events;
}

// ─── Action Execution ───────────────────────────────────────

interface ActionResult {
  event: GameEvent | null;
}

let paEventId = 0;
function nextId(): string {
  return `pa-evt-${++paEventId}`;
}

function executeAction(
  action: PlayerAction,
  player: NationNode,
  nations: NationNode[],
  edges: TradeEdge[],
  turn: number
): ActionResult {
  const target = action.targetId ? nations.find((n) => n.id === action.targetId) : undefined;

  switch (action.type) {
    case "invest_industry": {
      const boost = 8 + Math.random() * 4;
      player.industrialization = clamp(player.industrialization + boost, 0, 100);
      player.gdp += 0.03;
      return {
        event: makeEvent(turn, "trade",
          `⚔️ ${player.name}: Inversión industrial (+${boost.toFixed(1)} industria)`,
          player.id),
      };
    }

    case "build_military": {
      player.militaryPower = clamp(player.militaryPower + 15, 1, 100);
      player.gdp = Math.max(0.01, player.gdp - 0.02);
      return {
        event: makeEvent(turn, "war",
          `⚔️ ${player.name}: Refuerzo militar (+15 poder)`,
          player.id),
      };
    }

    case "lower_tariffs": {
      for (const e of edges) {
        if (e.from === player.id || e.to === player.id) {
          e.tariffRate = clamp(e.tariffRate * 0.7, 0, 0.5);
        }
      }
      return {
        event: makeEvent(turn, "trade",
          `📉 ${player.name}: Aranceles reducidos — libre comercio`,
          player.id),
      };
    }

    case "raise_tariffs": {
      for (const e of edges) {
        if (e.from === player.id || e.to === player.id) {
          e.tariffRate = clamp(e.tariffRate * 1.3, 0, 0.5);
        }
      }
      return {
        event: makeEvent(turn, "trade",
          `📈 ${player.name}: Aranceles elevados — proteccionismo`,
          player.id),
      };
    }

    case "seek_trade": {
      if (!target) return { event: null };
      const exists = edges.some(
        (e) =>
          (e.from === player.id && e.to === target.id) ||
          (e.to === player.id && e.from === target.id)
      );
      if (!exists) {
        edges.push({
          id: `edge-player-${Date.now()}`,
          from: player.id,
          to: target.id,
          volume: 10 + Math.random() * 20,
          type: player.industrialization > 50 ? "manufactured" : "raw",
          tariffRate: 0.1,
        });
      }
      return {
        event: makeEvent(turn, "diplomacy",
          `🤝 ${player.name}: Nueva ruta comercial con ${target.name}`,
          player.id),
      };
    }

    case "spread_ideology": {
      player.culturalPower = clamp(player.culturalPower + 5, 1, 100);
      if (target) {
        // Increase ideological pressure on target
        target.unrest = clamp(target.unrest + 5, 0, 100);
        target.stability = clamp(target.stability - 3, 5, 95);
        return {
          event: makeEvent(turn, "ideology",
            `📢 ${player.name}: Expansión cultural hacia ${target.name}`,
            player.id),
        };
      }
      return {
        event: makeEvent(turn, "ideology",
          `📢 ${player.name}: Inversión en influencia cultural (+5)`,
          player.id),
      };
    }

    case "suppress_unrest": {
      player.unrest = clamp(player.unrest - 20, 0, 100);
      player.stability = clamp(player.stability + 10, 5, 95);
      player.gdp = Math.max(0.01, player.gdp - 0.02);
      return {
        event: makeEvent(turn, "diplomacy",
          `🛡️ ${player.name}: Orden restaurado (-20 descontento)`,
          player.id),
      };
    }

    case "build_infrastructure": {
      player.gdp += 0.05;
      player.industrialization = clamp(player.industrialization + 3, 0, 100);
      // Bonus: infrastructure improves all resource extraction
      player.resources.coal = clamp(player.resources.coal + 2, 0, 100);
      player.resources.iron = clamp(player.resources.iron + 2, 0, 100);
      return {
        event: makeEvent(turn, "trade",
          `🏗️ ${player.name}: Infraestructura construida (+0.05B GDP, +3 industria)`,
          player.id),
      };
    }

    case "diplomatic_pressure": {
      player.diplomaticPower = clamp(player.diplomaticPower + 10, 1, 100);
      player.culturalPower = clamp(player.culturalPower + 5, 1, 100);
      return {
        event: makeEvent(turn, "diplomacy",
          `🏛️ ${player.name}: Presión diplomática (+10 diplo, +5 cultura)`,
          player.id),
      };
    }

    case "colonial_expansion": {
      if (!target || target.worldClass !== "periphery") {
        return { event: makeEvent(turn, "crisis",
          `🏴 ${player.name}: Expansión colonial falló — objetivo no válido`,
          player.id) };
      }
      // Extract resources from colony
      target.resources.grain = clamp(target.resources.grain - 3, 0, 100);
      target.resources.cotton = clamp(target.resources.cotton - 3, 0, 100);
      target.stability = clamp(target.stability - 5, 5, 95);
      target.unrest = clamp(target.unrest + 10, 0, 100);
      player.resources.grain = clamp(player.resources.grain + 2, 0, 100);
      player.resources.cotton = clamp(player.resources.cotton + 2, 0, 100);
      return {
        event: makeEvent(turn, "war",
          `🏴 ${player.name}: Expansión colonial en ${target.name} — recursos extraídos`,
          player.id),
      };
    }

    default:
      return { event: null };
  }
}

// NOTE: The `state` reference in executeAction is the outer simulation state.
// We use a closure trick: the actual state is passed via `executePlayerActions`.
// The `makeEvent` helper below uses the caller-provided turn from closure.
let currentTurn = 0;

function makeEvent(turn: number, type: GameEvent["type"], text: string, nationId: string): GameEvent {
  return { id: nextId(), turn, text, type, nationId };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
