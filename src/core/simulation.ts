// ============================================================
// Hegemonía Core Engine — Main Simulation Loop
// ============================================================
// Orchestrates the 8-phase game turn and manages game state

import type { GameState, NationNode, TradeEdge, GameEvent, GDPSnapshot, Phase } from "./types";
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
