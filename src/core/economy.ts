// ============================================================
// Hegemonía Core Engine — Economy Model
// ============================================================
// Production, trade resolution, GDP calculation,
// resource extraction, social dynamics

import type { NationNode, TradeEdge, Ideology } from "./types";

/**
 * Phase 1: PRODUCTION
 * Each nation produces based on resources + industrialization + ideology modifiers
 */
export function phaseProduction(nations: NationNode[]): void {
  for (const n of nations) {
    // Base production from resources
    const resourceScore =
      n.resources.coal * 0.3 +
      n.resources.iron * 0.3 +
      n.resources.grain * 0.2 +
      n.resources.cotton * 0.2;

    // Industrialization multiplier (higher = more value-added)
    const indMultiplier = 1 + n.industrialization / 100;

    // Ideology modifiers on production
    const ideologyMod = productionIdeologyModifier(n.ideology);

    // Population factor (diminishing returns)
    const popFactor = Math.min(2, Math.sqrt(n.population / 10));

    // Calculate production value
    const production = resourceScore * indMultiplier * ideologyMod * popFactor * 0.1;

    // Update GDP (smooth: blend with previous to avoid jumps)
    const gdpGrowth = production * 0.05; // 5% of production becomes GDP growth
    n.gdp = Math.max(0.01, n.gdp + gdpGrowth * (0.8 + Math.random() * 0.4));

    // Natural resource depletion/regeneration
    n.resources.coal = clamp(n.resources.coal + (Math.random() - 0.48) * 0.5, 0, 100);
    n.resources.iron = clamp(n.resources.iron + (Math.random() - 0.48) * 0.3, 0, 100);
    n.resources.grain = clamp(n.resources.grain + (Math.random() - 0.45) * 0.8, 0, 100);
    n.resources.cotton = clamp(n.resources.cotton + (Math.random() - 0.45) * 0.6, 0, 100);

    // Industrialization grows slowly (faster for core, with coal+iron)
    const techGrowthRate =
      (n.worldClass === "core" ? 0.5 : n.worldClass === "semi" ? 0.3 : 0.1) *
      (1 + (n.resources.coal + n.resources.iron) / 200);
    n.industrialization = clamp(n.industrialization + techGrowthRate, 0, 100);
  }
}

function productionIdeologyModifier(ideology: Ideology): number {
  switch (ideology) {
    case "mercantilism":  return 1.15;  // State-sponsored production
    case "liberalism":    return 1.10;  // Market efficiency
    case "marxism":       return 0.90;  // Restructuring overhead
    case "nationalism":   return 1.12;  // Militarized industry
    case "conservatism":  return 0.95;  // Slow to adapt
    case "absolutism":    return 0.85;  // Inefficient central planning
    default:              return 1.0;
  }
}

/**
 * Phase 2: TRADE
 * Resolve trade flows, update volumes, compute balances
 */
export function phaseTrade(nations: NationNode[], edges: TradeEdge[]): GameLogEntry[] {
  const events: GameLogEntry[] = [];

  for (const e of edges) {
    const from = nations.find((n) => n.id === e.from);
    const to = nations.find((n) => n.id === e.to);
    if (!from || !to) continue;

    // Base volume fluctuation based on both economies
    const econFactor = (from.gdp + to.gdp) / 4;
    const demandFactor = 1 + (Math.random() - 0.5) * 0.15;

    // Tariff effects
    const tariffEffect = 1 - (e.tariffRate * 0.3);

    // Ideology trade modifiers
    const tradeMod = tradeIdeologyModifier(from.ideology, to.ideology);

    // Distance penalty (based on graph distance)
    const dx = from.x - to.x;
    const dy = from.y - to.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const distPenalty = 1 / (1 + dist * 0.01);

    // New volume
    const newVol = Math.max(1, e.volume * (0.95 + demandFactor * 0.05) * tariffEffect * tradeMod * distPenalty * 0.02 + econFactor * 0.1);
    e.volume = clamp(newVol, 1, 1000);

    // Type evolution: raw→manufactured as sender industrializes
    if (from.industrialization > 60 && e.type === "raw" && Math.random() < 0.05) {
      e.type = "manufactured";
    }
    if (from.industrialization > 80 && e.type === "manufactured" && Math.random() < 0.03) {
      e.type = "luxury";
    }
  }

  // Compute trade balances
  for (const n of nations) {
    let balance = 0;
    let totalTrade = 0;
    for (const e of edges) {
      if (e.from === n.id) { balance += e.volume; totalTrade += e.volume; }
      if (e.to === n.id) { balance -= e.volume; totalTrade += e.volume; }
    }
    n.tradeBalance = Math.round(balance);
  }

  // Occasionally spawn new trade routes
  if (Math.random() < 0.08) {
    const potentialPairs = findNewTradePairs(nations, edges);
    if (potentialPairs.length > 0) {
      const pair = potentialPairs[Math.floor(Math.random() * potentialPairs.length)];
      const newEdge: TradeEdge = {
        id: `edge-${Date.now()}`,
        from: pair.from,
        to: pair.to,
        volume: 5 + Math.random() * 20,
        type: pair.fromIndust > 50 ? "manufactured" : "raw",
        tariffRate: 0.1,
      };
      edges.push(newEdge);
      const fromN = nations.find((n) => n.id === pair.from);
      const toN = nations.find((n) => n.id === pair.to);
      events.push({
        type: "trade",
        text: `Nueva ruta comercial: ${fromN?.name ?? pair.from} ↔ ${toN?.name ?? pair.to}`,
        nationId: pair.from,
      });
    }
  }

  // Occasionally remove weak trade routes
  for (let i = edges.length - 1; i >= 0; i--) {
    if (edges[i].volume < 3 && Math.random() < 0.1) {
      const fromN = nations.find((n) => n.id === edges[i].from);
      const toN = nations.find((n) => n.id === edges[i].to);
      events.push({
        type: "crisis",
        text: `Ruta comercial colapsada: ${fromN?.name} ↔ ${toN?.name}`,
        nationId: edges[i].from,
      });
      edges.splice(i, 1);
    }
  }

  return events;
}

interface GameLogEntry {
  type: "trade" | "war" | "revolution" | "crisis" | "diplomacy" | "ideology";
  text: string;
  nationId?: string;
}

function tradeIdeologyModifier(fromIdeology: Ideology, toIdeology: Ideology): number {
  // Same ideology = better trade relations
  if (fromIdeology === toIdeology) return 1.1;
  // Compatible pairs
  const compatible: Record<string, Ideology[]> = {
    mercantilism: ["conservatism", "absolutism"],
    liberalism: ["mercantilism", "conservatism"],
    nationalism: ["absolutism", "conservatism"],
    conservatism: ["mercantilism", "liberalism", "nationalism", "absolutism"],
    absolutism: ["conservatism", "nationalism"],
    marxism: [],
  };
  if (compatible[fromIdeology]?.includes(toIdeology)) return 1.0;
  return 0.9; // default penalty for incompatible ideologies
}

function findNewTradePairs(
  nations: NationNode[],
  edges: TradeEdge[]
): { from: string; to: string; fromIndust: number }[] {
  const existing = new Set(edges.map((e) => `${e.from}-${e.to}`));
  const pairs: { from: string; to: string; fromIndust: number }[] = [];

  for (const n of nations) {
    for (const m of nations) {
      if (n.id === m.id) continue;
      const key = `${n.id}-${m.id}`;
      const revKey = `${m.id}-${n.id}`;
      if (existing.has(key) || existing.has(revKey)) continue;

      const dx = n.x - m.x;
      const dy = n.y - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 30 && Math.random() < 0.3) {
        pairs.push({ from: n.id, to: m.id, fromIndust: n.industrialization });
      }
    }
  }
  return pairs;
}

/**
 * Phase 3: IDEOLOGICAL SPREAD
 * Ideologies spread through trade connections
 */
export function phaseIdeologicalSpread(nations: NationNode[], edges: TradeEdge[]): GameLogEntry[] {
  const events: GameLogEntry[] = [];

  for (const n of nations) {
    // Find connected nations
    const partners = new Map<string, number>(); // nationId -> total trade volume
    for (const e of edges) {
      if (e.from === n.id) partners.set(e.to, (partners.get(e.to) ?? 0) + e.volume);
      if (e.to === n.id) partners.set(e.from, (partners.get(e.from) ?? 0) + e.volume);
    }

    // Ideological pressure from partners
    const ideologyPressure = new Map<Ideology, number>();
    let totalPressure = 0;

    for (const [partnerId, vol] of partners) {
      const partner = nations.find((p) => p.id === partnerId);
      if (!partner || partner.id === n.id) continue;

      // Cultural power + trade volume = pressure
      const pressure = partner.culturalPower * 0.01 * Math.sqrt(vol);
      ideologyPressure.set(partner.ideology, (ideologyPressure.get(partner.ideology) ?? 0) + pressure);
      totalPressure += pressure;
    }

    // Stability reduces spread susceptibility
    const susceptibility = (100 - n.stability) / 100;

    // Check if ideology changes
    if (totalPressure > 5 && Math.random() < 0.02 * susceptibility) {
      // Find most influential ideology
      let maxPressure = 0;
      let newIdeology: Ideology | null = null;
      for (const [ideo, pressure] of ideologyPressure) {
        if (pressure > maxPressure && ideo !== n.ideology) {
          maxPressure = pressure;
          newIdeology = ideo;
        }
      }

      if (newIdeology && maxPressure > totalPressure * 0.35) {
        const oldIdeology = n.ideology;
        n.ideology = newIdeology;
        events.push({
          type: "ideology",
          text: `${n.name}: Ideología cambia de ${oldIdeology} a ${newIdeology}`,
          nationId: n.id,
        });
      }
    }
  }

  return events;
}

/**
 * Phase 4: CLASS DYNAMICS
 * Social class shifts based on industrialization and economy
 */
export function phaseClassDynamics(nations: NationNode[]): GameLogEntry[] {
  const events: GameLogEntry[] = [];

  for (const n of nations) {
    const sc = n.socialClasses;

    // Industrialization shifts workers from peasant to working/middle
    const indShift = n.industrialization / 1000;

    if (n.industrialization > 30) {
      sc.peasant = clamp(sc.peasant - indShift * 2, 5, 95);
      sc.working = clamp(sc.working + indShift * 1.5, 5, 60);
      sc.middle = clamp(sc.middle + indShift * 0.5, 2, 40);
    }

    // Elite grows with GDP concentration
    const gdpConcentration = n.gdp / (n.population || 1);
    if (gdpConcentration > 0.1) {
      sc.elite = clamp(sc.elite + 0.02, 1, 20);
    }

    // Normalize to 100%
    const total = sc.elite + sc.middle + sc.working + sc.peasant;
    if (total > 0) {
      sc.elite = (sc.elite / total) * 100;
      sc.middle = (sc.middle / total) * 100;
      sc.working = (sc.working / total) * 100;
      sc.peasant = (sc.peasant / total) * 100;
    }

    // Stability based on inequality
    const inequality = sc.elite / Math.max(1, sc.working + sc.middle);
    const targetStability = clamp(100 - inequality * 20 - n.unrest * 0.5, 10, 95);
    n.stability += (targetStability - n.stability) * 0.1;
    n.stability = clamp(n.stability, 5, 95);

    // Unrest grows when working class is large but GDP per capita is low
    const workingPressure = sc.working / 100;
    const povertyPressure = Math.max(0, 1 - gdpConcentration * 5);
    n.unrest = clamp(n.unrest + workingPressure * povertyPressure * 0.3 - 0.1, 0, 100);

    // Revolution check!
    if (n.stability < 20 && n.unrest > 60 && Math.random() < 0.05) {
      n.stability = 40; // partial recovery
      n.unrest -= 30;
      n.socialClasses.elite = clamp(n.socialClasses.elite - 2, 1, 20);
      n.socialClasses.working = clamp(n.socialClasses.working + 2, 5, 60);
      events.push({
        type: "revolution",
        text: `Revolución social en ${n.name} — clases bajas se levantan`,
        nationId: n.id,
      });
    }
  }

  return events;
}

/**
 * Compute military power based on economy + population + ideology
 */
export function computeMilitaryPower(n: NationNode): number {
  const base = n.population * 0.02 + n.gdp * 5;
  const ideologyBonus: Record<Ideology, number> = {
    mercantilism: 1.1, liberalism: 0.9, marxism: 1.2,
    nationalism: 1.3, conservatism: 1.0, absolutism: 1.15,
  };
  return clamp(Math.round(base * (ideologyBonus[n.ideology] ?? 1)), 1, 100);
}

/**
 * Compute cultural power based on GDP + social structure
 */
export function computeCulturalPower(n: NationNode): number {
  const base = n.gdp * 10 + n.socialClasses.middle * 0.5;
  return clamp(Math.round(base), 1, 100);
}

/**
 * Compute diplomatic power based on trade connections + centrality
 */
export function computeDiplomaticPower(n: NationNode, edgeCount: number): number {
  const base = n.gdp * 8 + edgeCount * 2 + n.eigenvectorCentrality * 20;
  return clamp(Math.round(base), 1, 100);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
