// ============================================================
// Hegemonía Core Engine — NPC AI (Utility-Based Decision System)
// ============================================================
// Each NPC nation evaluates possible actions and picks the
// highest-utility one. Actions modify trade, tariffs, ideology,
// military, and diplomacy.

import type { NationNode, TradeEdge, NPCAction, Ideology } from "./types";
import { computeMilitaryPower, computeCulturalPower, computeDiplomaticPower } from "./economy";

/** Available NPC action types */
type ActionType =
  | "boost_production"
  | "boost_military"
  | "boost_diplomacy"
  | "boost_culture"
  | "change_tariff"
  | "seek_trade"
  | "spread_ideology"
  | "suppress_unrest";

/** Context for utility evaluation */
interface UtilityContext {
  nation: NationNode;
  nations: NationNode[];
  edges: TradeEdge[];
  globalThreat: number; // max military power in world
  avgGDP: number;
  edgeCount: number; // trade partners count
}

/**
 * Phase 5: NPC DECISIONS
 * Each NPC evaluates actions via utility scoring and executes the best one.
 */
export function phaseNPCDecisions(
  nations: NationNode[],
  edges: TradeEdge[]
): NPCAction[] {
  const npcNations = nations.filter((n) => !n.isPlayer);
  const actions: NPCAction[] = [];

  const globalThreat = Math.max(...nations.map((n) => n.militaryPower));
  const avgGDP = nations.reduce((s, n) => s + n.gdp, 0) / nations.length;

  for (const n of npcNations) {
    const edgeCount = edges.filter((e) => e.from === n.id || e.to === n.id).length;
    const ctx: UtilityContext = {
      nation: n,
      nations,
      edges,
      globalThreat,
      avgGDP,
      edgeCount,
    };

    // Evaluate all actions
    const candidates = [
      evalBoostProduction(ctx),
      evalBoostMilitary(ctx),
      evalBoostDiplomacy(ctx),
      evalBoostCulture(ctx),
      evalChangeTariff(ctx),
      evalSeekTrade(ctx),
      evalSpreadIdeology(ctx),
      evalSuppressUnrest(ctx),
    ].filter((a): a is NPCAction => a !== null);

    // Sort by utility descending
    candidates.sort((a, b) => b.utility - a.utility);

    // Execute the best action (skip if utility too low)
    if (candidates.length > 0 && candidates[0].utility > 0.2) {
      const action = candidates[0];
      executeAction(action, n, nations, edges);
      actions.push(action);
    }
  }

  return actions;
}

// ─── Action Evaluators ───

function evalBoostProduction(ctx: UtilityContext): NPCAction | null {
  const { nation } = ctx;
  // High utility when underproducing relative to peers
  const productionGap = ctx.avgGDP - nation.gdp;
  const utility = clamp(productionGap * 0.3 + (nation.worldClass === "core" ? 0.2 : 0.1), 0, 1);

  return {
    nationId: nation.id,
    action: "boost_production",
    utility,
    reasoning: `GDP gap: ${productionGap > 0 ? "+" : ""}${productionGap.toFixed(1)}B vs avg`,
  };
}

function evalBoostMilitary(ctx: UtilityContext): NPCAction | null {
  const { nation, globalThreat } = ctx;
  // High utility when militarily weak relative to threats
  const threat = (globalThreat - nation.militaryPower) / 100;
  const ideologyBonus = nation.primaryIdeology === "nationalism" ? 0.2 : nation.primaryIdeology === "absolutism" ? 0.15 : 0;
  const utility = clamp(threat * 0.6 + ideologyBonus, 0, 1);

  return {
    nationId: nation.id,
    action: "boost_military",
    utility,
    reasoning: `Threat level: ${(threat * 100).toFixed(0)}%`,
  };
}

function evalBoostDiplomacy(ctx: UtilityContext): NPCAction | null {
  const { nation, edgeCount } = ctx;
  // High utility when isolated or semi/core needing connections
  const isolationPenalty = edgeCount < 3 ? 0.3 : 0;
  const classBonus = nation.worldClass === "core" ? 0.2 : nation.worldClass === "semi" ? 0.1 : 0;
  const utility = clamp(isolationPenalty + classBonus + (100 - nation.diplomaticPower) / 300, 0, 1);

  return {
    nationId: nation.id,
    action: "boost_diplomacy",
    utility,
    reasoning: `${edgeCount} connections, diplo power: ${nation.diplomaticPower}`,
  };
}

function evalBoostCulture(ctx: UtilityContext): NPCAction | null {
  const { nation } = ctx;
  const utility = clamp((100 - nation.culturalPower) / 400 + (nation.worldClass === "core" ? 0.1 : 0), 0, 1);

  return {
    nationId: nation.id,
    action: "boost_culture",
    utility,
    reasoning: `Cultural power: ${nation.culturalPower}/100`,
  };
}

function evalChangeTariff(ctx: UtilityContext): NPCAction | null {
  const { nation, edges } = ctx;
  let avgTariff = 0;
  let count = 0;
  for (const e of edges) {
    if (e.from === nation.id || e.to === nation.id) {
      avgTariff += e.tariffRate;
      count++;
    }
  }
  avgTariff = count > 0 ? avgTariff / count : 0.1;

  // Mercantilists want high tariffs, liberals want low
  // Secondary ideologies nudge the ideal tariff slightly
  let idealTariff = nation.primaryIdeology === "mercantilism" ? 0.3
    : nation.primaryIdeology === "liberalism" ? 0.05
    : 0.15;
  if (nation.secondaryIdeologies.includes("liberalism")) idealTariff *= 0.85;
  if (nation.secondaryIdeologies.includes("mercantilism")) idealTariff *= 1.15;
  idealTariff = Math.min(0.5, Math.max(0, idealTariff));
  const gap = Math.abs(avgTariff - idealTariff);

  if (gap < 0.05) return null; // Already close to ideal

  const utility = clamp(gap * 2, 0, 0.8);
  return {
    nationId: nation.id,
    action: "change_tariff",
    utility,
    reasoning: `Avg tariff ${avgTariff.toFixed(2)}, ideal ${idealTariff.toFixed(2)}`,
  };
}

function evalSeekTrade(ctx: UtilityContext): NPCAction | null {
  const { nation, nations, edges } = ctx;
  // Find potential new trade partners
  const existing = new Set<string>();
  for (const e of edges) {
    if (e.from === nation.id) existing.add(e.to);
    if (e.to === nation.id) existing.add(e.from);
  }

  let bestTarget: NationNode | null = null;
  let bestScore = 0;

  for (const m of nations) {
    if (m.id === nation.id || existing.has(m.id)) continue;
    const dx = nation.x - m.x;
    const dy = nation.y - m.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 40) continue;

    const score = m.gdp * 2 + m.culturalPower - dist * 0.5;
    if (score > bestScore) {
      bestScore = score;
      bestTarget = m;
    }
  }

  if (!bestTarget || bestScore < 1) return null;

  const utility = clamp(bestScore / 10, 0, 0.7);
  return {
    nationId: nation.id,
    action: "seek_trade",
    targetId: bestTarget.id,
    utility,
    reasoning: `Target: ${bestTarget.name} (score: ${bestScore.toFixed(1)})`,
  };
}

function evalSpreadIdeology(ctx: UtilityContext): NPCAction | null {
  const { nation, edges } = ctx;
  // Only spread if culturally strong and ideological
  if (nation.culturalPower < 40) return null;

  // Count neighbors with different ideology
  let differentNeighbors = 0;
  for (const e of edges) {
    const neighborId = e.from === nation.id ? e.to : e.from;
    const neighbor = ctx.nations.find((n) => n.id === neighborId);
    if (neighbor && neighbor.primaryIdeology !== nation.primaryIdeology) differentNeighbors++;
  }

  if (differentNeighbors === 0) return null;

  const utility = clamp(nation.culturalPower / 200 + differentNeighbors * 0.05, 0, 0.5);
  return {
    nationId: nation.id,
    action: "spread_ideology",
    utility,
    reasoning: `${differentNeighbors} neighbors with different ideology`,
  };
}

function evalSuppressUnrest(ctx: UtilityContext): NPCAction | null {
  const { nation } = ctx;
  if (nation.unrest < 40) return null;

  const utility = clamp(nation.unrest / 100, 0, 0.9);
  return {
    nationId: nation.id,
    action: "suppress_unrest",
    utility,
    reasoning: `Unrest: ${nation.unrest.toFixed(0)}%`,
  };
}

// ─── Action Execution ───

function executeAction(
  action: NPCAction,
  nation: NationNode,
  nations: NationNode[],
  edges: TradeEdge[]
): void {
  switch (action.action) {
    case "boost_production":
      nation.gdp += 0.02 * (1 + nation.industrialization / 100);
      nation.resources.coal = clamp(nation.resources.coal + 1, 0, 100);
      nation.resources.iron = clamp(nation.resources.iron + 0.5, 0, 100);
      break;

    case "boost_military":
      nation.militaryPower = clamp(nation.militaryPower + 2, 1, 100);
      nation.gdp -= 0.01; // Military spending opportunity cost
      break;

    case "boost_diplomacy":
      nation.diplomaticPower = clamp(nation.diplomaticPower + 2, 1, 100);
      break;

    case "boost_culture":
      nation.culturalPower = clamp(nation.culturalPower + 2, 1, 100);
      break;

    case "change_tariff": {
      let idealTariff = nation.primaryIdeology === "mercantilism" ? 0.3
        : nation.primaryIdeology === "liberalism" ? 0.05
        : 0.15;
      if (nation.secondaryIdeologies.includes("liberalism")) idealTariff *= 0.85;
      if (nation.secondaryIdeologies.includes("mercantilism")) idealTariff *= 1.15;
      idealTariff = Math.min(0.5, Math.max(0, idealTariff));
      for (const e of edges) {
        if (e.from === nation.id || e.to === nation.id) {
          e.tariffRate += (idealTariff - e.tariffRate) * 0.3;
          e.tariffRate = clamp(e.tariffRate, 0, 0.5);
        }
      }
      break;
    }

    case "seek_trade": {
      if (!action.targetId) break;
      const existing = edges.some(
        (e) =>
          (e.from === nation.id && e.to === action.targetId) ||
          (e.to === nation.id && e.from === action.targetId)
      );
      if (!existing) {
        edges.push({
          id: `edge-npc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          from: nation.id,
          to: action.targetId,
          volume: 5 + Math.random() * 15,
          type: nation.industrialization > 50 ? "manufactured" : "raw",
          tariffRate: 0.1,
        });
      }
      break;
    }

    case "spread_ideology":
      nation.culturalPower = clamp(nation.culturalPower + 1, 1, 100);
      break;

    case "suppress_unrest":
      nation.unrest = clamp(nation.unrest - 15, 0, 100);
      nation.stability = clamp(nation.stability + 10, 5, 95);
      nation.gdp -= 0.02; // Suppression costs
      break;
  }

  // Recompute power stats
  const ec = edges.filter((e) => e.from === nation.id || e.to === nation.id).length;
  nation.militaryPower = computeMilitaryPower(nation);
  nation.culturalPower = computeCulturalPower(nation);
  nation.diplomaticPower = computeDiplomaticPower(nation, ec);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
