// ============================================================
// Hegemonía Core Engine — Main Simulation Loop
// ============================================================
// Orchestrates the 8-phase game turn and manages game state

import type { GameState, NationNode, TradeEdge, GameEvent, GDPSnapshot, Phase, GameOverResult } from "./types";
import { PHASE_LABELS } from "./types";
import { eigenvectorCentrality, betweennessCentrality } from "./algorithms";
import {
  phaseProduction,
  phaseTrade,
  phaseIdeologicalSpread,
  phaseClassDynamics,
  computeMilitaryPower,
  computeCulturalPower,
  computeDiplomaticPower,
} from "./economy";
import { phaseNPCDecisions } from "./npc-ai";
import { applyIdeologicalEffects } from "./ideologies";
import { executePlayerActions } from "./player-actions";
import { createInitialNations, createInitialEdges } from "./initial-data";

let eventIdCounter = 0;
function nextEventId(): string {
  return `evt-${++eventIdCounter}`;
}

/**
 * Create initial game state
 */
export function createGameState(): GameState {
  return {
    turn: 1,
    year: 1847,
    nations: createInitialNations(),
    edges: createInitialEdges(),
    events: [],
    historicalGDP: [],
    isPaused: true,
    speed: 2000,
    lastPhase: "",
    playerActionQueue: [],
    playerCooldowns: {},
    playerActionsUsedThisTurn: 0,
    maxActionsPerTurn: 2,
    gameMode: "ai" as const,
    aiDifficulty: "normal" as const,
    gameOver: null,
    playerProfile: null,
    lowStabilityTurns: 0,
    zeroTradeTurns: 0,
    peripheryTurns: 0,
    lowMilitaryTurns: 0,
    lastNPCActions: [],
  };
}

/**
 * Run one complete turn (all 8 phases)
 */
export function runTurn(state: GameState): void {
  const phases: Phase[] = [
    "production",
    "trade",
    "ideological_spread",
    "class_dynamics",
    "npc_decisions",
    "player_decisions",
    "classification_update",
    "metrics_update",
  ];

  for (const phase of phases) {
    runPhase(phase, state);
  }

  // Increment turn
  state.turn++;
  state.year++;

  // Snapshot GDP for historical chart
  const snapshot: GDPSnapshot = {
    turn: state.turn,
    year: state.year,
    data: {},
  };
  for (const n of state.nations) {
    snapshot.data[n.id] = Math.round(n.gdp * 100) / 100;
  }
  state.historicalGDP.push(snapshot);

  // Keep only last 50 snapshots
  if (state.historicalGDP.length > 50) {
    state.historicalGDP = state.historicalGDP.slice(-50);
  }

  // Check victory / defeat conditions
  checkWinLose(state);
}

/**
 * Run a single phase (for step-by-step mode)
 */
export function runPhase(phase: Phase, state: GameState): void {
  state.lastPhase = PHASE_LABELS[phase];

  switch (phase) {
    case "production":
      phaseProduction(state.nations);
      break;

    case "trade": {
      const tradeEvents = phaseTrade(state.nations, state.edges);
      for (const e of tradeEvents) {
        addEvent(state, e.type, e.text, e.nationId);
      }
      break;
    }

    case "ideological_spread": {
      const ideoEvents = phaseIdeologicalSpread(state.nations, state.edges);
      for (const e of ideoEvents) {
        addEvent(state, e.type, e.text, e.nationId);
      }
      break;
    }

    case "class_dynamics": {
      const classEvents = phaseClassDynamics(state.nations);
      for (const e of classEvents) {
        addEvent(state, e.type, e.text, e.nationId);
      }
      break;
    }

    case "npc_decisions": {
      const actions = phaseNPCDecisions(state.nations, state.edges);
      for (const a of actions) {
        const nation = state.nations.find((n) => n.id === a.nationId);
        addEvent(
          state,
          "diplomacy",
          `NPC ${nation?.name ?? a.nationId}: ${actionLabel(a.action)} (Utilidad: ${a.utility.toFixed(2)})`,
          a.nationId
        );
      }
      // Apply ideological mechanics after NPC decisions
      const ideoEffects = applyIdeologicalEffects(state.nations, state.edges);
      for (const e of ideoEffects) {
        addEvent(state, e.type, e.text, e.nationId);
      }
      break;
    }

    case "player_decisions": {
      const playerEvents = executePlayerActions(state);
      for (const e of playerEvents) {
        state.events.push(e);
      }
      // Trim events
      if (state.events.length > 100) state.events = state.events.slice(-100);
      break;
    }

    case "classification_update":
      updateClassification(state);
      break;

    case "metrics_update":
      updateMetrics(state);
      break;
  }
}

/**
 * Phase 7: CLASSIFICATION UPDATE (Wallerstein)
 * Reclassify nations based on trade patterns and centrality
 *
 * A nation is:
 * - CORE if: high centrality + exports manufactured + imports raw
 * - PERIPHERY if: low centrality + exports raw + imports manufactured
 * - SEMI-PERIPHERY: everything in between
 */
function updateClassification(state: GameState): void {
  for (const n of state.nations) {
    let manufacturedExports = 0;
    let rawExports = 0;
    let manufacturedImports = 0;
    let rawImports = 0;

    for (const e of state.edges) {
      if (e.from === n.id) {
        if (e.type === "manufactured" || e.type === "luxury") manufacturedExports += e.volume;
        else rawExports += e.volume;
      } else if (e.to === n.id) {
        if (e.type === "manufactured" || e.type === "luxury") manufacturedImports += e.volume;
        else rawImports += e.volume;
      }
    }

    const totalExports = manufacturedExports + rawExports;
    const totalImports = manufacturedImports + rawImports;

    // Core score: high centrality + exports manufactured goods
    const coreScore =
      n.eigenvectorCentrality * 0.4 +
      (totalExports > 0 ? manufacturedExports / totalExports : 0) * 0.3 +
      n.industrialization / 100 * 0.2 +
      (totalExports > 0 ? totalExports / (totalExports + totalImports + 1) : 0) * 0.1;

    // Periphery score: low centrality + exports raw
    const peripheryScore =
      (1 - n.eigenvectorCentrality) * 0.4 +
      (totalExports > 0 ? rawExports / totalExports : 0) * 0.3 +
      (1 - n.industrialization / 100) * 0.2 +
      (totalExports > 0 ? totalImports / (totalExports + totalImports + 1) : 0) * 0.1;

    const oldClass = n.worldClass;
    // Wider semi-periphery band (0.3-0.7 range) for more stable classification
    if (coreScore > 0.65) {
      n.worldClass = "core";
    } else if (peripheryScore > 0.65) {
      n.worldClass = "periphery";
    } else {
      n.worldClass = "semi";
    }

    // Log class changes (only if significant — not every turn)
    if (oldClass !== n.worldClass && Math.random() < 0.3) {
      addEvent(
        state,
        "ideology",
        `${n.name}: Clasificación cambia ${oldClass} → ${n.worldClass}`,
        n.id
      );
    }
  }
}

/**
 * Phase 8: METRICS UPDATE
 * Recompute centrality and power stats
 */
function updateMetrics(state: GameState): void {
  // Eigenvector centrality
  const ecMap = eigenvectorCentrality(state.nations, state.edges);
  for (const n of state.nations) {
    n.eigenvectorCentrality = ecMap.get(n.id) ?? 0;
  }

  // Betweenness centrality
  const bcMap = betweennessCentrality(state.nations, state.edges);
  for (const n of state.nations) {
    n.betweennessCentrality = bcMap.get(n.id) ?? 0;
  }

  // Recompute power stats
  for (const n of state.nations) {
    const ec = state.edges.filter((e) => e.from === n.id || e.to === n.id).length;
    n.militaryPower = computeMilitaryPower(n);
    n.culturalPower = computeCulturalPower(n);
    n.diplomaticPower = computeDiplomaticPower(n, ec);
  }
}

function addEvent(
  state: GameState,
  type: GameEvent["type"],
  text: string,
  nationId?: string
): void {
  state.events.push({
    id: nextEventId(),
    turn: state.turn,
    text,
    type,
    nationId,
  });

  // Keep last 100 events
  if (state.events.length > 100) {
    state.events = state.events.slice(-100);
  }
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    boost_production: "Impulsa producción",
    boost_military: "Fortalece ejército",
    boost_diplomacy: "Expande diplomacia",
    boost_culture: "Promueve cultura",
    change_tariff: "Ajusta aranceles",
    seek_trade: "Busca socios",
    spread_ideology: "Expande ideología",
    suppress_unrest: "Suprime descontento",
  };
  return labels[action] ?? action;
}

// ─── Victory / Defeat Conditions ───────────────────────────────

/**
 * Check all 8 victory conditions and 7 defeat conditions.
 * If a condition is met, set state.gameOver to a GameOverResult.
 */
function checkWinLose(state: GameState): void {
  if (state.gameOver) return; // already decided

  const player = state.nations.find((n) => n.isPlayer);
  if (!player) return;

  const totalNations = state.nations.length;
  const playerTradeEdges = state.edges.filter(
    (e) => e.from === player.id || e.to === player.id
  );
  const playerTradeVolume = playerTradeEdges.reduce((s, e) => s + e.volume, 0);
  const playerGDPShare = player.gdp / Math.max(0.01, state.nations.reduce((s, n) => s + n.gdp, 0));
  const ideologyMatchCount = state.nations.filter(
    (n) => n.primaryIdeology === player.primaryIdeology || n.secondaryIdeologies.includes(player.primaryIdeology)
  ).length;
  const ideologyShare = ideologyMatchCount / totalNations;
  const peripheryNations = state.nations.filter((n) => n.worldClass === "periphery");
  const maxMilitary = Math.max(...state.nations.map((n) => n.militaryPower));

  // ── Track persistent conditions for defeat thresholds ──
  if (player.stability < 20) state.lowStabilityTurns++;
  else state.lowStabilityTurns = Math.max(0, state.lowStabilityTurns - 1);

  if (playerTradeEdges.length === 0) state.zeroTradeTurns++;
  else state.zeroTradeTurns = Math.max(0, state.zeroTradeTurns - 1);

  if (player.worldClass === "periphery") state.peripheryTurns++;
  else state.peripheryTurns = Math.max(0, state.peripheryTurns - 1);

  if (player.militaryPower < 15) state.lowMilitaryTurns++;
  else state.lowMilitaryTurns = Math.max(0, state.lowMilitaryTurns - 1);

  const score = computeScore(player, state);
  const rank = computeRank(player, state.nations);

  // ── 8 VICTORY CONDITIONS ──

  // 1. dominación_económica: GDP share > 35%
  if (playerGDPShare > 0.35) {
    state.gameOver = {
      type: "victory",
      condition: "dominación_económica",
      reason: `Tu PIB domina el ${Math.round(playerGDPShare * 100)}% de la economía mundial.`,
      score, rank, totalNations, turn: state.turn, year: state.year,
    };
    return;
  }

  // 2. hegemonía_total: #1 in military AND cultural AND diplomatic
  if (
    player.militaryPower === maxMilitary &&
    player.culturalPower >= 80 &&
    player.diplomaticPower >= 80
  ) {
    state.gameOver = {
      type: "victory",
      condition: "hegemonía_total",
      reason: "Dominas simultáneamente en poder militar, cultural y diplomático.",
      score, rank, totalNations, turn: state.turn, year: state.year,
    };
    return;
  }

  // 3. victoria_ideológica: >60% of nations share your ideology
  if (ideologyShare > 0.6) {
    state.gameOver = {
      type: "victory",
      condition: "victoria_ideológica",
      reason: `El ${Math.round(ideologyShare * 100)}% de las naciones comparten tu ideología.`,
      score, rank, totalNations, turn: state.turn, year: state.year,
    };
    return;
  }

  // 4. supremacía_científica: industrialization > 90 AND core
  if (player.industrialization > 90 && player.worldClass === "core") {
    state.gameOver = {
      type: "victory",
      condition: "supremacía_científica",
      reason: "Tu industrialización avanza sin rival. Eres la potencia científica del mundo.",
      score, rank, totalNations, turn: state.turn, year: state.year,
    };
    return;
  }

  // 5. imperio_comercial: >8 trade routes AND total trade volume > 500
  if (playerTradeEdges.length > 8 && playerTradeVolume > 500) {
    state.gameOver = {
      type: "victory",
      condition: "imperio_comercial",
      reason: "Tu red comercial es la más extensa del mundo.",
      score, rank, totalNations, turn: state.turn, year: state.year,
    };
    return;
  }

  // 6. hegemonía_diplomática: diplomatic power > 90
  if (player.diplomaticPower > 90) {
    state.gameOver = {
      type: "victory",
      condition: "hegemonía_diplomática",
      reason: "Tu influencia diplomática es inigualable.",
      score, rank, totalNations, turn: state.turn, year: state.year,
    };
    return;
  }

  // 7. dominación_cultural: cultural power > 90
  if (player.culturalPower > 90) {
    state.gameOver = {
      type: "victory",
      condition: "dominación_cultural",
      reason: "Tu cultura domina el mundo.",
      score, rank, totalNations, turn: state.turn, year: state.year,
    };
    return;
  }

  // 8. imperio_colonial: trade with >75% of periphery nations
  const colonialTargets = peripheryNations.filter((pn) =>
    playerTradeEdges.some((e) => e.from === pn.id || e.to === pn.id)
  );
  if (peripheryNations.length > 0 && colonialTargets.length / peripheryNations.length > 0.75) {
    state.gameOver = {
      type: "victory",
      condition: "imperio_colonial",
      reason: "Dominas las rutas comerciales de la periferia mundial.",
      score, rank, totalNations, turn: state.turn, year: state.year,
    };
    return;
  }

  // ── 7 DEFEAT CONDITIONS ──

  // 1. revolución_interna: stability < 10 for 8+ consecutive turns
  if (player.stability < 10 && state.lowStabilityTurns >= 8) {
    state.gameOver = {
      type: "defeat",
      condition: "revolución_interna",
      reason: "Revolución interna: tu estabilidad colapsó y el pueblo se levantó.",
      score, rank, totalNations, turn: state.turn, year: state.year,
    };
    return;
  }

  // 2. ruina_económica: GDP < 0.05
  if (player.gdp < 0.05) {
    state.gameOver = {
      type: "defeat",
      condition: "ruina_económica",
      reason: "Tu economía se ha derrumbado completamente.",
      score, rank, totalNations, turn: state.turn, year: state.year,
    };
    return;
  }

  // 3. colapso_periférico: stuck in periphery for 20+ turns
  if (state.peripheryTurns >= 20) {
    state.gameOver = {
      type: "defeat",
      condition: "colapso_periférico",
      reason: "Tu nación quedó atrapada en la periferia mundial.",
      score, rank, totalNations, turn: state.turn, year: state.year,
    };
    return;
  }

  // 4. conquista_militar: military < 5 for 10+ consecutive turns
  if (player.militaryPower < 5 && state.lowMilitaryTurns >= 10) {
    state.gameOver = {
      type: "defeat",
      condition: "conquista_militar",
      reason: "Tu ejército es insignificante. Eres vulnerable a la conquista.",
      score, rank, totalNations, turn: state.turn, year: state.year,
    };
    return;
  }

  // 5. aislamiento_comercial: zero trade for 15+ consecutive turns
  if (state.zeroTradeTurns >= 15) {
    state.gameOver = {
      type: "defeat",
      condition: "aislamiento_comercial",
      reason: "Sin comercio durante demasiado tiempo. Tu nación está aislada.",
      score, rank, totalNations, turn: state.turn, year: state.year,
    };
    return;
  }

  // 6. sobreextensión: trade balance deeply negative AND stability < 30 AND gdp falling
  if (player.tradeBalance < -50 && player.stability < 30 && player.gdp < 0.1) {
    state.gameOver = {
      type: "defeat",
      condition: "sobreextensión",
      reason: "Sobreextensión: tus compromisos superan tu capacidad.",
      score, rank, totalNations, turn: state.turn, year: state.year,
    };
    return;
  }

  // 7. crisis_de_deuda: GDP < 0.02 AND tradeBalance < -30
  if (player.gdp < 0.02 && player.tradeBalance < -30) {
    state.gameOver = {
      type: "defeat",
      condition: "crisis_de_deuda",
      reason: "Crisis de deuda insostenible. Tu nación ha quebrado.",
      score, rank, totalNations, turn: state.turn, year: state.year,
    };
    return;
  }
}

/** Compute a score (0-1000) based on player nation stats */
function computeScore(player: NationNode, state: GameState): number {
  return Math.round(
    player.gdp * 200 +
    player.militaryPower * 3 +
    player.culturalPower * 3 +
    player.diplomaticPower * 3 +
    player.industrialization * 2 +
    player.stability * 1.5 +
    state.edges.filter((e) => e.from === player.id || e.to === player.id).length * 5
  );
}

/** Compute player's rank (1 = best) by composite power */
function computeRank(player: NationNode, nations: NationNode[]): number {
  const sorted = [...nations].sort(
    (a, b) =>
      (b.militaryPower + b.culturalPower + b.diplomaticPower + b.gdp * 10) -
      (a.militaryPower + a.culturalPower + a.diplomaticPower + a.gdp * 10)
  );
  return sorted.findIndex((n) => n.id === player.id) + 1;
}
